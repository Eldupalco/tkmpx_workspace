// Collects named imports per module specifier and renders sorted import lines
export class Imports {
  constructor() {
    this.map = new Map();
  }

  add(from, ...names) {
    if (!this.map.has(from)) this.map.set(from, new Set());
    for (const n of names) this.map.get(from).add(n);
    return this;
  }

  render() {
    return Array.from(this.map.entries())
      .filter(([, names]) => names.size > 0)
      .map(([from, names]) => `import { ${Array.from(names).sort().join(', ')} } from '${from}';`)
      .join('\n');
  }
}

// Code-string example value for Swagger
function exampleFor(f, schema, { forInput }) {
  let ex;
  if (f.kind === 'enum') ex = `${f.type}.${schema.enums.get(f.type)[0]}`;
  else if (f.type === 'Int') ex = '1';
  else if (f.type === 'BigInt') ex = forInput ? '1' : `'1'`;
  else if (f.type === 'Float') ex = '99.99';
  else if (f.type === 'Decimal') ex = forInput ? '99.99' : `'99.99'`;
  else if (f.type === 'Boolean') ex = 'true';
  else if (f.type === 'DateTime') ex = `'2026-01-01T00:00:00.000Z'`;
  else if (f.type === 'Json') ex = `{ key: 'value' }`;
  else if (f.name.toLowerCase().includes('email')) ex = `'user@example.com'`;
  else if (f.isSensitive) ex = `'password!!!'`;
  else ex = `'Sample ${f.name}'`;
  return f.isList ? `[${ex}]` : ex;
}

// Swagger "type" options shared by DTOs and views
function swaggerTypeOptions(f, { forInput }) {
  const opts = [];
  if (f.kind === 'enum') opts.push(`enum: ${f.type}`, `enumName: '${f.type}'`);
  else if (f.type === 'Json') opts.push(`type: 'object'`, 'additionalProperties: true');
  else if (f.type === 'DateTime') opts.push('type: String', `format: 'date-time'`);
  else if (f.type === 'Int' || f.type === 'Float') opts.push('type: Number');
  // Decimal and BigInt are accepted as numbers but serialized as strings
  else if (f.type === 'Decimal' || f.type === 'BigInt') opts.push(forInput ? 'type: Number' : 'type: String');
  else if (f.type === 'Boolean') opts.push('type: Boolean');
  else opts.push('type: String');
  if (f.isList) opts.push('isArray: true');
  return opts;
}

function baseTsType(f, { forInput }) {
  if (f.kind === 'enum') return f.type;
  switch (f.type) {
    case 'Int':
    case 'Float':
      return 'number';
    case 'Decimal':
    case 'BigInt':
      return forInput ? 'number' : 'string';
    case 'Boolean':
      return 'boolean';
    case 'DateTime':
      return forInput ? 'string' : 'Date';
    case 'Json':
      return 'Record<string, any>';
    default:
      return 'string';
  }
}

// class-validator / class-transformer decorators for a DTO input field
function validatorsFor(f, imports) {
  const each = f.isList;
  const opt = each ? '{ each: true }' : '';
  const withOpts = (first) => (each ? `${first}, ${opt}` : first);
  const decorators = [];
  const v = (...names) => imports.add('class-validator', ...names);

  if (each) {
    v('IsArray');
    decorators.push('@IsArray()');
  }

  if (f.kind === 'enum') {
    v('IsEnum');
    decorators.push(`@IsEnum(${withOpts(f.type)})`);
    return decorators;
  }

  switch (f.type) {
    case 'Int':
    case 'BigInt':
      v('IsInt');
      imports.add('class-transformer', 'Type');
      decorators.push('@Type(() => Number)', `@IsInt(${opt})`);
      break;
    case 'Float':
    case 'Decimal':
      v('IsNumber');
      imports.add('class-transformer', 'Type');
      decorators.push('@Type(() => Number)', `@IsNumber(${each ? `{}, ${opt}` : ''})`);
      break;
    case 'Boolean':
      v('IsBoolean');
      decorators.push(`@IsBoolean(${opt})`);
      break;
    case 'DateTime':
      v('IsDateString');
      decorators.push(`@IsDateString(${each ? `{}, ${opt}` : ''})`);
      break;
    case 'Json':
      v('IsObject');
      decorators.push(`@IsObject(${opt})`);
      break;
    default:
      if (f.name.toLowerCase().includes('email')) {
        v('IsEmail');
        decorators.push(`@IsEmail(${each ? `{}, ${opt}` : ''})`);
      } else if (f.isSensitive) {
        v('IsString', 'MinLength');
        decorators.push(`@IsString(${opt})`, `@MinLength(${withOpts('6')})`);
      } else {
        v('IsString');
        decorators.push(`@IsString(${opt})`);
      }
  }
  return decorators;
}

// Property block for the Create DTO
export function renderDtoField(f, schema, imports, enumsFrom) {
  // Scalar lists default to an empty array on create
  const isOptional = !f.isRequired || f.hasDefault || f.isList;
  const swaggerDec = isOptional ? 'ApiPropertyOptional' : 'ApiProperty';
  imports.add('@nestjs/swagger', swaggerDec);
  if (f.kind === 'enum') imports.add(enumsFrom, f.type);

  const opts = [...swaggerTypeOptions(f, { forInput: true }), `example: ${exampleFor(f, schema, { forInput: true })}`];
  const validators = validatorsFor(f, imports);
  imports.add('class-validator', isOptional ? 'IsOptional' : 'IsNotEmpty');
  validators.unshift(isOptional ? '@IsOptional()' : '@IsNotEmpty()');

  const tsType = baseTsType(f, { forInput: true }) + (f.isList ? '[]' : '');
  return [
    `  @${swaggerDec}({ ${opts.join(', ')} })`,
    ...validators.map((d) => `  ${d}`),
    `  ${f.name}${isOptional ? '?' : ''}: ${tsType};`,
  ].join('\n');
}

// Property block for a response view; nullable columns are always present but may be null
export function renderViewField(f, schema, imports, enumsFrom) {
  imports.add('@nestjs/swagger', 'ApiProperty');
  if (f.kind === 'enum') imports.add(enumsFrom, f.type);

  const opts = [...swaggerTypeOptions(f, { forInput: false }), `example: ${exampleFor(f, schema, { forInput: false })}`];
  if (!f.isRequired) opts.push('nullable: true');

  const tsType = baseTsType(f, { forInput: false }) + (f.isList ? '[]' : '') + (f.isRequired ? '' : ' | null');
  return `  @ApiProperty({ ${opts.join(', ')} })\n  ${f.name}: ${tsType};`;
}

// Contact details are left out of summaries: they would be exposed on every related record
const PERSONAL_DATA = /email|phone|mobile|address|birth|ssn|passport/i;

// Best identifying fields of a related model for its summary view
export function bestDisplayFields(targetFields) {
  const priorityKeywords = ['name', 'title', 'label', 'username', 'code', 'status', 'description', 'role'];

  const candidates = targetFields.filter(
    (f) =>
      f.isSupported &&
      !f.isId &&
      !f.isSensitive &&
      !f.isAudit &&
      !f.isList &&
      !['Json', 'BigInt'].includes(f.type) &&
      !PERSONAL_DATA.test(f.name),
  );
  const scored = candidates
    .map((f) => {
      const idx = priorityKeywords.findIndex((k) => f.name.toLowerCase().includes(k));
      return { field: f, score: idx === -1 ? 0 : 100 - idx };
    })
    .sort((a, b) => b.score - a.score);

  const idField = targetFields.find((f) => f.isId && f.type !== 'BigInt');
  return [idField, ...scored.slice(0, 3).map((s) => s.field)].filter(Boolean);
}
