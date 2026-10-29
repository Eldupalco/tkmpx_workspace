import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { loadConfig, CONFIG_FILE } from './generate-module/config.mjs';
import { loadSchema, findModel, describeModel } from './generate-module/schema.mjs';
import { buildNames } from './generate-module/naming.mjs';
import { buildPaths } from './generate-module/paths.mjs';
import { bestDisplayFields } from './generate-module/fields.mjs';
import { registerModule } from './generate-module/app-module.mjs';
import { createDtoTemplate, updateDtoTemplate, queryDtoTemplate } from './generate-module/templates/dto.mjs';
import { selectTemplate, viewTemplate } from './generate-module/templates/view.mjs';
import { serviceTemplate } from './generate-module/templates/service.mjs';
import { controllerTemplate } from './generate-module/templates/controller.mjs';
import { rolesGuardTemplate } from './generate-module/templates/roles-guard.mjs';
import { RunRecorder, listRuns, undoRun, BACKUP_DIR } from './generate-module/history.mjs';
import {
  GENERATED_MARKER,
  moduleTemplate,
  controllerSpecTemplate,
  serviceSpecTemplate,
} from './generate-module/templates/module.mjs';

// File groups for --only=<groups>
const ONLY_GROUPS = {
  dto: ['createDto', 'updateDto', 'queryDto'],
  views: ['view', 'select'],
  service: ['service'],
  controller: ['controller'],
  module: ['module'],
  spec: ['serviceSpec', 'controllerSpec'],
};

// Parse command line arguments
const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith('--only='));
const undoArg = args.find((a) => a === '--undo' || a.startsWith('--undo='));
const flags = {
  undo: undoArg ? undoArg.slice('--undo='.length) || true : false,
  listBackups: args.includes('--list-backups'),
  force: args.includes('--force') || args.includes('-f'),
  spec: args.includes('--spec'),
  all: args.includes('--all'),
  dryRun: args.includes('--dry-run'),
  public: args.includes('--public'),
  printConfig: args.includes('--print-config'),
  only: onlyArg ? onlyArg.slice('--only='.length).split(',').filter(Boolean) : null,
};
const rawInput = args.find((a) => !a.startsWith('-'));

const root = process.cwd();
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
// Backs up and records every path this run touches, for --undo
const recorder = new RunRecorder(root, args);

const INT_FILTER_KEYWORDS = /day|status|type/i;
const STRING_FILTER_KEYWORDS = /status|role|type|date|category/i;

// Derive every field list the templates need from the described model
function buildLists(model, config, warnings) {
  const { fields, id } = model;

  const filterFields = fields.filter((f) => {
    if (f.isId || f.isAudit || f.isSensitive || f.isList) return false;
    if (f.kind === 'enum' || f.type === 'Boolean') return true;
    if (f.type !== 'String' && f.type !== 'Int') return false;
    if (f.isFk) return true;
    return (f.type === 'Int' ? INT_FILTER_KEYWORDS : STRING_FILTER_KEYWORDS).test(f.name);
  });

  let passwordFields = fields.filter((f) => f.type === 'String' && !f.isList && /password/i.test(f.name));
  if (passwordFields.length > 0 && !config.passwordHashing) {
    warnings.push(`No argon2/bcrypt dependency: ${passwordFields.map((f) => f.name).join(', ')} will be stored unhashed.`);
    passwordFields = [];
  }

  const sortFields = fields.filter((f) => !f.isSensitive && !f.isFk && !f.isList && f.type !== 'Json');

  return {
    createFields: fields.filter((f) => !f.isAudit && (!f.isId || id.inCreateDto)),
    viewFields: fields.filter((f) => !f.isSensitive && !f.isFk),
    sortFields,
    defaultSort: sortFields.some((f) => f.name === 'createdAt') ? 'createdAt' : id.name,
    searchFields: fields.filter(
      (f) => f.kind === 'scalar' && f.type === 'String' && !f.isId && !f.isSensitive && !f.isFk && !f.isList,
    ),
    filterFields,
    passwordFields,
    auditOnCreate: fields.filter((f) => f.isAudit && !f.isUpdatedAt && !f.hasDefault && f.isRequired),
    auditOnUpdate: fields.filter((f) => f.name === 'updatedAt' && !f.isUpdatedAt),
    relations: model.relations.map((r) => ({ ...r, displayFields: bestDisplayFields(r.targetFields) })),
  };
}

function collectWarnings(model) {
  return model.unsupportedFields.map((f) => {
    const impact = f.isRequired && !f.hasDefault ? ' Create will fail until it is handled manually.' : '';
    return `Field "${f.name}" (${f.type}) is not supported and was skipped.${impact}`;
  });
}

// Feature switches for the templates, from the resolved config and CLI flags
function buildOptions(config, deps) {
  const guard = flags.public ? false : config.authGuard;
  const guardFile = typeof guard === 'object' && guard ? path.resolve(guard.path + '.ts') : null;
  return {
    guard,
    access: guard ? config.accessControl : false,
    envelope: config.responseEnvelope,
    filter: config.prismaExceptionFilter,
    hashing: config.passwordHashing,
    testFramework: config.testFramework,
    jwtMock: Boolean(guardFile && deps['@nestjs/jwt'] && fs.existsSync(guardFile) && fs.readFileSync(guardFile, 'utf8').includes('JwtService')),
  };
}

// 'missing' | 'generated' (safe to overwrite) | 'foreign' (hand-written, never overwritten)
function ownership(moduleDir, filePaths) {
  if (!fs.existsSync(moduleDir)) return 'missing';
  const moduleFile = `${filePaths.module}.ts`;
  if (fs.existsSync(moduleFile) && fs.readFileSync(moduleFile, 'utf8').includes(GENERATED_MARKER)) return 'generated';
  // Modules from earlier generator versions have no marker but always a *.select.ts
  return fs.existsSync(`${filePaths.select}.ts`) ? 'generated' : 'foreign';
}

// Generated class names must not clash with classes elsewhere (e.g. model "App" → AppModule)
function classConflicts(index, moduleDir, classNames) {
  return index
    .all()
    .filter((s) => !s.file.startsWith(moduleDir + path.sep))
    .flatMap((s) => classNames.filter((c) => new RegExp(`\\bclass\\s+${c}\\b`).test(s.text)).map((c) => `${c} in ${rel(s.file)}`));
}

const extraFormatFiles = new Set();

// Create the shared RolesGuard once when access control needs it and the project has none
function ensureRolesGuard(config, options) {
  if (!options.access) return;
  const file = path.resolve(`${config.rolesGuard.path}.ts`);
  if (fs.existsSync(file)) return;
  if (!flags.dryRun) {
    recorder.track(file);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, rolesGuardTemplate(config.accessControl));
    extraFormatFiles.add(file);
  }
  console.log(`🛂 ${flags.dryRun ? 'Would create' : 'Created'} ${rel(file)} (RolesGuard + @Roles)`);
}

// Generate a single module; returns 'generated' | 'skipped'
function generateModule(schema, resolved, input) {
  const { values: config, deps, index } = resolved;
  const prismaModel = findModel(schema, input);
  if (!prismaModel) {
    throw new Error(`No model matching "${input}" in ${config.schema}. Add the model and run "npx prisma generate" first.`);
  }

  // Names come from the model, so "tickets" and "Ticket" always produce the same module
  const names = buildNames(prismaModel.name);
  const { moduleDir, files: filePaths, imp } = buildPaths(config, names, root);
  const state = ownership(moduleDir, filePaths);

  if (state === 'foreign') {
    throw new Error(`${rel(moduleDir)} exists and was not created by the generator. It is never overwritten; rename the model or move that folder.`);
  }
  const conflicts = classConflicts(index, moduleDir, [`${names.pascalName}Module`, `${names.pascalName}Controller`, `${names.pascalName}Service`]);
  if (conflicts.length > 0) {
    throw new Error(`Generated class names already exist: ${conflicts.join(', ')}. Rename the model to avoid the clash.`);
  }
  if (flags.only && state !== 'generated') {
    throw new Error(`--only needs an existing generated module; ${rel(moduleDir)} does not exist yet.`);
  }
  if (state === 'generated' && !flags.force && !flags.only) {
    console.error(`⏭️  "${rel(moduleDir)}" already exists. Pass "--force" to overwrite (a backup is kept) or "--only=<groups>".`);
    return 'skipped';
  }

  const model = describeModel(schema, prismaModel);
  const warnings = collectWarnings(model);
  const options = buildOptions(config, deps);
  if (!config.authGuard && !flags.public) warnings.push('No auth guard found: endpoints are public.');
  if (options.guard && !options.access) warnings.push('No role claim configured: any authenticated user can create, update and delete.');

  const ctx = { names, model, schema, config, options, imp, lists: buildLists(model, config, warnings) };

  const templates = {
    createDto: createDtoTemplate,
    updateDto: updateDtoTemplate,
    queryDto: queryDtoTemplate,
    view: viewTemplate,
    select: selectTemplate,
    service: serviceTemplate,
    controller: controllerTemplate,
    module: moduleTemplate,
  };
  const wantSpecs = flags.spec || flags.only?.includes('spec');
  if (wantSpecs && options.testFramework) {
    templates.serviceSpec = serviceSpecTemplate;
    templates.controllerSpec = controllerSpecTemplate;
  } else if (wantSpecs) {
    warnings.push('Specs skipped: neither vitest nor jest is installed.');
  }

  let keys = Object.keys(templates);
  if (flags.only) {
    const wanted = new Set(flags.only.flatMap((g) => ONLY_GROUPS[g]));
    keys = keys.filter((k) => wanted.has(k));
  }
  const output = keys.map((key) => [`${filePaths[key]}.ts`, templates[key](ctx)]);

  console.log(`ℹ️  Model "${model.modelName}": ${model.fields.length} fields, ${model.relations.length} relations.`);
  if (keys.includes('controller')) ensureRolesGuard(config, options);

  if (!flags.dryRun) {
    if (flags.only) {
      for (const [file] of output) recorder.track(file);
    } else {
      const saved = recorder.track(moduleDir);
      if (saved) console.log(`💾 Backed up existing module to ${saved}`);
      if (state === 'generated') fs.rmSync(moduleDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
    for (const [file, content] of output) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    }
  }

  const verb = flags.dryRun ? 'Would write' : flags.only ? 'Updated' : 'Created';
  console.log(`🎉 ${verb} ${rel(moduleDir)}/`);
  for (const [file] of output) console.log(`   ${path.relative(moduleDir, file).split(path.sep).join('/')}`);

  // Auto-register into the root module
  const appModulePath = path.resolve(config.appModule);
  if (fs.existsSync(appModulePath)) {
    let importPath = path.relative(path.dirname(appModulePath), filePaths.module).split(path.sep).join('/');
    if (!importPath.startsWith('.')) importPath = `./${importPath}`;
    const result = registerModule(fs.readFileSync(appModulePath, 'utf8'), {
      className: `${names.pascalName}Module`,
      importPath: importPath + config.importExtension,
    });
    if (result.status === 'registered') {
      if (!flags.dryRun) {
        recorder.track(appModulePath);
        fs.writeFileSync(appModulePath, result.source);
        extraFormatFiles.add(appModulePath);
      }
      console.log(`🔗 ${flags.dryRun ? 'Would register' : 'Registered'} ${names.pascalName}Module in ${config.appModule}`);
    } else if (result.status === 'no-imports-array') {
      warnings.push(`Could not find "imports: [...]" in ${config.appModule}. Register ${names.pascalName}Module manually.`);
    }
  } else {
    warnings.push(`${config.appModule} not found. Register ${names.pascalName}Module manually.`);
  }

  if (ctx.lists.passwordFields.length > 0) {
    console.log(`🔐 Hashed with ${config.passwordHashing} on create/update: ${ctx.lists.passwordFields.map((f) => f.name).join(', ')}`);
  }
  if (options.access) console.log(`🛂 Create/update/delete limited to role: ${options.access.writeRoles.join(', ')}`);
  const hidden = model.fields.filter((f) => f.isSensitive).map((f) => f.name);
  if (hidden.length > 0) console.log(`🛡️  Hidden from responses: ${hidden.join(', ')}`);
  for (const w of warnings) console.warn(`⚠️  ${w}`);
  console.log('');

  // Only the written files are formatted, so --only never reformats hand-edited files
  return { status: 'generated', written: flags.only ? output.map(([file]) => file) : [moduleDir] };
}

function formatWithPrettier(targets) {
  const quoted = targets.map((t) => `"${rel(t)}"`).join(' ');
  try {
    execSync(`npx --no-install prettier --write ${quoted}`, { stdio: 'pipe' });
  } catch (error) {
    const reason = String(error.stderr || error.message).split('\n')[0];
    console.warn(`⚠️  Prettier failed, files are unformatted: ${reason}`);
  }
}

function printConfig(resolved) {
  console.log(`Resolved generator settings (${CONFIG_FILE} overrides detected values):\n`);
  for (const [key, value] of Object.entries(resolved.values)) {
    console.log(`  ${key.padEnd(22)} ${JSON.stringify(value).padEnd(60)} ${resolved.sources[key]}`);
  }
  for (const note of resolved.notes) console.log(`\n⚠️  ${note}`);
}

function printRuns() {
  const runs = listRuns(root);
  if (runs.length === 0) {
    console.log(`No generator runs recorded in ${BACKUP_DIR}/.`);
    return;
  }
  console.log(`Generator runs in ${BACKUP_DIR}/ (oldest first):\n`);
  for (const { id, manifest } of runs) {
    if (!manifest) {
      console.log(`  ${id}  backup only (older version, restore manually)`);
      continue;
    }
    const status = manifest.undoneAt ? `undone ${manifest.undoneAt}` : 'active';
    const created = manifest.entries.filter((e) => !e.existed).map((e) => e.path);
    const changed = manifest.entries.filter((e) => e.existed).map((e) => e.path);
    console.log(`  ${id}  [${status}]  gen:module ${manifest.command}`);
    if (created.length) console.log(`      created:  ${created.join(', ')}`);
    if (changed.length) console.log(`      replaced: ${changed.join(', ')}`);
  }
}

function runUndo() {
  try {
    const { run, actions } = undoRun(root, flags.undo === true ? null : flags.undo, { force: flags.force, dryRun: flags.dryRun });
    console.log(`${flags.dryRun ? '🔍 Would undo' : '↩️  Undid'} run ${run.id} (gen:module ${run.command}):`);
    for (const action of actions) console.log(`   ${action}`);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}

function checkNodeVersion() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 20 || (major === 20 && minor < 1)) {
    console.error(`❌ Node.js 20.1 or later is required (current ${process.versions.node}).`);
    process.exit(1);
  }
}

async function main() {
  checkNodeVersion();

  // History commands work without schema or project detection
  if (flags.listBackups) {
    printRuns();
    process.exit(0);
  }
  if (flags.undo) {
    runUndo();
    process.exit(0);
  }

  let resolved;
  try {
    resolved = loadConfig(root);
  } catch (error) {
    console.error(`❌ Generator settings: ${error.message}`);
    process.exit(1);
  }
  const { values: config, packageManager: pm } = resolved;

  if (flags.printConfig) {
    printConfig(resolved);
    process.exit(0);
  }

  const unknownGroups = (flags.only ?? []).filter((g) => !ONLY_GROUPS[g]);
  if (flags.only && (flags.only.length === 0 || unknownGroups.length > 0)) {
    console.error(`❌ --only accepts: ${Object.keys(ONLY_GROUPS).join(', ')} (comma-separated).`);
    process.exit(1);
  }

  if (!flags.all && !rawInput) {
    console.error('❌ Please provide a model name or pass "--all"!');
    console.log(`👉 Example: ${pm} gen:module users`);
    console.log(`👉 Overwrite (keeps a backup in .gen-backup/): ${pm} gen:module users --force`);
    console.log(`👉 Refresh only schema-derived files after a schema change: ${pm} gen:module users --only=dto,views`);
    console.log(`👉 Preview without writing: ${pm} gen:module users --dry-run`);
    console.log(`👉 All models: ${pm} gen:module --all --force`);
    console.log(`👉 Revert the last run: ${pm} gen:module --undo (list runs: --list-backups)`);
    console.log('👉 Other flags: --spec (test files), --public (no auth guard), --print-config');
    process.exit(1);
  }

  for (const note of resolved.notes) console.warn(`⚠️  ${note}`);

  let schema;
  try {
    schema = await loadSchema(root, config.schema);
  } catch (error) {
    console.error(`❌ ${config.schema} could not be parsed:\n${error.message}`);
    process.exit(1);
  }
  if (!schema) {
    console.error(`❌ Prisma schema not found at ${config.schema}. Set "schema" in ${CONFIG_FILE}.`);
    process.exit(1);
  }

  const targets = flags.all ? schema.models.map((m) => m.name) : [rawInput];
  if (targets.length === 0) {
    console.error(`❌ No models found in ${config.schema}!`);
    process.exit(1);
  }
  if (flags.dryRun) console.log('🔍 Dry run: nothing will be written.\n');

  const results = { generated: [], skipped: [], failed: [] };
  const written = [];
  for (const target of targets) {
    try {
      const result = generateModule(schema, resolved, target);
      if (result === 'skipped') {
        results.skipped.push(target);
      } else {
        results.generated.push(target);
        written.push(...result.written);
      }
    } catch (error) {
      console.error(`❌ ${target}: ${error.message}\n`);
      results.failed.push(target);
    }
  }

  if (!flags.dryRun && written.length > 0 && config.format) {
    formatWithPrettier([...written, ...extraFormatFiles]);
  }
  const recorded = flags.dryRun ? null : recorder.finish();
  if (recorded) console.log(`💾 Backup and undo record: ${recorded} (revert with "${pm} gen:module --undo")`);

  const summary = [`${results.generated.length} ${flags.dryRun ? 'planned' : 'generated'}`];
  if (results.skipped.length) summary.push(`${results.skipped.length} skipped (${results.skipped.join(', ')})`);
  if (results.failed.length) summary.push(`${results.failed.length} failed (${results.failed.join(', ')})`);
  console.log(`${results.failed.length ? '❌' : '✨'} ${summary.join(', ')}.`);
  if (results.generated.length > 0 && !flags.dryRun) {
    console.log('👉 Run "npx prisma generate" if the schema changed since the client was last generated.');
  }

  process.exit(results.failed.length > 0 ? 1 : 0);
}

await main();
