const HASHERS = {
  argon2: { import: `import * as argon2 from 'argon2';`, hash: (v) => `await argon2.hash(${v})` },
  bcrypt: { import: `import * as bcrypt from 'bcrypt';`, hash: (v) => `await bcrypt.hash(${v}, 10)` },
  bcryptjs: { import: `import * as bcrypt from 'bcryptjs';`, hash: (v) => `await bcrypt.hash(${v}, 10)` },
};

// Without a global Prisma exception filter, the service maps known Prisma errors itself
const MAP_PRISMA_ERROR = `
function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') throw new ConflictException('A record with this unique value already exists');
    if (error.code === 'P2003') throw new BadRequestException('Referenced record does not exist');
    if (error.code === 'P2025') throw new NotFoundException('Record not found');
  }
  throw error;
}
`;

export function serviceTemplate(ctx) {
  const { names, model, lists, options, imp, config } = ctx;
  const { pascalName, pascalSingular: P, camelSingular } = names;
  const db = `this.prisma.${model.delegate}`;
  const select = `${camelSingular}Select`;
  const id = model.id;
  const hasher = HASHERS[options.hashing];
  const prismaService = config.prismaService.className;
  // .catch(mapPrismaError) on writes when there is no global filter
  const onError = options.filter ? '' : '.catch(mapPrismaError)';

  // BigInt columns cannot be JSON-serialized, so responses carry them as strings
  const bigints = lists.viewFields.filter((f) => f.type === 'BigInt');
  const toResponse = bigints.length ? '.then(serialize)' : '';
  const serializer = bigints.length
    ? `
// BigInt columns are returned as strings because JSON.stringify cannot serialize bigint
function serialize(row: ${P}Payload) {
  return {
    ...row,
${bigints
  .map((f) => {
    if (f.isList) return `    ${f.name}: row.${f.name}.map(String),`;
    if (!f.isRequired) return `    ${f.name}: row.${f.name} === null ? null : row.${f.name}.toString(),`;
    return `    ${f.name}: row.${f.name}.toString(),`;
  })
  .join('\n')}
  };
}
`
    : '';

  const nestImports = ['Injectable', 'NotFoundException'];
  if (!options.filter) nestImports.push('BadRequestException', 'ConflictException');

  const extraImports = [];
  if (id.generatedByService) extraImports.push(`import { randomUUID } from 'node:crypto';`);
  if (hasher && lists.passwordFields.length > 0) extraImports.push(hasher.import);

  const createData = [];
  if (id.generatedByService) createData.push(`${id.name}: randomUUID(),`);
  createData.push('...dto,');
  for (const f of lists.passwordFields) createData.push(`${f.name}: ${hasher.hash(`dto.${f.name}`)},`);
  for (const f of lists.auditOnCreate) createData.push(`${f.name}: new Date(),`);

  const updateData = ['...dto,'];
  for (const f of lists.passwordFields) {
    updateData.push(`...(dto.${f.name} ? { ${f.name}: ${hasher.hash(`dto.${f.name}`)} } : {}),`);
  }
  for (const f of lists.auditOnUpdate) updateData.push(`${f.name}: new Date(),`);

  const mode = ctx.schema.supportsInsensitiveSearch ? `, mode: 'insensitive'` : '';
  const search = lists.searchFields.length > 0
    ? `
    if (query.search) {
      where.OR = [
${lists.searchFields.map((f) => `        { ${f.name}: { contains: query.search${mode} } },`).join('\n')}
      ];
    }`
    : '';
  const filters = lists.filterFields
    .map((f) => `    if (query.${f.name} !== undefined) where.${f.name} = query.${f.name};`)
    .join('\n');

  const indent = (lines) => lines.map((l) => `        ${l}`).join('\n');

  return `import { ${nestImports.sort().join(', ')} } from '@nestjs/common';
${extraImports.map((i) => `${i}\n`).join('')}import { Prisma } from '${imp('service', 'prismaClient')}';
import { ${prismaService} } from '${imp('service', 'prismaService')}';
import { Create${P}Dto } from '${imp('service', 'createDto')}';
import { Update${P}Dto } from '${imp('service', 'updateDto')}';
import { Query${P}Dto } from '${imp('service', 'queryDto')}';
import { ${select}${bigints.length ? `, ${P}Payload` : ''} } from '${imp('service', 'select')}';
${options.filter ? '' : MAP_PRISMA_ERROR}${serializer}
@Injectable()
export class ${pascalName}Service {
  constructor(private readonly prisma: ${prismaService}) {}

  async create(dto: Create${P}Dto) {
    return ${db}
      .create({
        data: {
${indent(createData)}
        },
        select: ${select},
      })${toResponse}${onError};
  }

  async findAll(query: Query${P}Dto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.${model.modelName}WhereInput = {};
${search}
${filters}

    const sortBy = query.sortBy ?? '${lists.defaultSort}';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortBy]: sortOrder } as Prisma.${model.modelName}OrderByWithRelationInput;

    const [total, data] = await Promise.all([
      ${db}.count({ where }),
      ${db}.findMany({ where, skip, take: limit, orderBy, select: ${select} }),
    ]);

    return {
      data: ${bigints.length ? 'data.map(serialize)' : 'data'},
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(${id.name}: ${id.tsType}) {
    const item = await ${db}.findUnique({
      where: { ${id.name} },
      select: ${select},
    });
    if (!item) {
      throw new NotFoundException(\`${P} with ID "\${${id.name}}" not found\`);
    }
    return ${bigints.length ? 'serialize(item)' : 'item'};
  }

  async update(${id.name}: ${id.tsType}, dto: Update${P}Dto) {
    return ${db}
      .update({
        where: { ${id.name} },
        data: {
${indent(updateData)}
        },
        select: ${select},
      })${toResponse}${onError};
  }

  async remove(${id.name}: ${id.tsType}) {
    return ${db}
      .delete({
        where: { ${id.name} },
        select: ${select},
      })${toResponse}${onError};
  }
}
`;
}
