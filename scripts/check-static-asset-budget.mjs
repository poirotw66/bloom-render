import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// GitHub Pages limits published sites to 1 GB; leave headroom for deployment metadata.
// https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
export const STATIC_SITE_BUDGET_BYTES = 900 * 1024 * 1024;
export function checkStaticAssetBudget(directory, budget = STATIC_SITE_BUDGET_BYTES) {
  let bytes = 0;
  let files = 0;
  function visit(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isSymbolicLink()) throw Error(`Static site contains a symlink: ${file}`);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) {
        bytes += fs.statSync(file).size;
        files++;
      }
    }
  }
  visit(directory);
  if (bytes > budget) throw Error(`Static site budget exceeded: ${bytes} > ${budget} bytes`);
  return { bytes, files, budgetBytes: budget };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(
      `Static site budget passed: ${JSON.stringify(checkStaticAssetBudget(path.resolve(process.argv[2] ?? 'dist')))}`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
