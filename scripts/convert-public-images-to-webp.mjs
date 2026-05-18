/**
 * Converts scene JPGs and map PNGs under public/images to WebP.
 * Run: node scripts/convert-public-images-to-webp.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const scenesDir = path.join(root, 'public/images/scenes');
const imagesDir = path.join(root, 'public/images');

const SCENE_QUALITY = 82;
const MAP_QUALITY = 88;

function runCwebp(args) {
  try {
    execFileSync('cwebp', ['-quiet', ...args], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function convertWithCwebp(inputPath, outputPath, extraArgs = []) {
  return runCwebp(['-q', String(SCENE_QUALITY), ...extraArgs, inputPath, '-o', outputPath]);
}

function convertMap(inputPath, outputPath) {
  return runCwebp(['-q', String(MAP_QUALITY), '-alpha_q', '100', inputPath, '-o', outputPath]);
}

function convertDir(dir, qualityArgs) {
  if (!fs.existsSync(dir)) return { converted: 0, bytesBefore: 0, bytesAfter: 0 };
  let converted = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!/\.(jpe?g|png)$/i.test(name)) continue;
    const inputPath = path.join(dir, name);
    if (!fs.statSync(inputPath).isFile()) continue;
    const base = name.replace(/\.(jpe?g|png)$/i, '');
    const outputPath = path.join(dir, `${base}.webp`);
    const before = fs.statSync(inputPath).size;
    const ok =
      dir === imagesDir && (name === 'world-map.png' || name === 'taiwan-map.png')
        ? convertMap(inputPath, outputPath)
        : convertWithCwebp(inputPath, outputPath, qualityArgs);
    if (!ok || !fs.existsSync(outputPath)) {
      console.warn(`SKIP (conversion failed): ${name}`);
      continue;
    }
    const after = fs.statSync(outputPath).size;
    bytesBefore += before;
    bytesAfter += after;
    converted += 1;
    console.log(`${name} -> ${base}.webp (${(before / 1024).toFixed(1)} KiB -> ${(after / 1024).toFixed(1)} KiB)`);
  }
  return { converted, bytesBefore, bytesAfter };
}

const sceneStats = convertDir(scenesDir, []);
const mapStats = convertDir(imagesDir, []);

const totalBefore = sceneStats.bytesBefore + mapStats.bytesBefore;
const totalAfter = sceneStats.bytesAfter + mapStats.bytesAfter;
const totalConverted = sceneStats.converted + mapStats.converted;
console.log(
  `\nDone: ${totalConverted} files, ${(totalBefore / 1024 / 1024).toFixed(2)} MiB -> ${(totalAfter / 1024 / 1024).toFixed(2)} MiB (${totalBefore ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : 0}% smaller)`,
);
