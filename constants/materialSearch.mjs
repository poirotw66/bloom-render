/** Match every whitespace-separated term with the same Unicode rules in browser and MCP. */
/** @param {string} query @param {string[]} values */
export function matchesMaterialSearch(query, values) {
  const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('en');
  const searchable = normalize(values.join(' '));
  return normalize(query)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => searchable.includes(term));
}
