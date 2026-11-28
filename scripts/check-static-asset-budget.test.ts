import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { checkStaticAssetBudget } from './check-static-asset-budget.mjs';
const folders: string[] = [];
afterEach(() =>
  folders.splice(0).forEach((folder) => rmSync(folder, { recursive: true, force: true })),
);
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'static-budget-'));
  folders.push(root);
  mkdirSync(path.join(root, 'images'));
  writeFileSync(path.join(root, 'index.html'), Buffer.alloc(100));
  writeFileSync(path.join(root, 'images', 'asset.webp'), Buffer.alloc(200));
  return root;
}
describe('published static asset budget', () => {
  it('counts nested media and fails above the byte limit', () => {
    const root = fixture();
    expect(checkStaticAssetBudget(root, 300)).toEqual({ bytes: 300, files: 2, budgetBytes: 300 });
    expect(() => checkStaticAssetBudget(root, 299)).toThrow('300 > 299');
  });
  it('rejects symlinks instead of following files outside the deployment', () => {
    const root = fixture();
    symlinkSync(path.join(root, 'index.html'), path.join(root, 'link.html'));
    expect(() => checkStaticAssetBudget(root)).toThrow('symlink');
  });
});
