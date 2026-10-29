export function controllerTemplate(ctx) {
  const { names, model, options, imp, config } = ctx;
  const { name, singularName, pascalName, pascalSingular: P } = names;
  const service = `${names.camelName}Service`;
  const id = model.id;
  // options.guard: { path, className } adds @UseGuards, 'global' (APP_GUARD) only documents auth, false = public
  const guardClass = typeof options.guard === 'object' && options.guard ? options.guard.className : null;
  const isProtected = Boolean(options.guard);
  // options.access: reads stay open to any authenticated user, writes need one of writeRoles
  const access = isProtected ? options.access : false;
  const responseType = options.envelope ? `${P}ResponseView` : `${P}View`;

  const guards = [guardClass, access && config.rolesGuard.className].filter(Boolean);

  const commonImports = ['Body', 'Controller', 'Delete', 'Get', 'Param', 'Patch', 'Post', 'Query'];
  if (id.pipe) commonImports.push(id.pipe);
  if (guards.length > 0) commonImports.push('UseGuards');

  const swaggerImports = ['ApiOperation', 'ApiParam', 'ApiResponse', 'ApiTags'];
  if (isProtected) swaggerImports.push('ApiBearerAuth');

  const idParam = id.pipe ? `@Param('${id.name}', ${id.pipe}) ${id.name}: ${id.tsType}` : `@Param('${id.name}') ${id.name}: ${id.tsType}`;
  const route = `:${id.name}`;
  const paramDoc = `  @ApiParam({ name: '${id.name}', description: '${P} identifier' })`;

  const projectImports = [];
  if (guardClass) projectImports.push(`import { ${guardClass} } from '${imp('controller', 'authGuard')}';`);
  if (access) {
    const { className, decorator, path: guardPath, decoratorPath } = config.rolesGuard;
    if (guardPath === decoratorPath) {
      projectImports.push(`import { ${decorator}, ${className} } from '${imp('controller', 'rolesGuard')}';`);
    } else {
      projectImports.push(`import { ${className} } from '${imp('controller', 'rolesGuard')}';`);
      projectImports.push(`import { ${decorator} } from '${imp('controller', 'rolesDecorator')}';`);
    }
  }

  const authDecorators = isProtected
    ? `@ApiBearerAuth()
${guards.length ? `@UseGuards(${guards.join(', ')})\n` : ''}@ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
`
    : '';

  const roles = access ? access.writeRoles.map((r) => `'${r}'`).join(', ') : '';
  const writeAccess = access
    ? `  @${config.rolesGuard.decorator}(${roles})
  @ApiResponse({ status: 403, description: 'Requires role: ${access.writeRoles.join(' or ')}' })
`
    : '';

  return `import { ${commonImports.sort().join(', ')} } from '@nestjs/common';
import { ${swaggerImports.sort().join(', ')} } from '@nestjs/swagger';
${projectImports.map((i) => `${i}\n`).join('')}import { ${pascalName}Service } from '${imp('controller', 'service')}';
import { Create${P}Dto } from '${imp('controller', 'createDto')}';
import { Update${P}Dto } from '${imp('controller', 'updateDto')}';
import { Query${P}Dto } from '${imp('controller', 'queryDto')}';
import { ${responseType}, Paginated${P}View } from '${imp('controller', 'view')}';

@ApiTags('${pascalName}')
${authDecorators}@Controller('${name}')
export class ${pascalName}Controller {
  constructor(private readonly ${service}: ${pascalName}Service) {}

  @Post()
${writeAccess}  @ApiOperation({ summary: 'Create a new ${singularName}' })
  @ApiResponse({ status: 201, description: 'Created successfully', type: ${responseType} })
  @ApiResponse({ status: 400, description: 'Validation failed or referenced record does not exist' })
  @ApiResponse({ status: 409, description: 'Unique constraint conflict' })
  create(@Body() dto: Create${P}Dto) {
    return this.${service}.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of ${name}' })
  @ApiResponse({ status: 200, description: 'Paginated records', type: Paginated${P}View })
  findAll(@Query() query: Query${P}Dto) {
    return this.${service}.findAll(query);
  }

  @Get('${route}')
  @ApiOperation({ summary: 'Get a ${singularName} by ID' })
${paramDoc}
  @ApiResponse({ status: 200, description: 'Found record', type: ${responseType} })
  @ApiResponse({ status: 404, description: '${P} not found' })
  findOne(${idParam}) {
    return this.${service}.findOne(${id.name});
  }

  @Patch('${route}')
${writeAccess}  @ApiOperation({ summary: 'Update a ${singularName} by ID' })
${paramDoc}
  @ApiResponse({ status: 200, description: 'Updated successfully', type: ${responseType} })
  @ApiResponse({ status: 400, description: 'Validation failed or referenced record does not exist' })
  @ApiResponse({ status: 404, description: '${P} not found' })
  @ApiResponse({ status: 409, description: 'Unique constraint conflict' })
  update(${idParam}, @Body() dto: Update${P}Dto) {
    return this.${service}.update(${id.name}, dto);
  }

  @Delete('${route}')
${writeAccess}  @ApiOperation({ summary: 'Delete a ${singularName} by ID' })
${paramDoc}
  @ApiResponse({ status: 200, description: 'Deleted successfully', type: ${responseType} })
  @ApiResponse({ status: 404, description: '${P} not found' })
  remove(${idParam}) {
    return this.${service}.remove(${id.name});
  }
}
`;
}
