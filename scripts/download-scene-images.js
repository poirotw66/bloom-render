/**
 * Download missing travel scene reference images from Wikimedia Commons.
 * Run from project root: node scripts/download-scene-images.js
 * Images are saved to public/images/scenes/ with correct filenames.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENES_DIR = path.join(__dirname, '..', 'public', 'images', 'scenes');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

/** filename -> Commons search query (English works best) */
const MISSING_IMAGES = [
  // International scenery - Europe
  { file: 'iceland.webp', query: 'Iceland waterfall landscape' },
  { file: 'santorini.webp', query: 'Santorini Greece white blue' },
  { file: 'london.webp', query: 'Big Ben London' },
  { file: 'rome.webp', query: 'Colosseum Rome' },
  { file: 'barcelona.webp', query: 'Sagrada Familia Barcelona' },
  { file: 'swiss_alps.webp', query: 'Swiss Alps mountain' },
  { file: 'neuschwanstein.webp', query: 'Neuschwanstein Castle' },
  { file: 'pisa.webp', query: 'Leaning Tower of Pisa' },
  { file: 'athens.webp', query: 'Parthenon Athens Acropolis' },
  { file: 'moscow.webp', query: 'Saint Basil Cathedral Moscow Red Square' },
  { file: 'venice.webp', query: 'Venice canal gondola' },
  { file: 'prague.webp', query: 'Prague Charles Bridge' },
  { file: 'amsterdam.webp', query: 'Amsterdam canal houses' },
  // Asia
  { file: 'taj_mahal.webp', query: 'Taj Mahal India' },
  { file: 'great_wall.webp', query: 'Great Wall of China' },
  { file: 'mt_fuji.webp', query: 'Mount Fuji Japan' },
  { file: 'dubai.webp', query: 'Burj Khalifa Dubai' },
  { file: 'petra.webp', query: 'Petra Jordan Treasury' },
  { file: 'ankor_wat.webp', query: 'Angkor Wat Cambodia' },
  { file: 'bali.webp', query: 'Bali rice terrace' },
  { file: 'seoul.webp', query: 'N Seoul Tower' },
  { file: 'singapore.webp', query: 'Marina Bay Sands Singapore' },
  { file: 'cappadocia.webp', query: 'Cappadocia hot air balloon' },
  { file: 'kyoto.webp', query: 'Fushimi Inari Kyoto torii' },
  { file: 'halong_bay.webp', query: 'Ha Long Bay Vietnam' },
  { file: 'bangkok.webp', query: 'Wat Arun Bangkok' },
  { file: 'borobudur.webp', query: 'Borobudur temple Indonesia' },
  { file: 'everest.webp', query: 'Mount Everest base camp' },
  // N America
  { file: 'nyc.webp', query: 'Times Square New York' },
  { file: 'grand_canyon.webp', query: 'Grand Canyon Arizona' },
  { file: 'san_francisco.webp', query: 'Golden Gate Bridge San Francisco' },
  { file: 'banff.webp', query: 'Banff National Park lake' },
  { file: 'mexico.webp', query: 'Chichen Itza pyramid Mexico' },
  { file: 'havana.webp', query: 'Havana Cuba vintage car' },
  // S America
  { file: 'machu_picchu.webp', query: 'Machu Picchu Peru' },
  { file: 'rio.webp', query: 'Christ the Redeemer Rio' },
  { file: 'galapagos.webp', query: 'Galapagos tortoise' },
  { file: 'easter_island.webp', query: 'Moai Easter Island' },
  { file: 'iguazu.webp', query: 'Iguazu Falls' },
  // Oceania
  { file: 'sydney.webp', query: 'Sydney Opera House' },
  { file: 'nz.webp', query: 'New Zealand mountain landscape' },
  { file: 'uluru.webp', query: 'Uluru Australia' },
  { file: 'bora_bora.webp', query: 'Bora Bora overwater bungalow' },
  // Africa
  { file: 'pyramids.webp', query: 'Pyramids of Giza Egypt' },
  { file: 'cape_town.webp', query: 'Table Mountain Cape Town' },
  { file: 'victoria_falls.webp', query: 'Victoria Falls' },
  { file: 'serengeti.webp', query: 'Serengeti safari' },
  { file: 'marrakesh.webp', query: 'Marrakesh market Morocco' },
  // Taiwan (missing)
  { file: 'mr_brown_ave.webp', query: 'Taiwan Chishang rice field road' },

  // World Gourmet (food)
  { file: 'food_italy_pizza.webp', query: 'Neapolitan pizza Italy' },
  { file: 'food_france_croissant.webp', query: 'French croissant pastry' },
  { file: 'food_spain_paella.webp', query: 'Spanish paella seafood' },
  { file: 'food_germany_pretzel.webp', query: 'German pretzel bread' },
  { file: 'food_uk_fishchips.webp', query: 'Fish and chips UK' },
  { file: 'food_belgium_waffle.webp', query: 'Belgian waffle' },
  { file: 'food_greece_gyro.webp', query: 'Greek gyro wrap' },
  { file: 'food_portugal_tart.webp', query: 'Pastel de nata Portugal' },
  { file: 'food_switzerland_fondue.webp', query: 'Swiss cheese fondue' },
  { file: 'food_turkey_kebab.webp', query: 'Turkish kebab' },
  { file: 'food_japan_sushi.webp', query: 'Japanese sushi nigiri' },
  { file: 'food_japan_ramen.webp', query: 'Japanese ramen bowl' },
  { file: 'food_korea_bibimbap.webp', query: 'Korean bibimbap' },
  { file: 'food_thailand_padthai.webp', query: 'Pad thai noodles' },
  { file: 'food_vietnam_pho.webp', query: 'Vietnamese pho soup' },
  { file: 'food_india_curry.webp', query: 'Indian curry naan' },
  { file: 'food_china_dimsum.webp', query: 'Dim sum dumplings' },
  { file: 'food_singapore_crab.webp', query: 'Singapore chili crab' },
  { file: 'food_indonesia_satay.webp', query: 'Indonesian satay' },
  { file: 'food_malaysia_laksa.webp', query: 'Malaysian laksa' },
  { file: 'food_philippines_adobo.webp', query: 'Philippine adobo' },
  { file: 'food_usa_burger.webp', query: 'American cheeseburger' },
  { file: 'food_usa_hotdog.webp', query: 'Hot dog' },
  { file: 'food_mexico_tacos.webp', query: 'Mexican tacos' },
  { file: 'food_canada_poutine.webp', query: 'Poutine Canada' },
  { file: 'food_usa_bbq.webp', query: 'Texas BBQ brisket' },
  { file: 'food_cuba_sandwich.webp', query: 'Cuban sandwich' },
  { file: 'food_peru_ceviche.webp', query: 'Peruvian ceviche' },
  { file: 'food_brazil_steak.webp', query: 'Brazilian churrasco steak' },
  { file: 'food_argentina_empanada.webp', query: 'Argentine empanada' },
  { file: 'food_chile_wine.webp', query: 'Chilean wine vineyard' },
  { file: 'food_colombia_coffee.webp', query: 'Colombian coffee' },
  { file: 'food_australia_meatpie.webp', query: 'Australian meat pie' },
  { file: 'food_australia_brunch.webp', query: 'Avocado toast brunch' },
  { file: 'food_nz_lamb.webp', query: 'New Zealand lamb roast' },
  { file: 'food_morocco_tagine.webp', query: 'Moroccan tagine' },
  { file: 'food_egypt_falafel.webp', query: 'Falafel pita' },
  { file: 'food_safrica_biltong.webp', query: 'South African biltong' },
  { file: 'food_ethiopia_injera.webp', query: 'Ethiopian injera' },
  { file: 'food_france_macaron.webp', query: 'French macaron' },
  { file: 'food_austria_sacher.webp', query: 'Sacher torte cake' },
  { file: 'food_italy_gelato.webp', query: 'Italian gelato' },
  { file: 'food_denmark_pastry.webp', query: 'Danish pastry' },
  { file: 'food_baklava.webp', query: 'Baklava dessert' },
  { file: 'food_hk_eggtart.webp', query: 'Hong Kong egg tart' },
  { file: 'food_russia_borscht.webp', query: 'Borscht soup' },
  { file: 'food_vietnam_coffee.webp', query: 'Vietnamese iced coffee' },
  { file: 'food_japan_matcha.webp', query: 'Japanese matcha tea' },
  { file: 'food_world_chocolate.webp', query: 'Chocolate dessert' },

  // Taiwan Gourmet (try English first, then Chinese if no result)
  { file: 'food_boba.webp', query: 'Bubble tea', queryZh: '珍珠奶茶' },
  { file: 'food_beef_noodle.webp', query: 'Taiwan beef noodle soup', queryZh: '牛肉麵' },
  { file: 'food_fried_chicken.webp', query: 'Taiwan fried chicken cutlet', queryZh: '雞排' },
  { file: 'food_xiaolongbao.webp', query: 'Xiaolongbao soup dumpling', queryZh: '小籠包' },
  { file: 'food_stinky_tofu.webp', query: 'Stinky tofu', queryZh: '臭豆腐' },
  { file: 'food_braised_pork.webp', query: 'Braised pork rice Taiwan', queryZh: '滷肉飯' },
  { file: 'food_iron_egg.webp', query: 'Tamsui iron egg', queryZh: '鐵蛋' },
  { file: 'food_scallion_pancake.webp', query: 'Scallion pancake', queryZh: '蔥油餅' },
  { file: 'food_pineapple_cake.webp', query: 'Taiwan pineapple cake', queryZh: '鳳梨酥' },
  { file: 'food_agei.webp', query: 'Tamsui agei', queryZh: '阿給' },
  { file: 'food_pig_blood.webp', query: 'Pig blood cake Taiwan', queryZh: '豬血糕' },
  { file: 'food_bawan.webp', query: 'Taiwan bawan meatball', queryZh: '肉圓' },
  { file: 'food_oyster_omelet.webp', query: 'Oyster omelet Taiwan', queryZh: '蚵仔煎' },
  { file: 'food_shaved_ice.webp', query: 'Mango shaved ice', queryZh: '芒果冰' },
  { file: 'food_beef_soup.webp', query: 'Tainan beef soup', queryZh: '牛肉湯' },
  { file: 'food_turkey_rice.webp', query: 'Chiayi turkey rice', queryZh: '火雞肉飯' },
  { file: 'food_eel_noodle.webp', query: 'Tainan eel noodle', queryZh: '鱔魚意麵' },
  { file: 'food_zongzi.webp', query: 'Zongzi sticky rice', queryZh: '肉粽' },
  { file: 'food_danzai_noodle.webp', query: 'Tainan danzai noodle', queryZh: '擔仔麵' },
  { file: 'food_coffin_bread.webp', query: 'Coffin bread Tainan', queryZh: '棺材板' },
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
    console.log(
      `   [429] waiting ${Math.round(retryAfter / 1000)}s before retry (${attempt}/${MAX_RETRIES})`,
    );
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

const SCENE_WEBP_QUALITY = 82;

function writeSceneWebpFromBuffer(buf, webpPath) {
  const tempPath = `${webpPath}.download.tmp`;
  fs.writeFileSync(tempPath, Buffer.from(buf));
  try {
    execFileSync('cwebp', ['-quiet', '-q', String(SCENE_WEBP_QUALITY), tempPath, '-o', webpPath]);
  } finally {
    fs.unlinkSync(tempPath);
  }
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
  for (const { file, query, queryZh } of MISSING_IMAGES) {
    const filepath = path.join(SCENES_DIR, file);
    if (fs.existsSync(filepath)) {
      console.log(`[skip] ${file} (already exists)`);
      skip++;
      continue;
    }
    try {
      let url = await fetchCommonsImageUrlWithRetry(query);
      if (!url && queryZh) {
        await sleep(DELAY_MS);
        url = await fetchCommonsImageUrlWithRetry(queryZh);
        if (url) console.log(`   (used Chinese query: ${queryZh})`);
      }
      if (!url) {
        console.log(
          `[fail] ${file} – no result for "${query}"${queryZh ? ` or "${queryZh}"` : ''}`,
        );
        fail++;
        await sleep(DELAY_MS);
        continue;
      }
      const res = await fetchWithRetry(url, { redirect: 'follow', headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
      if (file.endsWith('.webp')) {
        writeSceneWebpFromBuffer(buf, filepath);
      } else {
        fs.writeFileSync(filepath, Buffer.from(buf));
      }
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
