import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export const CONFIG_FILE = 'gen-module.config.json';

// Resolve generator settings: gen-module.config.json values win, everything else is
// detected from the target project. Paths are relative to the project root, without extension.
export function loadConfig(root = process.cwd()) {
  const file = path.join(root, CONFIG_FILE);
  const user = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const pkg = readJson(path.join(root, 'package.json')) ?? {};
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const values = {};
  const sources = {};
  const set = (key, detect) => {
    if (user[key] !== undefined) {
      values[key] = user[key];
      sources[key] = 'config';
    } else {
      values[key] = detect();
      sources[key] = 'detected';
    }
  };

  set('srcDir', () => readJson(path.join(root, 'nest-cli.json'))?.sourceRoot ?? 'src');
  set('schema', () => detectSchemaPath(root, pkg));
  set('appModule', () => `${values.srcDir}/app.module.ts`);
  set('importExtension', () => detectImportExtension(root));
  set('passwordHashing', () => ['argon2', 'bcrypt', 'bcryptjs'].find((d) => deps[d]) ?? false);
  set('testFramework', () => ['vitest', 'jest'].find((d) => deps[d]) ?? false);
  set('format', () => Boolean(deps.prettier));

  // Remaining settings need the project's source files and the Prisma generator block
  const sourceFiles = new SourceIndex(root, path.join(root, values.srcDir));
  const generator = readGenerator(root, values.schema);
  set('prismaClient', () => generator.client);
  set('prismaEnums', () => generator.enums);
  sourceFiles.exclude(values.prismaClient);

  set('prismaService', () => detectPrismaService(root, sourceFiles));
  set('authGuard', () => detectAuthGuard(root, sourceFiles));
  set('accessControl', () => detectAccessControl(values.authGuard, sourceFiles));
  set('rolesGuard', () => detectRolesGuard(root, values.srcDir, sourceFiles));
  set('prismaExceptionFilter', () => detectExceptionFilter(sourceFiles));
  set('responseEnvelope', () => detectResponseEnvelope(sourceFiles));
  set('layout', () => detectLayout(path.join(root, values.srcDir)));

  validate(values);
  const notes = [...checkValidationPipe(sourceFiles), ...checkParserVersion(root)];
  return { values, sources, deps, notes, index: sourceFiles, packageManager: detectPackageManager(root) };
}

function validate(values) {
  if (!['nested', 'flat'].includes(values.layout)) throw new Error(`"layout" must be "nested" or "flat".`);
  if (![false, 'argon2', 'bcrypt', 'bcryptjs'].includes(values.passwordHashing)) {
    throw new Error(`"passwordHashing" must be "argon2", "bcrypt", "bcryptjs" or false.`);
  }
  if (![false, 'vitest', 'jest'].includes(values.testFramework)) throw new Error(`"testFramework" must be "vitest", "jest" or false.`);
  if (!values.prismaService) {
    throw new Error(`No class extending PrismaClient found. Set "prismaService": { "path", "className" } in ${CONFIG_FILE}.`);
  }
  const ac = values.accessControl;
  if (ac && (typeof ac.roleClaim !== 'string' || !Array.isArray(ac.writeRoles) || ac.writeRoles.length === 0)) {
    throw new Error(`"accessControl" must be false or { "roleClaim": "role", "writeRoles": ["admin"] }.`);
  }
  if (ac && !values.authGuard) throw new Error(`"accessControl" needs an "authGuard" to identify the user.`);
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  const { config, error } = ts.parseConfigFileTextToJson(file, fs.readFileSync(file, 'utf8'));
  return error ? null : config;
}

function detectSchemaPath(root, pkg) {
  const configFiles = fs
    .readdirSync(root)
    .filter((f) => /^prisma[\w-]*\.config\.[cm]?[jt]s$/.test(f))
    .map((f) => path.join(root, f));
  const dotConfig = path.join(root, '.config', 'prisma.ts');
  if (fs.existsSync(dotConfig)) configFiles.push(dotConfig);

  for (const file of configFiles) {
    const match = fs.readFileSync(file, 'utf8').match(/schema\s*:\s*["'`]([^"'`]+)["'`]/);
    if (match) return path.relative(root, path.resolve(path.dirname(file), match[1])).split(path.sep).join('/');
  }
  if (pkg.prisma?.schema) return pkg.prisma.schema;
  return fs.existsSync(path.join(root, 'prisma', 'schema.prisma')) ? 'prisma/schema.prisma' : 'prisma/schema';
}

// .prisma files of a single-file or multi-file (folder) schema
export function readSchemaFiles(root, schema) {
  const target = path.resolve(root, schema);
  if (!fs.existsSync(target)) return [];
  if (fs.statSync(target).isFile()) return [[target, fs.readFileSync(target, 'utf8')]];
  return fs
    .readdirSync(target, { recursive: true })
    .filter((f) => f.endsWith('.prisma'))
    .map((f) => path.join(target, f))
    .map((f) => [f, fs.readFileSync(f, 'utf8')]);
}

// Where the generated client and enums are imported from, based on the generator block
export function parseGenerator(files, root) {
  for (const [file, content] of files) {
    for (const [, body] of content.matchAll(/generator\s+\w+\s*\{([^}]*)\}/g)) {
      const provider = body.match(/provider\s*=\s*"([^"]+)"/)?.[1];
      const output = body.match(/output\s*=\s*"([^"]+)"/)?.[1];
      const outDir = output && path.relative(root, path.resolve(path.dirname(file), output)).split(path.sep).join('/');

      if (provider === 'prisma-client') {
        if (!outDir) throw new Error(`Generator "prisma-client" in ${path.relative(root, file)} has no output path.`);
        return { client: `${outDir}/client`, enums: `${outDir}/enums` };
      }
      if (provider === 'prisma-client-js') {
        return outDir ? { client: `${outDir}/index`, enums: `${outDir}/index` } : { client: '@prisma/client', enums: '@prisma/client' };
      }
    }
  }
  return { client: '@prisma/client', enums: '@prisma/client' };
}

function readGenerator(root, schema) {
  return parseGenerator(readSchemaFiles(root, schema), root);
}

function detectImportExtension(root) {
  const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) return '';
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(configPath));
  const esmNode = [ts.ModuleKind.Node16, ts.ModuleKind.NodeNext].includes(options.module) ||
    [ts.ModuleResolutionKind.Node16, ts.ModuleResolutionKind.NodeNext].includes(options.moduleResolution);
  return esmNode ? '.js' : '';
}

function detectPackageManager(root) {
  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm run';
  if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(root, 'bun.lock')) || fs.existsSync(path.join(root, 'bun.lockb'))) return 'bun run';
  return 'npm run';
}

// Lazily read .ts files under srcDir, skipping specs and the generated Prisma client
class SourceIndex {
  constructor(root, dir) {
    this.root = root;
    this.dir = dir;
    this.excluded = [];
    this.files = null;
  }

  exclude(target) {
    if (target && !isPackage(target)) this.excluded.push(path.resolve(this.root, path.dirname(target)));
  }

  all() {
    if (this.files) return this.files;
    const list = fs.existsSync(this.dir) ? fs.readdirSync(this.dir, { recursive: true }) : [];
    this.files = list
      .map((f) => path.join(this.dir, f))
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts') && !f.endsWith('.d.ts'))
      .filter((f) => !f.includes(`${path.sep}node_modules${path.sep}`))
      .filter((f) => !this.excluded.some((ex) => f.startsWith(ex + path.sep)))
      .map((f) => ({ file: f, text: fs.readFileSync(f, 'utf8') }));
    return this.files;
  }

  find(regex) {
    for (const entry of this.all()) {
      const match = entry.text.match(regex);
      if (match) return { ...entry, match };
    }
    return null;
  }

  some(predicate) {
    return this.all().some(predicate);
  }
}

export function isPackage(target) {
  return target.startsWith('@') || !target.includes('/');
}

function toConfigPath(root, file) {
  return path.relative(root, file).replace(/\.ts$/, '').split(path.sep).join('/');
}

function detectPrismaService(root, sources) {
  const hit = sources.find(/export\s+class\s+(\w+)\s+extends\s+PrismaClient\b/);
  return hit ? { path: toConfigPath(root, hit.file), className: hit.match[1] } : null;
}

// A guard registered through APP_GUARD protects every route already
function detectAuthGuard(root, sources) {
  if (sources.some((s) => /provide\s*:\s*APP_GUARD\b/.test(s.text))) return 'global';
  const hit = sources.find(/export\s+class\s+(JwtAuthGuard)\b/) ?? sources.find(/export\s+class\s+(\w*Auth\w*Guard)\b/);
  if (!hit) return false;
  const className = hit.match[1];
  return { path: toConfigPath(root, hit.file), className, module: detectProvidingModule(root, sources, className) };
}

// The module exporting the guard must be imported unless it is @Global(); null when no import is needed
function detectProvidingModule(root, sources, className) {
  const exporting = sources
    .all()
    .find((s) => /@Module\(/.test(s.text) && new RegExp(`exports\\s*:\\s*\\[[^\\]]*\\b${className}\\b`).test(s.text));
  if (!exporting || /@Global\(\)/.test(exporting.text)) return null;
  const moduleClass = exporting.text.match(/export\s+class\s+(\w+)/)?.[1];
  return moduleClass ? { path: toConfigPath(root, exporting.file), className: moduleClass } : null;
}

// Role-based writes need a role claim in the JWT payload
function detectAccessControl(authGuard, sources) {
  if (!authGuard) return false;
  const signed = sources.find(/\.sign(?:Async)?\(\s*\{([^}]*)\}/);
  const claim = signed?.match[1].match(/\b(roles?)\b/)?.[1];
  return claim ? { roleClaim: claim, writeRoles: ['admin'] } : false;
}

// An existing RolesGuard + Roles decorator is reused; otherwise the generator creates one at this path
function detectRolesGuard(root, srcDir, sources) {
  const guard = sources.find(/export\s+class\s+(RolesGuard)\b/);
  const decorator = sources.find(/export\s+const\s+(Roles)\s*=/);
  if (guard && decorator) {
    return {
      path: toConfigPath(root, guard.file),
      className: 'RolesGuard',
      decoratorPath: toConfigPath(root, decorator.file),
      decorator: 'Roles',
    };
  }
  const generated = `${srcDir}/common/guards/roles.guard`;
  return { path: generated, className: 'RolesGuard', decoratorPath: generated, decorator: 'Roles' };
}

// Only app.useGlobalX(...) and APP_X providers count; @UseFilters(new X()) on one controller does not
function isRegisteredGlobally(sources, className, kind) {
  const call = new RegExp(`useGlobal${kind}s\\([^;]*\\b${className}\\b`);
  const provider = new RegExp(`provide\\s*:\\s*APP_${kind.toUpperCase()}\\s*,\\s*useClass\\s*:\\s*${className}\\b`);
  return sources.some((s) => call.test(s.text) || provider.test(s.text));
}

function detectExceptionFilter(sources) {
  const hit = sources.find(/@Catch\([^)]*PrismaClientKnownRequestError[^)]*\)\s*export\s+class\s+(\w+)/);
  return hit ? isRegisteredGlobally(sources, hit.match[1], 'Filter') : false;
}

// Only the { success, statusCode, data, meta } envelope used by TransformInterceptor is recognised
function detectResponseEnvelope(sources) {
  return sources.all().some((s) => {
    const className = s.text.match(/export\s+class\s+(\w+)(?:<[^>]*>)?\s+implements\s+NestInterceptor\b/)?.[1];
    if (!className || !isRegisteredGlobally(sources, className, 'Interceptor')) return false;
    return /success\s*:/.test(s.text) && /statusCode/.test(s.text) && /data\s*:/.test(s.text);
  });
}

// Generated DTOs rely on a global ValidationPipe with whitelist (mass-assignment) and transform (query types)
function checkValidationPipe(sources) {
  const hit = sources.find(/useGlobalPipes\(\s*new\s+ValidationPipe\(([\s\S]*?)\)\s*,?\s*\)/);
  if (!hit) return ['No global ValidationPipe found: DTO validation, whitelisting and query type conversion are inactive.'];
  const notes = [];
  if (!/whitelist\s*:\s*true/.test(hit.match[1])) notes.push('Global ValidationPipe has no "whitelist: true": clients can send fields outside the DTOs.');
  if (!/transform\s*:\s*true/.test(hit.match[1])) notes.push('Global ValidationPipe has no "transform: true": numeric and boolean query filters stay strings.');
  return notes;
}

// @prisma/get-dmmf must match the project's Prisma version to parse the schema the same way
function checkParserVersion(root) {
  const version = (pkg) => readJson(path.join(root, 'node_modules', ...pkg.split('/'), 'package.json'))?.version;
  const parser = version('@prisma/get-dmmf');
  const prisma = version('prisma');
  if (!parser || !prisma) return [];
  const minor = (v) => v.split('.').slice(0, 2).join('.');
  return minor(parser) === minor(prisma)
    ? []
    : [`@prisma/get-dmmf ${parser} does not match prisma ${prisma}. Install @prisma/get-dmmf@${prisma}.`];
}

function detectLayout(srcDir) {
  if (!fs.existsSync(srcDir)) return 'nested';
  let nested = 0;
  let flat = 0;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(srcDir, entry.name);
    if (fs.existsSync(path.join(dir, 'controllers'))) nested++;
    else if (fs.readdirSync(dir).some((f) => f.endsWith('.controller.ts'))) flat++;
  }
  return flat > nested ? 'flat' : 'nested';
}
