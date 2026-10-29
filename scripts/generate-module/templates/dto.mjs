import { Imports, renderDtoField } from '../fields.mjs';

export function createDtoTemplate(ctx) {
  const { names, schema, lists, imp } = ctx;
  const imports = new Imports();
  const enumsFrom = imp('createDto', 'prismaEnums');
  const body = lists.createFields.map((f) => renderDtoField(f, schema, imports, enumsFrom)).join('\n\n');

  return `${imports.render()}

export class Create${names.pascalSingular}Dto {
${body}
}
`;
}

// A client-supplied primary key is set on create only, never changed by PATCH
export function updateDtoTemplate({ names, model, imp }) {
  const P = names.pascalSingular;
  const base = model.id.inCreateDto ? `OmitType(Create${P}Dto, ['${model.id.name}'] as const)` : `Create${P}Dto`;
  const swagger = model.id.inCreateDto ? 'OmitType, PartialType' : 'PartialType';
  return `import { ${swagger} } from '@nestjs/swagger';
import { Create${P}Dto } from '${imp('updateDto', 'createDto')}';

export class Update${P}Dto extends PartialType(${base}) {}
`;
}

function renderFilterField(f, imports, enumsFrom) {
  const lines = [];
  if (f.kind === 'enum') {
    imports.add(enumsFrom, f.type);
    imports.add('class-validator', 'IsEnum');
    lines.push(`  @ApiPropertyOptional({ enum: ${f.type}, enumName: '${f.type}', description: 'Filter by ${f.name}' })`, '  @IsOptional()', `  @IsEnum(${f.type})`);
    lines.push(`  ${f.name}?: ${f.type};`);
  } else if (f.type === 'Boolean') {
    imports.add('class-validator', 'IsBoolean');
    imports.add('class-transformer', 'Transform');
    lines.push(
      `  @ApiPropertyOptional({ type: Boolean, description: 'Filter by ${f.name}' })`,
      '  @IsOptional()',
      `  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))`,
      '  @IsBoolean()',
      `  ${f.name}?: boolean;`,
    );
  } else if (f.type === 'Int') {
    lines.push(
      `  @ApiPropertyOptional({ type: Number, description: 'Filter by ${f.name}' })`,
      '  @IsOptional()',
      '  @Type(() => Number)',
      '  @IsInt()',
      `  ${f.name}?: number;`,
    );
  } else {
    imports.add('class-validator', 'IsString');
    lines.push(`  @ApiPropertyOptional({ description: 'Filter by ${f.name}' })`, '  @IsOptional()', '  @IsString()', `  ${f.name}?: string;`);
  }
  return lines.join('\n');
}

export function queryDtoTemplate(ctx) {
  const { names, lists, imp } = ctx;
  const imports = new Imports()
    .add('@nestjs/swagger', 'ApiPropertyOptional')
    .add('class-validator', 'IsIn', 'IsInt', 'IsOptional', 'Min')
    .add('class-transformer', 'Type');
  if (lists.searchFields.length > 0) imports.add('class-validator', 'IsString');

  const sortConst = `${names.camelSingular}SortFields`;
  const enumsFrom = imp('queryDto', 'prismaEnums');
  const filters = lists.filterFields.map((f) => renderFilterField(f, imports, enumsFrom)).join('\n\n');

  const search = lists.searchFields.length > 0
    ? `
  @ApiPropertyOptional({ description: 'Search in ${lists.searchFields.map((f) => f.name).join(', ')}' })
  @IsOptional()
  @IsString()
  search?: string;
`
    : '';

  return `${imports.render()}

export const ${sortConst} = [${lists.sortFields.map((f) => `'${f.name}'`).join(', ')}] as const;

export class Query${names.pascalSingular}Dto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page (max 100)', default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
${search}
  @ApiPropertyOptional({ description: 'Sort column', enum: ${sortConst}, default: '${lists.defaultSort}' })
  @IsOptional()
  @IsIn(${sortConst})
  sortBy?: (typeof ${sortConst})[number] = '${lists.defaultSort}';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
${filters ? `\n${filters}\n` : ''}}
`;
}
