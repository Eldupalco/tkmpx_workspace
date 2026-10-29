import { Imports, renderViewField } from '../fields.mjs';
import { toPascalCase } from '../naming.mjs';

export function selectTemplate(ctx) {
  const { names, model, lists, imp } = ctx;
  const lines = lists.viewFields.map((f) => `  ${f.name}: true,`);
  for (const rel of lists.relations) {
    const inner = rel.displayFields.map((f) => `      ${f.name}: true,`).join('\n');
    lines.push(`  ${rel.name}: {\n    select: {\n${inner}\n    },\n  },`);
  }

  return `import { Prisma } from '${imp('select', 'prismaClient')}';

export const ${names.camelSingular}Select = {
${lines.join('\n')}
} satisfies Prisma.${model.modelName}Select;

export type ${names.pascalSingular}Payload = Prisma.${model.modelName}GetPayload<{
  select: typeof ${names.camelSingular}Select;
}>;
`;
}

// With a global response envelope, views document the wrapped shape
export function viewTemplate(ctx) {
  const { names, schema, lists, imp, options } = ctx;
  const P = names.pascalSingular;
  const imports = new Imports().add('@nestjs/swagger', 'ApiProperty');
  const enumsFrom = imp('view', 'prismaEnums');

  const summaryClasses = lists.relations.map((rel) => {
    const className = `${P}${toPascalCase(rel.name)}SummaryView`;
    const props = rel.displayFields.map((f) => renderViewField(f, schema, imports, enumsFrom)).join('\n\n');
    return { rel, className, code: `export class ${className} {\n${props}\n}\n` };
  });

  const props = lists.viewFields.map((f) => renderViewField(f, schema, imports, enumsFrom));
  for (const { rel, className } of summaryClasses) {
    props.push(
      rel.isRequired
        ? `  @ApiProperty({ type: ${className} })\n  ${rel.name}: ${className};`
        : `  @ApiProperty({ type: ${className}, nullable: true })\n  ${rel.name}: ${className} | null;`,
    );
  }

  const envelopeProps = options.envelope
    ? `  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

`
    : '';

  const responseView = options.envelope
    ? `
export class ${P}ResponseView {
${envelopeProps}  @ApiProperty({ type: ${P}View })
  data: ${P}View;
}
`
    : '';

  return `${imports.render()}

${summaryClasses.map((s) => s.code).join('\n')}
export class ${P}View {
${props.join('\n\n')}
}
${responseView}
export class Paginated${P}View {
${envelopeProps}  @ApiProperty({ type: [${P}View] })
  data: ${P}View[];

  @ApiProperty({ example: { total: 42, page: 1, limit: 10, totalPages: 5 } })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
`;
}
