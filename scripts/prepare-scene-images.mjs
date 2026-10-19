/**
 * Build UI thumbnails and API-sized scene reference images.
 *
 * For each WebP/JPEG/PNG under public/images/scenes/ (top level only):
 *   - thumbs/256/<name>.webp  — long edge 256px (UI grids ~128px)
 *   - thumbs/512/<name>.webp  — long edge 512px (hover / larger previews)
 *   - ref/<name>.webp         — long edge ≤1536px, quality ~82 (model input)
 *
 * Oversized originals at the scenes root are deleted by default so the repo
 * stays small. Full-resolution downloads remain optional (see docs).
 *
 * Requires `cwebp` and `webpinfo` (apt: webp).
 *
 * Usage:
 *   node scripts/prepare-scene-images.mjs
 *   node scripts/prepare-scene-images.mjs --keep-originals
 *   node scripts/prepare-scene-images.mjs --input public/images/scenes
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const REF_MAX_EDGE = 1536;
const REF_QUALITY = 82;
const THUMB_SIZES = [256, 512];
const THUMB_QUALITY = 80;
const INPUT_EXT = /\.(webp|jpe?g|png)$/i;

const args = new Set(process.argv.slice(2));
const keepOriginals = args.has('--keep-originals');
const inputIdx = process.argv.indexOf('--input');
const scenesDir =
  inputIdx >= 0 && process.argv[inputIdx + 1]
    ? path.resolve(process.argv[inputIdx + 1])
    : path.join(root, 'public/images/scenes');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function run(cmd, cmdArgs) {
  execFileSync(cmd, cmdArgs, { stdio: 'pipe' });
}

function readWebpDimensions(filePath) {
  const out = execFileSync('webpinfo', [filePath], { encoding: 'utf8' });
  const width = Number(/Width:\s*(\d+)/.exec(out)?.[1]);
  const height = Number(/Height:\s*(\d+)/.exec(out)?.[1]);
  if (!width || !height) throw new Error(`Could not read dimensions for ${filePath}`);
  return { width, height };
}

/** Decode non-WebP to a temp WebP so webpinfo/cwebp can measure and resize. */
function ensureWebpSource(inputPath, tempDir) {
  if (/\.webp$/i.test(inputPath)) return inputPath;
  const base = path.basename(inputPath).replace(/\.(jpe?g|png)$/i, '');
  const tempPath = path.join(tempDir, `${base}.source.webp`);
  run('cwebp', ['-quiet', '-q', '95', inputPath, '-o', tempPath]);
  return tempPath;
}

function resizeLongEdge(inputPath, outputPath, maxEdge, quality) {
  const { width, height } = readWebpDimensions(inputPath);
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) {
    // Still re-encode at target quality for consistent size/format.
    run('cwebp', ['-quiet', '-q', String(quality), inputPath, '-o', outputPath]);
    return { width, height, outW: width, outH: height };
  }
  const scale = maxEdge / longEdge;
  const outW = Math.round(width * scale);
  const outH = Math.round(height * scale);
  const resizeArgs =
    width >= height ? ['-resize', String(maxEdge), '0'] : ['-resize', '0', String(maxEdge)];
  run('cwebp', ['-quiet', '-q', String(quality), ...resizeArgs, inputPath, '-o', outputPath]);
  return { width, height, outW, outH };
}

function listSceneSources(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => INPUT_EXT.test(name))
    .map((name) => path.join(dir, name))
    .filter((p) => fs.statSync(p).isFile());
}

function formatMiB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

const sources = listSceneSources(scenesDir);
if (sources.length === 0) {
  console.error(`No scene images found in ${scenesDir}`);
  process.exit(1);
}

const thumbDirs = Object.fromEntries(
  THUMB_SIZES.map((size) => {
    const dir = path.join(scenesDir, 'thumbs', String(size));
    ensureDir(dir);
    return [size, dir];
  }),
);
const refDir = path.join(scenesDir, 'ref');
ensureDir(refDir);
const tempDir = path.join(scenesDir, '.prepare-tmp');
ensureDir(tempDir);

let bytesIn = 0;
let bytesOut = 0;
let processed = 0;
let deletedOriginals = 0;

console.log(`Preparing ${sources.length} scene image(s) in ${scenesDir}`);

for (const sourcePath of sources) {
  const base = path.basename(sourcePath).replace(/\.(webp|jpe?g|png)$/i, '');
  const before = fs.statSync(sourcePath).size;
  bytesIn += before;

  try {
    const webpSource = ensureWebpSource(sourcePath, tempDir);

    for (const size of THUMB_SIZES) {
      const out = path.join(thumbDirs[size], `${base}.webp`);
      resizeLongEdge(webpSource, out, size, THUMB_QUALITY);
      bytesOut += fs.statSync(out).size;
    }

    const refOut = path.join(refDir, `${base}.webp`);
    resizeLongEdge(webpSource, refOut, REF_MAX_EDGE, REF_QUALITY);
    bytesOut += fs.statSync(refOut).size;

    processed += 1;
    console.log(
      `${base}: ${formatMiB(before)} → thumbs ${THUMB_SIZES.join('/')} + ref≤${REF_MAX_EDGE}`,
    );

    if (!keepOriginals) {
      fs.unlinkSync(sourcePath);
      deletedOriginals += 1;
    }
  } catch (err) {
    console.warn(`SKIP ${path.basename(sourcePath)}:`, err instanceof Error ? err.message : err);
  }
}

fs.rmSync(tempDir, { recursive: true, force: true });

console.log(
  `\nDone: ${processed}/${sources.length} prepared, output assets ${formatMiB(bytesOut)}` +
    ` (from ${formatMiB(bytesIn)} originals)` +
    (keepOriginals ? ', originals kept' : `, deleted ${deletedOriginals} originals`),
);
