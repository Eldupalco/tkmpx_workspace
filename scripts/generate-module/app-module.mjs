import ts from 'typescript';

// Register a feature module in app.module.ts by editing the TypeScript AST positions,
// so nested calls like ConfigModule.forRoot({ load: [a, b] }) are left untouched.
export function registerModule(source, { className, importPath }) {
  const sf = ts.createSourceFile('app.module.ts', source, ts.ScriptTarget.Latest, true);

  const importsArray = findModuleImportsArray(sf);
  if (!importsArray) return { status: 'no-imports-array', source };

  const edits = [];
  const imports = sf.statements.filter(ts.isImportDeclaration);
  const alreadyImported = imports.some((d) => {
    const bindings = d.importClause?.namedBindings;
    return bindings && ts.isNamedImports(bindings) && bindings.elements.some((e) => e.name.text === className);
  });
  if (!alreadyImported) {
    const statement = `import { ${className} } from '${importPath}';`;
    if (imports.length > 0) edits.push({ pos: imports.at(-1).getEnd(), text: `\n${statement}` });
    else edits.push({ pos: 0, text: `${statement}\n` });
  }

  const alreadyListed = importsArray.elements.some((e) => ts.isIdentifier(e) && e.text === className);
  if (!alreadyListed) {
    const last = importsArray.elements.at(-1);
    edits.push(last ? { pos: last.getEnd(), text: `, ${className}` } : { pos: importsArray.elements.pos, text: className });
  }

  if (edits.length === 0) return { status: 'already-registered', source };

  let result = source;
  for (const { pos, text } of edits.sort((a, b) => b.pos - a.pos)) {
    result = result.slice(0, pos) + text + result.slice(pos);
  }
  return { status: 'registered', source: result };
}

function findModuleImportsArray(sf) {
  for (const stmt of sf.statements) {
    if (!ts.isClassDeclaration(stmt)) continue;
    for (const decorator of ts.getDecorators(stmt) ?? []) {
      const call = decorator.expression;
      if (!ts.isCallExpression(call) || !ts.isIdentifier(call.expression) || call.expression.text !== 'Module') continue;
      const [arg] = call.arguments;
      if (!arg || !ts.isObjectLiteralExpression(arg)) continue;
      const prop = arg.properties.find(
        (p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'imports',
      );
      if (prop && ts.isArrayLiteralExpression(prop.initializer)) return prop.initializer;
    }
  }
  return null;
}
