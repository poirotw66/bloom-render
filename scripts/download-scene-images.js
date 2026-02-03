/**
 * Download missing travel scene reference images from Wikimedia Commons.
 * Run from project root: node scripts/download-scene-images.js
 * Images are saved to public/images/scenes/ with correct filenames.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENES_DIR = path.join(__dirname, '..', 'public', 'images', 'scenes');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

/** filename -> Commons search query (English works best) */
const MISSING_IMAGES = [
  // International scenery - Europe
  { file: 'iceland.jpg', query: 'Iceland waterfall landscape' },
  { file: 'santorini.jpg', query: 'Santorini Greece white blue' },
  { file: 'london.jpg', query: 'Big Ben London' },
  { file: 'rome.jpg', query: 'Colosseum Rome' },
  { file: 'barcelona.jpg', query: 'Sagrada Familia Barcelona' },
  { file: 'swiss_alps.jpg', query: 'Swiss Alps mountain' },
  { file: 'neuschwanstein.jpg', query: 'Neuschwanstein Castle' },
  { file: 'pisa.jpg', query: 'Leaning Tower of Pisa' },
  { file: 'athens.jpg', query: 'Parthenon Athens Acropolis' },
  { file: 'moscow.jpg', query: 'Saint Basil Cathedral Moscow Red Square' },
  { file: 'venice.jpg', query: 'Venice canal gondola' },
  { file: 'prague.jpg', query: 'Prague Charles Bridge' },
  { file: 'amsterdam.jpg', query: 'Amsterdam canal houses' },
  // Asia
  { file: 'taj_mahal.jpg', query: 'Taj Mahal India' },
  { file: 'great_wall.jpg', query: 'Great Wall of China' },
  { file: 'mt_fuji.jpg', query: 'Mount Fuji Japan' },
  { file: 'dubai.jpg', query: 'Burj Khalifa Dubai' },
  { file: 'petra.jpg', query: 'Petra Jordan Treasury' },
  { file: 'ankor_wat.jpg', query: 'Angkor Wat Cambodia' },
  { file: 'bali.jpg', query: 'Bali rice terrace' },
  { file: 'seoul.jpg', query: 'N Seoul Tower' },
  { file: 'singapore.jpg', query: 'Marina Bay Sands Singapore' },
  { file: 'cappadocia.jpg', query: 'Cappadocia hot air balloon' },
  { file: 'kyoto.jpg', query: 'Fushimi Inari Kyoto torii' },
  { file: 'halong_bay.jpg', query: 'Ha Long Bay Vietnam' },
  { file: 'bangkok.jpg', query: 'Wat Arun Bangkok' },
  { file: 'borobudur.jpg', query: 'Borobudur temple Indonesia' },
  { file: 'everest.jpg', query: 'Mount Everest base camp' },
  // N America
  { file: 'nyc.jpg', query: 'Times Square New York' },
  { file: 'grand_canyon.jpg', query: 'Grand Canyon Arizona' },
  { file: 'san_francisco.jpg', query: 'Golden Gate Bridge San Francisco' },
  { file: 'banff.jpg', query: 'Banff National Park lake' },
  { file: 'mexico.jpg', query: 'Chichen Itza pyramid Mexico' },
  { file: 'havana.jpg', query: 'Havana Cuba vintage car' },
  // S America
  { file: 'machu_picchu.jpg', query: 'Machu Picchu Peru' },
  { file: 'rio.jpg', query: 'Christ the Redeemer Rio' },
  { file: 'galapagos.jpg', query: 'Galapagos tortoise' },
  { file: 'easter_island.jpg', query: 'Moai Easter Island' },
  { file: 'iguazu.jpg', query: 'Iguazu Falls' },
  // Oceania
  { file: 'sydney.jpg', query: 'Sydney Opera House' },
  { file: 'nz.jpg', query: 'New Zealand mountain landscape' },
  { file: 'uluru.jpg', query: 'Uluru Australia' },
  { file: 'bora_bora.jpg', query: 'Bora Bora overwater bungalow' },
  // Africa
  { file: 'pyramids.jpg', query: 'Pyramids of Giza Egypt' },
  { file: 'cape_town.jpg', query: 'Table Mountain Cape Town' },
  { file: 'victoria_falls.jpg', query: 'Victoria Falls' },
  { file: 'serengeti.jpg', query: 'Serengeti safari' },
  { file: 'marrakesh.jpg', query: 'Marrakesh market Morocco' },
  // Taiwan (missing)
  { file: 'mr_brown_ave.jpg', query: 'Taiwan Chishang rice field road' },
];

const UA = 'Mozilla/5.0 (compatible; enhance-pixshop/1.0; +https://github.com)';

/** Delay between requests to avoid 429 (Commons rate limit). */
const DELAY_MS = 5000;
const RETRY_AFTER_429_MS = 35000;
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url, opts = {}) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, opts);
    if (res.status !== 429) return res;
    const retryAfter = Number(res.headers.get('Retry-After')) * 1000 || RETRY_AFTER_429_MS;
    console.log(`   [429] waiting ${Math.round(retryAfter / 1000)}s before retry (${attempt}/${MAX_RETRIES})`);
    await sleep(retryAfter);
  }
  return fetch(url, opts);
}

async function downloadToFile(url, filepath) {
  const res = await fetchWithRetry(url, { redirect: 'follow', headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, Buffer.from(buf));
}

async function fetchCommonsImageUrlWithRetry(query) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrnamespace: '6',
      gsrsearch: query,
      gsrlimit: '5',
      prop: 'imageinfo',
      iiprop: 'url',
      format: 'json',
      origin: '*',
    });
    const res = await fetchWithRetry(`${COMMONS_API}?${params}`, { headers: { 'User-Agent': UA } });
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages || typeof pages !== 'object') return null;
    const firstPage = Object.values(pages)[0];
    const url = firstPage?.imageinfo?.[0]?.url;
    if (url) return url;
    return null;
  }
  return null;
}

async function main() {
  console.log('Downloading missing scene images from Wikimedia Commons...');
  console.log(`Delay ${DELAY_MS / 1000}s between requests to avoid 429.\n`);
  let ok = 0;
  let skip = 0;
  let fail = 0;
  for (const { file, query } of MISSING_IMAGES) {
    const filepath = path.join(SCENES_DIR, file);
    if (fs.existsSync(filepath)) {
      console.log(`[skip] ${file} (already exists)`);
      skip++;
      continue;
    }
    try {
      const url = await fetchCommonsImageUrlWithRetry(query);
      if (!url) {
        console.log(`[fail] ${file} – no result for "${query}"`);
        fail++;
        await sleep(DELAY_MS);
        continue;
      }
      await downloadToFile(url, filepath);
      console.log(`[ok] ${file}`);
      ok++;
    } catch (e) {
      console.log(`[fail] ${file} – ${e.message}`);
      fail++;
    }
    await sleep(DELAY_MS);
  }
  console.log(`\nDone. ok=${ok} skip=${skip} fail=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
