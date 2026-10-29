// Casing and pluralization helpers
const UNCOUNTABLE = new Set(['news', 'series', 'species', 'data', 'media', 'information', 'equipment', 'feedback', 'metadata']);
const IRREGULAR = {
  people: 'person', children: 'child', men: 'man', women: 'woman', mice: 'mouse', geese: 'goose', teeth: 'tooth', feet: 'foot',
  analyses: 'analysis', crises: 'crisis', theses: 'thesis', indices: 'index', matrices: 'matrix',
  movies: 'movie', cookies: 'cookie', zombies: 'zombie', rookies: 'rookie', calories: 'calorie', hoodies: 'hoodie',
  statuses: 'status', buses: 'bus', campuses: 'campus', viruses: 'virus', bonuses: 'bonus', focuses: 'focus', surpluses: 'surplus',
};

// Singularizes the last word of a kebab/snake/camel name: "order-items" → "order-item", "ProductCategories" → "ProductCategory"
export function toSingular(name) {
  const match = name.match(/^(.*?)([A-Z]?[a-z]+)$/);
  if (!match) return name;
  const [, prefix, word] = match;
  const lower = word.toLowerCase();
  const keepCase = (singular) => prefix + word.slice(0, 1) + singular.slice(1);

  if (UNCOUNTABLE.has(lower)) return name;
  if (IRREGULAR[lower]) return keepCase(IRREGULAR[lower]);
  if (/(ss|us|is)$/.test(lower)) return name;
  if (/[^aeiou]ies$/.test(lower)) return keepCase(lower.slice(0, -3) + 'y');
  if (/(sses|xes|zes|tches|nches|rches|shes)$/.test(lower)) return keepCase(lower.slice(0, -2));
  if (/s$/.test(lower)) return keepCase(lower.slice(0, -1));
  return name;
}

export function toCamelCase(str) {
  return str.replace(/[-_]([a-z])/g, (_, char) => char.toUpperCase());
}

export function toPascalCase(str) {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function lowerFirst(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// All names a generated module needs, derived from the CLI input
export function buildNames(input) {
  const name = toKebabCase(input);
  const singularName = toSingular(name);
  return {
    name,
    singularName,
    camelName: toCamelCase(name),
    camelSingular: toCamelCase(singularName),
    pascalName: toPascalCase(name),
    pascalSingular: toPascalCase(singularName),
  };
}
