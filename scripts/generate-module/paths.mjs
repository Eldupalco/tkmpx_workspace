import path from 'node:path';
import { isPackage } from './config.mjs';

// File locations inside a module folder, per layout (no extension)
const LAYOUTS = {
  nested: (n) => ({
    controller: `controllers/${n.name}.controller`,
    controllerSpec: `controllers/${n.name}.controller.spec`,
    service: `services/${n.name}.service`,
    serviceSpec: `services/${n.name}.service.spec`,
    createDto: `dto/create-${n.singularName}.dto`,
    updateDto: `dto/update-${n.singularName}.dto`,
    queryDto: `dto/query-${n.singularName}.dto`,
    view: `views/${n.singularName}.view`,
    select: `views/${n.singularName}.select`,
    module: `${n.name}.module`,
  }),
  flat: (n) => ({
    controller: `${n.name}.controller`,
    controllerSpec: `${n.name}.controller.spec`,
    service: `${n.name}.service`,
    serviceSpec: `${n.name}.service.spec`,
    createDto: `dto/create-${n.singularName}.dto`,
    updateDto: `dto/update-${n.singularName}.dto`,
    queryDto: `dto/query-${n.singularName}.dto`,
    view: `views/${n.singularName}.view`,
    select: `views/${n.singularName}.select`,
    module: `${n.name}.module`,
  }),
};

// Builds absolute paths for module files and an import-specifier resolver between them
export function buildPaths(config, names, root = process.cwd()) {
  const moduleDir = path.resolve(root, config.srcDir, names.name);
  const files = Object.fromEntries(
    Object.entries(LAYOUTS[config.layout](names)).map(([key, rel]) => [key, path.join(moduleDir, rel)]),
  );

  const external = {
    prismaClient: config.prismaClient,
    prismaEnums: config.prismaEnums,
    prismaService: config.prismaService.path,
    authGuard: typeof config.authGuard === 'object' && config.authGuard ? config.authGuard.path : null,
    authModule: config.authGuard?.module?.path ?? null,
    rolesGuard: config.rolesGuard?.path ?? null,
    rolesDecorator: config.rolesGuard?.decoratorPath ?? null,
  };

  // Import specifier from one module file to another module file or project target
  const imp = (fromKey, toKey) => {
    const target = files[toKey] ?? external[toKey];
    if (!target) throw new Error(`Unknown import target "${toKey}"`);
    if (!files[toKey] && isPackage(target)) return target;

    const abs = files[toKey] ?? path.resolve(root, target);
    let rel = path.relative(path.dirname(files[fromKey]), abs).split(path.sep).join('/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return rel + config.importExtension;
  };

  return { moduleDir, files, imp };
}
