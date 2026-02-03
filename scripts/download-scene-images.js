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

  // World Gourmet (food)
  { file: 'food_italy_pizza.jpg', query: 'Neapolitan pizza Italy' },
  { file: 'food_france_croissant.jpg', query: 'French croissant pastry' },
  { file: 'food_spain_paella.jpg', query: 'Spanish paella seafood' },
  { file: 'food_germany_pretzel.jpg', query: 'German pretzel bread' },
  { file: 'food_uk_fishchips.jpg', query: 'Fish and chips UK' },
  { file: 'food_belgium_waffle.jpg', query: 'Belgian waffle' },
  { file: 'food_greece_gyro.jpg', query: 'Greek gyro wrap' },
  { file: 'food_portugal_tart.jpg', query: 'Pastel de nata Portugal' },
  { file: 'food_switzerland_fondue.jpg', query: 'Swiss cheese fondue' },
  { file: 'food_turkey_kebab.jpg', query: 'Turkish kebab' },
  { file: 'food_japan_sushi.jpg', query: 'Japanese sushi nigiri' },
  { file: 'food_japan_ramen.jpg', query: 'Japanese ramen bowl' },
  { file: 'food_korea_bibimbap.jpg', query: 'Korean bibimbap' },
  { file: 'food_thailand_padthai.jpg', query: 'Pad thai noodles' },
  { file: 'food_vietnam_pho.jpg', query: 'Vietnamese pho soup' },
  { file: 'food_india_curry.jpg', query: 'Indian curry naan' },
  { file: 'food_china_dimsum.jpg', query: 'Dim sum dumplings' },
  { file: 'food_singapore_crab.jpg', query: 'Singapore chili crab' },
  { file: 'food_indonesia_satay.jpg', query: 'Indonesian satay' },
  { file: 'food_malaysia_laksa.jpg', query: 'Malaysian laksa' },
  { file: 'food_philippines_adobo.jpg', query: 'Philippine adobo' },
  { file: 'food_usa_burger.jpg', query: 'American cheeseburger' },
  { file: 'food_usa_hotdog.jpg', query: 'Hot dog' },
  { file: 'food_mexico_tacos.jpg', query: 'Mexican tacos' },
  { file: 'food_canada_poutine.jpg', query: 'Poutine Canada' },
  { file: 'food_usa_bbq.jpg', query: 'Texas BBQ brisket' },
  { file: 'food_cuba_sandwich.jpg', query: 'Cuban sandwich' },
  { file: 'food_peru_ceviche.jpg', query: 'Peruvian ceviche' },
  { file: 'food_brazil_steak.jpg', query: 'Brazilian churrasco steak' },
  { file: 'food_argentina_empanada.jpg', query: 'Argentine empanada' },
  { file: 'food_chile_wine.jpg', query: 'Chilean wine vineyard' },
  { file: 'food_colombia_coffee.jpg', query: 'Colombian coffee' },
  { file: 'food_australia_meatpie.jpg', query: 'Australian meat pie' },
  { file: 'food_australia_brunch.jpg', query: 'Avocado toast brunch' },
  { file: 'food_nz_lamb.jpg', query: 'New Zealand lamb roast' },
  { file: 'food_morocco_tagine.jpg', query: 'Moroccan tagine' },
  { file: 'food_egypt_falafel.jpg', query: 'Falafel pita' },
  { file: 'food_safrica_biltong.jpg', query: 'South African biltong' },
  { file: 'food_ethiopia_injera.jpg', query: 'Ethiopian injera' },
  { file: 'food_france_macaron.jpg', query: 'French macaron' },
  { file: 'food_austria_sacher.jpg', query: 'Sacher torte cake' },
  { file: 'food_italy_gelato.jpg', query: 'Italian gelato' },
  { file: 'food_denmark_pastry.jpg', query: 'Danish pastry' },
  { file: 'food_baklava.jpg', query: 'Baklava dessert' },
  { file: 'food_hk_eggtart.jpg', query: 'Hong Kong egg tart' },
  { file: 'food_russia_borscht.jpg', query: 'Borscht soup' },
  { file: 'food_vietnam_coffee.jpg', query: 'Vietnamese iced coffee' },
  { file: 'food_japan_matcha.jpg', query: 'Japanese matcha tea' },
  { file: 'food_world_chocolate.jpg', query: 'Chocolate dessert' },

  // Taiwan Gourmet (try English first, then Chinese if no result)
  { file: 'food_boba.jpg', query: 'Bubble tea', queryZh: '珍珠奶茶' },
  { file: 'food_beef_noodle.jpg', query: 'Taiwan beef noodle soup', queryZh: '牛肉麵' },
  { file: 'food_fried_chicken.jpg', query: 'Taiwan fried chicken cutlet', queryZh: '雞排' },
  { file: 'food_xiaolongbao.jpg', query: 'Xiaolongbao soup dumpling', queryZh: '小籠包' },
  { file: 'food_stinky_tofu.jpg', query: 'Stinky tofu', queryZh: '臭豆腐' },
  { file: 'food_braised_pork.jpg', query: 'Braised pork rice Taiwan', queryZh: '滷肉飯' },
  { file: 'food_iron_egg.jpg', query: 'Tamsui iron egg', queryZh: '鐵蛋' },
  { file: 'food_scallion_pancake.jpg', query: 'Scallion pancake', queryZh: '蔥油餅' },
  { file: 'food_pineapple_cake.jpg', query: 'Taiwan pineapple cake', queryZh: '鳳梨酥' },
  { file: 'food_agei.jpg', query: 'Tamsui agei', queryZh: '阿給' },
  { file: 'food_pig_blood.jpg', query: 'Pig blood cake Taiwan', queryZh: '豬血糕' },
  { file: 'food_bawan.jpg', query: 'Taiwan bawan meatball', queryZh: '肉圓' },
  { file: 'food_oyster_omelet.jpg', query: 'Oyster omelet Taiwan', queryZh: '蚵仔煎' },
  { file: 'food_shaved_ice.jpg', query: 'Mango shaved ice', queryZh: '芒果冰' },
  { file: 'food_beef_soup.jpg', query: 'Tainan beef soup', queryZh: '牛肉湯' },
  { file: 'food_turkey_rice.jpg', query: 'Chiayi turkey rice', queryZh: '火雞肉飯' },
  { file: 'food_eel_noodle.jpg', query: 'Tainan eel noodle', queryZh: '鱔魚意麵' },
  { file: 'food_zongzi.jpg', query: 'Zongzi sticky rice', queryZh: '肉粽' },
  { file: 'food_danzai_noodle.jpg', query: 'Tainan danzai noodle', queryZh: '擔仔麵' },
  { file: 'food_coffin_bread.jpg', query: 'Coffin bread Tainan', queryZh: '棺材板' },
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
        console.log(`[fail] ${file} – no result for "${query}"${queryZh ? ` or "${queryZh}"` : ''}`);
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
