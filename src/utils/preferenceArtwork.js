import { ARTWORK_CATALOGUE } from './artworkCatalogue.js';

const aliases = [...ARTWORK_CATALOGUE.filter(item => item.kind === 'food' && !item.generic)
  .flatMap(item => item.aliases.filter(alias => alias.length >= 2).map(alias => ({ key: item.key, alias, label: /[가-힣]/.test(alias) ? alias : item.label }))),
  { key: 'okonomiyaki', alias: '오코노미야끼', label: '오코노미야키' },
  // A representative stir-fried noodle illustration; keep the user's broad dish label.
  { key: 'yakisoba', alias: '볶음면', label: '볶음면' },
]
  .sort((a, b) => b.alias.length - a.alias.length);
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Illustration only: never rewrite the server's preference description.
// Short words must stand alone, so e.g. "카레" does not match "카레빵".
export function preferenceFoods(description) {
  let remaining = String(description ?? '').normalize('NFKC');
  const matches = [];
  for (const { key, alias, label } of aliases) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escape(alias.normalize('NFKC'))}(?=$|[^\\p{L}\\p{N}]|(?:을|를|은|는|이|가|와|과|도|만|랑|하고|이나|또는)(?:$|[^\\p{L}\\p{N}]))`, 'iu');
    const match = pattern.exec(remaining);
    if (!match) continue;
    remaining = remaining.slice(0, match.index) + ' '.repeat(match[0].length) + remaining.slice(match.index + match[0].length);
    if (!matches.some(item => item.key === key)) matches.push({ key, label, index: match.index });
  }
  return matches.sort((a, b) => a.index - b.index).map(({ key, label }) => ({ key, label }));
}
