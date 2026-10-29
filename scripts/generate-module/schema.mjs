import { getDMMF } from '@prisma/get-dmmf';
import { readSchemaFiles } from './config.mjs';
import { toSingular, toKebabCase, lowerFirst } from './naming.mjs';

const AUDIT_FIELDS = ['createdAt', 'updatedAt'];
const SUPPORTED_SCALARS = ['String', 'Int', 'Float', 'Decimal', 'BigInt', 'Boolean', 'DateTime', 'Json'];
const INSENSITIVE_SEARCH_PROVIDERS = ['postgresql', 'cockroachdb', 'mongodb'];

// Parse the schema (single file or folder) with Prisma's own parser (DMMF)
export async function loadSchema(root, schemaPath) {
  const files = readSchemaFiles(root, schemaPath);
  if (files.length === 0) return null;

  const dmmf = await getDMMF({ datamodel: files.length === 1 ? files[0][1] : files });
  // getDMMF returns an error object instead of throwing
  if (!dmmf.datamodel) throw new Error(schemaErrorMessage(dmmf));

  const allText = files.map(([, content]) => content).join('\n');
  const provider = allText.match(/datasource\s+\w+\s*\{[^}]*provider\s*=\s*"(\w+)"/)?.[1] ?? '';

  return {
    models: dmmf.datamodel.models,
    enums: new Map(dmmf.datamodel.enums.map((e) => [e.name, e.values.map((v) => v.name)])),
    provider,
    supportsInsensitiveSearch: INSENSITIVE_SEARCH_PROVIDERS.includes(provider),
  };
}

function schemaErrorMessage(result) {
  const raw = result.error?.message ?? result.reason ?? 'Unknown schema error';
  try {
    return JSON.parse(raw).message ?? raw;
  } catch {
    return raw;
  }
}

// Comparable form of a model name or CLI input: "audit-logs", "AuditLog", "audit_log" → "auditlog"
const matchKey = (name) => toSingular(toKebabCase(name)).replace(/[-_]/g, '');

// Match the CLI input against model names: exact name first, then singular/plural/casing variants
export function findModel(schema, input) {
  const exact = schema.models.find((m) => m.name === input);
  if (exact) return exact;
  const candidates = schema.models.filter((m) => matchKey(m.name) === matchKey(input));
  if (candidates.length > 1) {
    throw new Error(`"${input}" matches several models (${candidates.map((m) => m.name).join(', ')}). Use the exact model name.`);
  }
  return candidates[0];
}

function foreignKeyNames(model) {
  return new Set(model.fields.filter((f) => f.kind === 'object').flatMap((f) => f.relationFromFields ?? []));
}

const SECRET_WORDS = new Set(['password', 'passwd', 'secret', 'token', 'hash', 'salt', 'otp', 'pin']);
const KEY_PREFIXES = new Set(['api', 'private', 'secret', 'access', 'encryption', 'signing']);

// Judged on the name's words: refreshToken, passwordHash, apiKey are secret; tokenCount, hashtags are not
function isSensitiveName(name) {
  const words = toKebabCase(name).split(/[-_]/);
  const last = words.at(-1);
  if (words.includes('password') || words.includes('passwd')) return true;
  if (SECRET_WORDS.has(last)) return true;
  return last === 'key' && KEY_PREFIXES.has(words.at(-2));
}

function describeField(f, fkNames) {
  const isAudit = AUDIT_FIELDS.includes(f.name) || f.isUpdatedAt;
  return {
    name: f.name,
    type: f.type,
    kind: f.kind,
    isList: f.isList,
    isRequired: f.isRequired,
    hasDefault: f.hasDefaultValue,
    defaultName: typeof f.default === 'object' && !Array.isArray(f.default) ? f.default?.name : undefined,
    isId: f.isId,
    isUnique: f.isUnique,
    isUpdatedAt: f.isUpdatedAt,
    isFk: fkNames.has(f.name),
    isSensitive: isSensitiveName(f.name),
    isAudit,
    isSupported: f.kind === 'enum' || SUPPORTED_SCALARS.includes(f.type),
  };
}

// Turn a DMMF model into the field/relation/id metadata the templates need
export function describeModel(schema, model) {
  const relationFields = model.fields.filter((f) => f.kind === 'object' && f.relationFromFields?.length > 0);
  const fkNames = foreignKeyNames(model);

  const allFields = model.fields
    .filter((f) => f.kind === 'scalar' || f.kind === 'enum')
    .map((f) => describeField(f, fkNames));
  const fields = allFields.filter((f) => f.isSupported);
  const unsupportedFields = allFields.filter((f) => !f.isSupported);

  const idField = fields.find((f) => f.isId);
  if (!idField) {
    throw new Error(`Model "${model.name}" has no single @id field. Composite @@id models are not supported.`);
  }
  if (!['String', 'Int'].includes(idField.type)) {
    throw new Error(`Model "${model.name}" uses a ${idField.type} @id. Only String and Int ids are supported.`);
  }

  const idGeneratedByService = idField.type === 'String' && !idField.hasDefault;
  const id = {
    name: idField.name,
    type: idField.type,
    tsType: idField.type === 'Int' ? 'number' : 'string',
    generatedByService: idGeneratedByService,
    // Ids without any default must be supplied by the client
    inCreateDto: !idField.hasDefault && !idGeneratedByService,
    pipe: idField.type === 'Int'
      ? 'ParseIntPipe'
      : idGeneratedByService || idField.defaultName === 'uuid'
        ? 'ParseUUIDPipe'
        : null,
  };

  const relations = relationFields.map((f) => {
    const target = schema.models.find((m) => m.name === f.type);
    const targetFks = target ? foreignKeyNames(target) : new Set();
    const targetFields = target
      ? target.fields
          .filter((tf) => (tf.kind === 'scalar' || tf.kind === 'enum') && !targetFks.has(tf.name))
          .map((tf) => describeField(tf, targetFks))
      : [];
    return { name: f.name, targetModel: f.type, isRequired: f.isRequired, targetFields };
  });

  return {
    modelName: model.name,
    delegate: lowerFirst(model.name),
    fields,
    unsupportedFields,
    relations,
    id,
  };
}
