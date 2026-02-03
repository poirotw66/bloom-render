/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Travel photo: positive/negative templates and scene presets.
 * {SCENE} in the positive template is replaced by the scene prompt.
 */

export type TravelSceneGroup = 'international' | 'taiwan';

export type TravelSceneCategory = 'scenery' | 'food';

export type TravelSceneRegion = 'north' | 'central' | 'south' | 'east' | 'islands';

export type TravelContinent = 'europe' | 'asia' | 'namerica' | 'samerica' | 'oceania' | 'africa';

export interface TravelScene {
  id: string;
  nameKey: string;
  prompt: string;
  group: TravelSceneGroup;
  category?: TravelSceneCategory; // Default is 'scenery'
  vibes?: TravelVibe[]; // Specific vibes for this scene
  region?: TravelSceneRegion;
  continent?: TravelContinent;
  x?: number; // percentage from left
  y?: number; // percentage from top
  /** 
   * Optional path to a real photo of the scene (in public/images/scenes/).
   * If provided/uncommented, this photo will be used as a reference to improve realism.
   */
  referenceImagePath?: string;
  /** Optional key for a detailed description (for gourmet items) */
  descriptionKey?: string;
}

/** International travel scenes */
export const TRAVEL_SCENES_INTERNATIONAL: TravelScene[] = [
  // Europe
  { id: 'eiffel', nameKey: 'travel.scene.eiffel', prompt: 'in front of the Eiffel Tower, Paris, travel photography, daytime', group: 'international', category: 'scenery', continent: 'europe', x: 50, y: 28, referenceImagePath: '/images/scenes/eiffel.jpg' },
  { id: 'iceland', nameKey: 'travel.scene.iceland', prompt: 'in Iceland, dramatic mountains, waterfall, nature landscape, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 45, y: 17, referenceImagePath: '/images/scenes/iceland.jpg' },
  { id: 'santorini', nameKey: 'travel.scene.santorini', prompt: 'in Santorini, Greece, white and blue buildings, sea, sunny day, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 55, y: 35, referenceImagePath: '/images/scenes/santorini.jpg' },
  { id: 'london', nameKey: 'travel.scene.london', prompt: 'in London, Big Ben and Westminster Bridge in background, iconic red bus nearby, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 48, y: 27, referenceImagePath: '/images/scenes/london.jpg' },
  { id: 'rome', nameKey: 'travel.scene.rome', prompt: 'in Rome, Italy, in front of the Colosseum, historical ruins, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 53, y: 33, referenceImagePath: '/images/scenes/rome.jpg' },
  { id: 'barcelona', nameKey: 'travel.scene.barcelona', prompt: 'in Barcelona, Sagrada Familia in background, gaudi architecture, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 49, y: 34, referenceImagePath: '/images/scenes/barcelona.jpg' },
  { id: 'swiss_alps', nameKey: 'travel.scene.swiss_alps', prompt: 'in the Swiss Alps, snow-capped mountains, wooden chalet, breathtaking nature, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 52, y: 30, referenceImagePath: '/images/scenes/swiss_alps.jpg' },
  { id: 'neuschwanstein', nameKey: 'travel.scene.neuschwanstein', prompt: 'at Neuschwanstein Castle, Germany, fairy tale castle on a hill, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 53, y: 29, referenceImagePath: '/images/scenes/neuschwanstein.jpg' },
  { id: 'pisa', nameKey: 'travel.scene.pisa', prompt: 'at the Leaning Tower of Pisa, Italy, historical landmark, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 52, y: 32, referenceImagePath: '/images/scenes/pisa.jpg' },
  { id: 'athens', nameKey: 'travel.scene.athens', prompt: 'at the Acropolis of Athens, Parthenon temple, historical greek ruins, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 56, y: 35, referenceImagePath: '/images/scenes/athens.jpg' },
  { id: 'moscow', nameKey: 'travel.scene.moscow', prompt: 'in Moscow, Red Square, Saint Basil\'s Cathedral with colorful domes, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 61, y: 24, referenceImagePath: '/images/scenes/moscow.jpg' },
  { id: 'venice', nameKey: 'travel.scene.venice', prompt: 'in Venice, Italy, on a gondola in the grand canal, historic buildings, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 53, y: 30, referenceImagePath: '/images/scenes/venice.jpg' },
  { id: 'prague', nameKey: 'travel.scene.prague', prompt: 'in Prague, Charles Bridge at sunset, old town medieval architecture, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 54, y: 27, referenceImagePath: '/images/scenes/prague.jpg' },
  { id: 'amsterdam', nameKey: 'travel.scene.amsterdam', prompt: 'in Amsterdam, historic houses along the canal, tulips in foreground, travel photography', group: 'international', category: 'scenery', continent: 'europe', x: 51, y: 26, referenceImagePath: '/images/scenes/amsterdam.jpg' },

  // Asia & Oceania
  { id: 'shibuya', nameKey: 'travel.scene.shibuya', prompt: 'in Shibuya, Tokyo, busy street, city background, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 89, y: 36, referenceImagePath: '/images/scenes/shibuya.jpg' },
  { id: 'taj_mahal', nameKey: 'travel.scene.taj_mahal', prompt: 'at the Taj Mahal, India, white marble palace, reflecting pool, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 71, y: 42, referenceImagePath: '/images/scenes/taj_mahal.jpg' },
  { id: 'great_wall', nameKey: 'travel.scene.great_wall', prompt: 'on the Great Wall of China, ancient stone wall winding through mountains, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 82, y: 32, referenceImagePath: '/images/scenes/great_wall.jpg' },
  { id: 'mt_fuji', nameKey: 'travel.scene.mt_fuji', prompt: 'with Mount Fuji in background, cherry blossoms (sakura), Japan nature, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 88, y: 36, referenceImagePath: '/images/scenes/mt_fuji.jpg' },
  { id: 'dubai', nameKey: 'travel.scene.dubai', prompt: 'in Dubai, Burj Khalifa skyscraper background, modern luxury city, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 65, y: 43, referenceImagePath: '/images/scenes/dubai.jpg' },
  { id: 'petra', nameKey: 'travel.scene.petra', prompt: 'in Petra, Jordan, the Treasury building carved into pink rock, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 60, y: 40, referenceImagePath: '/images/scenes/petra.jpg' },
  { id: 'ankor_wat', nameKey: 'travel.scene.ankor_wat', prompt: 'at Angkor Wat temple, Cambodia, ancient stone architecture, reflection in water, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 79, y: 51, referenceImagePath: '/images/scenes/ankor_wat.jpg' },
  { id: 'bali', nameKey: 'travel.scene.bali', prompt: 'in Bali, Indonesia, lush green rice terraces, tropical jungle, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 82, y: 65, referenceImagePath: '/images/scenes/bali.jpg' },
  { id: 'seoul', nameKey: 'travel.scene.seoul', prompt: 'in Seoul, N Seoul Tower background, city view from mountain, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 85, y: 34, referenceImagePath: '/images/scenes/seoul.jpg' },
  { id: 'singapore', nameKey: 'travel.scene.singapore', prompt: 'in Singapore, Marina Bay Sands hotel background, modern bay view, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 79, y: 59, referenceImagePath: '/images/scenes/singapore.jpg' },
  { id: 'cappadocia', nameKey: 'travel.scene.cappadocia', prompt: 'in Cappadocia, Turkey, dozens of hot air balloons in the sky over fairy chimneys, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 60, y: 35, referenceImagePath: '/images/scenes/cappadocia.jpg' },
  { id: 'kyoto', nameKey: 'travel.scene.kyoto', prompt: 'in Kyoto, Japan, Fushimi Inari shrine with thousands of red torii gates, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 87, y: 36, referenceImagePath: '/images/scenes/kyoto.jpg' },
  { id: 'halong_bay', nameKey: 'travel.scene.halong_bay', prompt: 'in Ha Long Bay, Vietnam, limestone islands in emerald water, on a traditional junk boat, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 80, y: 45, referenceImagePath: '/images/scenes/halong_bay.jpg' },
  { id: 'bangkok', nameKey: 'travel.scene.bangkok', prompt: 'in Bangkok, Thailand, at Wat Arun Temple of Dawn, river background, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 78, y: 50, referenceImagePath: '/images/scenes/bangkok.jpg' },
  { id: 'borobudur', nameKey: 'travel.scene.borobudur', prompt: 'at Borobudur Temple, Indonesia, massive stone stupas at sunrise, misty jungle view, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 80, y: 64, referenceImagePath: '/images/scenes/borobudur.jpg' },
  { id: 'everest', nameKey: 'travel.scene.everest', prompt: 'at Mount Everest Base Camp, snow-capped peaks, colorful prayer flags, extreme mountain nature, travel photography', group: 'international', category: 'scenery', continent: 'asia', x: 73, y: 41, referenceImagePath: '/images/scenes/everest.jpg' },
  { id: 'sydney', nameKey: 'travel.scene.sydney', prompt: 'in Sydney, Opera House in background, harbor bridge, sunny day, travel photography', group: 'international', category: 'scenery', continent: 'oceania', x: 92, y: 83, referenceImagePath: '/images/scenes/sydney.jpg' },
  { id: 'nz_mountains', nameKey: 'travel.scene.nz', prompt: 'in New Zealand, Lord of the Rings style mountains, blue lake, sweeping landscape, travel photography', group: 'international', category: 'scenery', continent: 'oceania', x: 98, y: 89, referenceImagePath: '/images/scenes/nz.jpg' },
  { id: 'uluru', nameKey: 'travel.scene.uluru', prompt: 'at Uluru (Ayers Rock), Australia, massive red monolithic rock in the outback, travel photography', group: 'international', category: 'scenery', continent: 'oceania', x: 86, y: 78, referenceImagePath: '/images/scenes/uluru.jpg' },
  { id: 'bora_bora', nameKey: 'travel.scene.bora_bora', prompt: 'in Bora Bora, on a private overwater bungalow balcony, crystal clear turquoise lagoon, travel photography', group: 'international', category: 'scenery', continent: 'oceania', x: 8, y: 71, referenceImagePath: '/images/scenes/bora_bora.jpg' },

  // North America
  { id: 'nyc', nameKey: 'travel.scene.nyc', prompt: 'in New York City, Times Square, city street, travel photography', group: 'international', category: 'scenery', continent: 'namerica', x: 29, y: 31, referenceImagePath: '/images/scenes/nyc.jpg' },
  { id: 'grand_canyon', nameKey: 'travel.scene.grand_canyon', prompt: 'at the Grand Canyon, Arizona, massive red rock canyons, vast landscape, travel photography', group: 'international', category: 'scenery', continent: 'namerica', x: 19, y: 34, referenceImagePath: '/images/scenes/grand_canyon.jpg' },
  { id: 'san_francisco', nameKey: 'travel.scene.san_francisco', prompt: 'at the Golden Gate Bridge, San Francisco, red bridge background with fog, travel photography', group: 'international', category: 'scenery', continent: 'namerica', x: 16, y: 33, referenceImagePath: '/images/scenes/san_francisco.jpg' },
  { id: 'banff', nameKey: 'travel.scene.banff', prompt: 'in Banff National Park, Canada, turquoise lake, pine trees, snow mountains, travel photography', group: 'international', category: 'scenery', continent: 'namerica', x: 18, y: 25, referenceImagePath: '/images/scenes/banff.jpg' },
  { id: 'mexico', nameKey: 'travel.scene.mexico', prompt: 'at Chichen Itza pyramid, Mexico, Mayan ruins, tropical setting, travel photography', group: 'international', category: 'scenery', continent: 'namerica', x: 25, y: 46, referenceImagePath: '/images/scenes/mexico.jpg' },
  { id: 'havana', nameKey: 'travel.scene.havana', prompt: 'in Havana, Cuba, driving a classic vintage car on the malecon waterfront, colorful buildings, travel photography', group: 'international', category: 'scenery', continent: 'namerica', x: 27, y: 44, referenceImagePath: '/images/scenes/havana.jpg' },

  // South America
  { id: 'machu_picchu', nameKey: 'travel.scene.machu_picchu', prompt: 'at Machu Picchu, Peru, ancient inca ruins over green mountains, clouds, travel photography', group: 'international', category: 'scenery', continent: 'samerica', x: 30, y: 68, referenceImagePath: '/images/scenes/machu_picchu.jpg' },
  { id: 'rio', nameKey: 'travel.scene.rio', prompt: 'in Rio de Janeiro, Christ the Redeemer statue in background, mountain harbor view, travel photography', group: 'international', category: 'scenery', continent: 'samerica', x: 38, y: 76, referenceImagePath: '/images/scenes/rio.jpg' },
  { id: 'galapagos', nameKey: 'travel.scene.galapagos', prompt: 'on the Galapagos Islands, posing near a giant tortoise, volcanic rock, ocean background, travel photography', group: 'international', category: 'scenery', continent: 'samerica', x: 24, y: 58, referenceImagePath: '/images/scenes/galapagos.jpg' },
  { id: 'easter_island', nameKey: 'travel.scene.easter_island', prompt: 'on Easter Island, standing in front of massive Moai stone statues, grassy hills, travel photography', group: 'international', category: 'scenery', continent: 'samerica', x: 19, y: 79, referenceImagePath: '/images/scenes/easter_island.jpg' },
  { id: 'iguazu', nameKey: 'travel.scene.iguazu', prompt: 'at Iguazu Falls, standing on the observation walkway, powerful cascading waterfalls, travel photography', group: 'international', category: 'scenery', continent: 'samerica', x: 35, y: 78, referenceImagePath: '/images/scenes/iguazu.jpg' },

  // Africa
  { id: 'pyramids', nameKey: 'travel.scene.pyramids', prompt: 'at the Pyramids of Giza, Egypt, ancient pyramids in the desert, sand dunes, travel photography', group: 'international', category: 'scenery', continent: 'africa', x: 59, y: 40, referenceImagePath: '/images/scenes/pyramids.jpg' },
  { id: 'cape_town', nameKey: 'travel.scene.cape_town', prompt: 'in Cape Town, South Africa, Table Mountain background, beautiful coast, travel photography', group: 'international', category: 'scenery', continent: 'africa', x: 55, y: 84, referenceImagePath: '/images/scenes/cape_town.jpg' },
  { id: 'victoria_falls', nameKey: 'travel.scene.victoria_falls', prompt: 'at Victoria Falls, massive waterfall mist, rainbow, lush vegetation, travel photography', group: 'international', category: 'scenery', continent: 'africa', x: 57, y: 72, referenceImagePath: '/images/scenes/victoria_falls.jpg' },
  { id: 'serengeti', nameKey: 'travel.scene.serengeti', prompt: 'on Serengeti safari, savanna landscape, acacia tree, sunset, wild animals background, travel photography', group: 'international', category: 'scenery', continent: 'africa', x: 60, y: 61, referenceImagePath: '/images/scenes/serengeti.jpg' },
  { id: 'marrakesh', nameKey: 'travel.scene.marrakesh', prompt: 'in Marrakesh, Morocco, bustling spice souk (market), intricate islamic tiles, travel photography', group: 'international', category: 'scenery', continent: 'africa', x: 48, y: 39, referenceImagePath: '/images/scenes/marrakesh.jpg' },

  // --- WORLD GOURMET (50 locations) ---
  // Europe Food
  { id: 'food_italy_pizza', nameKey: 'travel.food.italy_pizza', prompt: 'eating a classic Neapolitan pizza with melted buffalo mozzarella and fresh basil, street side cafe in Naples Italy background', group: 'international', category: 'food', continent: 'europe', x: 53, y: 32, referenceImagePath: '/images/scenes/food_italy_pizza.jpg', descriptionKey: 'travel.food.italy_pizza.desc' },
  { id: 'food_france_croissant', nameKey: 'travel.food.france_croissant', prompt: 'holding a buttery flaky croissant in front of a cozy Parisian bistro, morning light', group: 'international', category: 'food', continent: 'europe', x: 50, y: 28, referenceImagePath: '/images/scenes/food_france_croissant.jpg', descriptionKey: 'travel.food.france_croissant.desc' },
  { id: 'food_spain_paella', nameKey: 'travel.food.spain_paella', prompt: 'eating seafood paella from a large pan, vibrant yellow rice, shrimp and mussels, sunny Barcelona terrace background', group: 'international', category: 'food', continent: 'europe', x: 49, y: 34, referenceImagePath: '/images/scenes/food_spain_paella.jpg', descriptionKey: 'travel.food.spain_paella.desc' },
  { id: 'food_germany_pretzel', nameKey: 'travel.food.germany_pretzel', prompt: 'holding a giant salted pretzel at an outdoor beer garden in Munich, traditional wooden tables background', group: 'international', category: 'food', continent: 'europe', x: 53, y: 29, referenceImagePath: '/images/scenes/food_germany_pretzel.jpg', descriptionKey: 'travel.food.germany_pretzel.desc' },
  { id: 'food_uk_fishchips', nameKey: 'travel.food.uk_fishchips', prompt: 'eating fish and chips wrapped in paper, crispy battered fish, large potato wedges, London street background', group: 'international', category: 'food', continent: 'europe', x: 48, y: 27, referenceImagePath: '/images/scenes/food_uk_fishchips.jpg', descriptionKey: 'travel.food.uk_fishchips.desc' },
  { id: 'food_belgium_waffle', nameKey: 'travel.food.belgium_waffle', prompt: 'eating a Brussels waffle topped with strawberries and chocolate sauce, medieval city square background', group: 'international', category: 'food', continent: 'europe', x: 51, y: 27, referenceImagePath: '/images/scenes/food_belgium_waffle.jpg', descriptionKey: 'travel.food.belgium_waffle.desc' },
  { id: 'food_greece_gyro', nameKey: 'travel.food.greece_gyro', prompt: 'eating a Greek gyro wrap with meat, tzatziki, and fries inside, white Santorini buildings background', group: 'international', category: 'food', continent: 'europe', x: 55, y: 35, referenceImagePath: '/images/scenes/food_greece_gyro.jpg', descriptionKey: 'travel.food.greece_gyro.desc' },
  { id: 'food_portugal_tart', nameKey: 'travel.food.portugal_tart', prompt: 'holding a Pastel de Nata (egg tart) with cinnamon sprinkles, historic Lisbon street background', group: 'international', category: 'food', continent: 'europe', x: 44, y: 34, referenceImagePath: '/images/scenes/food_portugal_tart.jpg', descriptionKey: 'travel.food.portugal_tart.desc' },
  { id: 'food_switzerland_fondue', nameKey: 'travel.food.switzerland_fondue', prompt: 'dipping bread into a pot of melted cheese fondue, snowy Swiss Alps through the window background', group: 'international', category: 'food', continent: 'europe', x: 52, y: 30, referenceImagePath: '/images/scenes/food_switzerland_fondue.jpg', descriptionKey: 'travel.food.switzerland_fondue.desc' },
  { id: 'food_turkey_kebab', nameKey: 'travel.food.turkey_kebab', prompt: 'eating a Turkish kebab with grilled meat and vegetables, Istanbul skyline background', group: 'international', category: 'food', continent: 'europe', x: 60, y: 35, referenceImagePath: '/images/scenes/food_turkey_kebab.jpg', descriptionKey: 'travel.food.turkey_kebab.desc' },

  // Asia Food
  { id: 'food_japan_sushi', nameKey: 'travel.food.japan_sushi', prompt: 'eating high quality nigiri sushi at a traditional wooden counter, Tokyo sushi bar atmosphere', group: 'international', category: 'food', continent: 'asia', x: 89, y: 36, referenceImagePath: '/images/scenes/food_japan_sushi.jpg', descriptionKey: 'travel.food.japan_sushi.desc' },
  { id: 'food_japan_ramen', nameKey: 'travel.food.japan_ramen', prompt: 'slurping a bowl of hot tonkotsu ramen with pork slices and egg, busy Tokyo lantern-lit alley background', group: 'international', category: 'food', continent: 'asia', x: 88, y: 36, referenceImagePath: '/images/scenes/food_japan_ramen.jpg', descriptionKey: 'travel.food.japan_ramen.desc' },
  { id: 'food_korea_bibimbap', nameKey: 'travel.food.korea_bibimbap', prompt: 'eating colorful bibimbap in a stone pot, mixing rice with vegetables and gochujang, Seoul city background', group: 'international', category: 'food', continent: 'asia', x: 85, y: 34, referenceImagePath: '/images/scenes/food_korea_bibimbap.jpg', descriptionKey: 'travel.food.korea_bibimbap.desc' },
  { id: 'food_thailand_padthai', nameKey: 'travel.food.thailand_padthai', prompt: 'eating Pad Thai at a vibrant Bangkok night market, stir-fried noodles with shrimp and peanuts', group: 'international', category: 'food', continent: 'asia', x: 78, y: 50, referenceImagePath: '/images/scenes/food_thailand_padthai.jpg', descriptionKey: 'travel.food.thailand_padthai.desc' },
  { id: 'food_vietnam_pho', nameKey: 'travel.food.vietnam_pho', prompt: 'eating a bowl of beef Pho with fresh herbs and lime, sitting on a low plastic stool, Hanoi street background', group: 'international', category: 'food', continent: 'asia', x: 80, y: 46, referenceImagePath: '/images/scenes/food_vietnam_pho.jpg', descriptionKey: 'travel.food.vietnam_pho.desc' },
  { id: 'food_india_curry', nameKey: 'travel.food.india_curry', prompt: 'eating butter chicken curry with garlic naan bread, colorful Indian restaurant background', group: 'international', category: 'food', continent: 'asia', x: 71, y: 42, referenceImagePath: '/images/scenes/food_india_curry.jpg', descriptionKey: 'travel.food.india_curry.desc' },
  { id: 'food_china_dimsum', nameKey: 'travel.food.china_dimsum', prompt: 'eating dim sum from bamboo steamers, har gow and siu mai, traditional Cantonese teahouse background', group: 'international', category: 'food', continent: 'asia', x: 82, y: 35, referenceImagePath: '/images/scenes/food_china_dimsum.jpg', descriptionKey: 'travel.food.china_dimsum.desc' },
  { id: 'food_singapore_crab', nameKey: 'travel.food.singapore_crab', prompt: 'eating Singapore chili crab with mantou buns, waterfront dining at Marina Bay background', group: 'international', category: 'food', continent: 'asia', x: 79, y: 59, referenceImagePath: '/images/scenes/food_singapore_crab.jpg', descriptionKey: 'travel.food.singapore_crab.desc' },
  { id: 'food_indonesia_satay', nameKey: 'travel.food.indonesia_satay', prompt: 'eating grilled meat satay with peanut sauce, tropical Bali beach sunset background', group: 'international', category: 'food', continent: 'asia', x: 82, y: 65, referenceImagePath: '/images/scenes/food_indonesia_satay.jpg' },
  { id: 'food_malaysia_laksa', nameKey: 'travel.food.malaysia_laksa', prompt: 'eating spicy curry laksa with coconut milk broth, bustling Kuala Lumpur street background', group: 'international', category: 'food', continent: 'asia', x: 78, y: 57, referenceImagePath: '/images/scenes/food_malaysia_laksa.jpg' },
  { id: 'food_philippines_adobo', nameKey: 'travel.food.philippines_adobo', prompt: 'eating chicken adobo with white rice, savoring the soy and vinegar sauce, Manila setting', group: 'international', category: 'food', continent: 'asia', x: 85, y: 50, referenceImagePath: '/images/scenes/food_philippines_adobo.jpg' },

  // North America Food
  { id: 'food_usa_burger', nameKey: 'travel.food.usa_burger', prompt: 'eating a massive juicy cheeseburger with fries, classic 1950s American diner background', group: 'international', category: 'food', continent: 'namerica', x: 29, y: 31, referenceImagePath: '/images/scenes/food_usa_burger.jpg', descriptionKey: 'travel.food.usa_burger.desc' },
  { id: 'food_usa_hotdog', nameKey: 'travel.food.usa_hotdog', prompt: 'eating a New York style hot dog with mustard, busy Times Square background', group: 'international', category: 'food', continent: 'namerica', x: 30, y: 31, referenceImagePath: '/images/scenes/food_usa_hotdog.jpg', descriptionKey: 'travel.food.usa_hotdog.desc' },
  { id: 'food_mexico_tacos', nameKey: 'travel.food.mexico_tacos', prompt: 'eating authentic street tacos with cilantro and onions, colorful Mexico City market background', group: 'international', category: 'food', continent: 'namerica', x: 25, y: 46, referenceImagePath: '/images/scenes/food_mexico_tacos.jpg', descriptionKey: 'travel.food.mexico_tacos.desc' },
  { id: 'food_canada_poutine', nameKey: 'travel.food.canada_poutine', prompt: 'eating poutine with fries, cheese curds and hot gravy, snowy Quebec city street background', group: 'international', category: 'food', continent: 'namerica', x: 28, y: 25, referenceImagePath: '/images/scenes/food_canada_poutine.jpg' },
  { id: 'food_usa_bbq', nameKey: 'travel.food.usa_bbq', prompt: 'eating Texas style smoked brisket and ribs, outdoor BBQ joint with rustic wood tables', group: 'international', category: 'food', continent: 'namerica', x: 25, y: 36, referenceImagePath: '/images/scenes/food_usa_bbq.jpg' },
  { id: 'food_cuba_sandwich', nameKey: 'travel.food.cuba_sandwich', prompt: 'eating a pressed Cuban sandwich with ham and pickles, vintage Havana street background', group: 'international', category: 'food', continent: 'namerica', x: 27, y: 44, referenceImagePath: '/images/scenes/food_cuba_sandwich.jpg' },

  // South America Food
  { id: 'food_peru_ceviche', nameKey: 'travel.food.peru_ceviche', prompt: 'eating fresh lime-marinated ceviche with sweet potato, Pacific ocean view at a Lima restaurant background', group: 'international', category: 'food', continent: 'samerica', x: 26, y: 64, referenceImagePath: '/images/scenes/food_peru_ceviche.jpg' },
  { id: 'food_brazil_steak', nameKey: 'travel.food.brazil_steak', prompt: 'eating picanha steak from a large skewer, Brazilian churrascaria steakhouse background', group: 'international', category: 'food', continent: 'samerica', x: 38, y: 76, referenceImagePath: '/images/scenes/food_brazil_steak.jpg' },
  { id: 'food_argentina_empanada', nameKey: 'travel.food.argentina_empanada', prompt: 'holding a golden brown beef empanada, rustic Buenos Aires cafe background', group: 'international', category: 'food', continent: 'samerica', x: 35, y: 85, referenceImagePath: '/images/scenes/food_argentina_empanada.jpg' },
  { id: 'food_chile_wine', nameKey: 'travel.food.chile_wine', prompt: 'tasting red wine at a beautiful Chilean vineyard, Andes mountains in background', group: 'international', category: 'food', continent: 'samerica', x: 31, y: 82, referenceImagePath: '/images/scenes/food_chile_wine.jpg' },
  { id: 'food_colombia_coffee', nameKey: 'travel.food.colombia_coffee', prompt: 'drinking a cup of premium Colombian coffee, lush green coffee plantation background', group: 'international', category: 'food', continent: 'samerica', x: 31, y: 55, referenceImagePath: '/images/scenes/food_colombia_coffee.jpg' },

  // Oceania Food
  { id: 'food_australia_meatpie', nameKey: 'travel.food.australia_meatpie', prompt: 'eating a classic Australian meat pie with tomato sauce, Sydney Opera House background', group: 'international', category: 'food', continent: 'oceania', x: 92, y: 83, referenceImagePath: '/images/scenes/food_australia_meatpie.jpg' },
  { id: 'food_australia_brunch', nameKey: 'travel.food.australia_brunch', prompt: 'eating avocado toast with poached eggs at a trendy Melbourne cafe, bright and airy atmosphere', group: 'international', category: 'food', continent: 'oceania', x: 89, y: 85, referenceImagePath: '/images/scenes/food_australia_brunch.jpg' },
  { id: 'food_nz_lamb', nameKey: 'travel.food.nz_lamb', prompt: 'eating roasted New Zealand lamb chops with herbs, beautiful green rolling hills background', group: 'international', category: 'food', continent: 'oceania', x: 98, y: 89, referenceImagePath: '/images/scenes/food_nz_lamb.jpg' },

  // Africa Food
  { id: 'food_morocco_tagine', nameKey: 'travel.food.morocco_tagine', prompt: 'eating a slow-cooked lamb tagine from a clay pot, intricate Marrakesh riad background', group: 'international', category: 'food', continent: 'africa', x: 48, y: 39, referenceImagePath: '/images/scenes/food_morocco_tagine.jpg' },
  { id: 'food_egypt_falafel', nameKey: 'travel.food.egypt_falafel', prompt: 'eating crispy hot falafels in pita bread, busy Cairo market background', group: 'international', category: 'food', continent: 'africa', x: 59, y: 40, referenceImagePath: '/images/scenes/food_egypt_falafel.jpg' },
  { id: 'food_safrica_biltong', nameKey: 'travel.food.safrica_biltong', prompt: 'eating South African biltong (dried meat), beautiful Cape Town coast background', group: 'international', category: 'food', continent: 'africa', x: 55, y: 84, referenceImagePath: '/images/scenes/food_safrica_biltong.jpg' },
  { id: 'food_ethiopia_injera', nameKey: 'travel.food.ethiopia_injera', prompt: 'eating spicy doro wat stew on spongy injera flatbread, traditional Ethiopian dining setting', group: 'international', category: 'food', continent: 'africa', x: 62, y: 54, referenceImagePath: '/images/scenes/food_ethiopia_injera.jpg' },

  // desserts & others
  { id: 'food_france_macaron', nameKey: 'travel.food.france_macaron', prompt: 'eating colorful macarons at a luxurious Paris pastry shop, pastel colors background', group: 'international', category: 'food', continent: 'europe', x: 50, y: 29, referenceImagePath: '/images/scenes/food_france_macaron.jpg' },
  { id: 'food_austria_sacher', nameKey: 'travel.food.austria_sacher', prompt: 'eating Sacher torte chocolate cake with whipped cream, elegant Vienna cafe background', group: 'international', category: 'food', continent: 'europe', x: 54, y: 29, referenceImagePath: '/images/scenes/food_austria_sacher.jpg' },
  { id: 'food_italy_gelato', nameKey: 'travel.food.italy_gelato', prompt: 'eating a cone of Italian gelato, Florence historic cathedral background', group: 'international', category: 'food', continent: 'europe', x: 53, y: 31, referenceImagePath: '/images/scenes/food_italy_gelato.jpg' },
  { id: 'food_denmark_pastry', nameKey: 'travel.food.denmark_pastry', prompt: 'eating a Danish pastry with fruit filling, colorful Nyhavn harbor in Copenhagen background', group: 'international', category: 'food', continent: 'europe', x: 52, y: 23, referenceImagePath: '/images/scenes/food_denmark_pastry.jpg' },
  { id: 'food_middleeast_baklava', nameKey: 'travel.food.baklava', prompt: 'eating sweet honey baklava with pistachios, ornate Middle Eastern teahouse background', group: 'international', category: 'food', continent: 'asia', x: 63, y: 38, referenceImagePath: '/images/scenes/food_baklava.jpg' },
  { id: 'food_hongkong_eggtart', nameKey: 'travel.food.hk_eggtart', prompt: 'eating a Hong Kong style egg tart with flaky crust, bustling street market background', group: 'international', category: 'food', continent: 'asia', x: 81, y: 43, referenceImagePath: '/images/scenes/food_hk_eggtart.jpg' },
  { id: 'food_russia_borscht', nameKey: 'travel.food.russia_borscht', prompt: 'eating a bowl of vibrant red beet borscht with sour cream, snowy Moscow square background', group: 'international', category: 'food', continent: 'europe', x: 61, y: 24, referenceImagePath: '/images/scenes/food_russia_borscht.jpg' },
  { id: 'food_vietnam_coffee', nameKey: 'travel.food.vietnam_coffee', prompt: 'drinking Vietnamese iced coffee with condensed milk, sitting on a low stool at a busy Saigon corner', group: 'international', category: 'food', continent: 'asia', x: 81, y: 48, referenceImagePath: '/images/scenes/food_vietnam_coffee.jpg' },
  { id: 'food_japan_matcha', nameKey: 'travel.food.japan_matcha', prompt: 'drinking ceremonial matcha green tea, traditional Japanese tatami tea room background', group: 'international', category: 'food', continent: 'asia', x: 87, y: 37, referenceImagePath: '/images/scenes/food_japan_matcha.jpg' },
  { id: 'food_world_chocolate', nameKey: 'travel.food.world_chocolate', prompt: 'tasting luxury artisanal chocolates, elegant boutique chocolate shop background', group: 'international', category: 'food', continent: 'europe', x: 51, y: 28, referenceImagePath: '/images/scenes/food_world_chocolate.jpg' },
];

/** Taiwan round-island scenes - Expanded to 30 locations */
export const TRAVEL_SCENES_TAIWAN: TravelScene[] = [
  // --- North (Taipei, New Taipei, Keelung, Yilan) ---
  { id: 'taipei101', nameKey: 'travel.scene.taipei101', prompt: 'in front of Taipei 101, towering skyscraper background, Taipei city skyline', group: 'taiwan', category: 'scenery', region: 'north', x: 55, y: 18, referenceImagePath: '/images/scenes/taipei101.jpg' },
  { id: 'jiufen', nameKey: 'travel.scene.jiufen', prompt: 'at Jiufen Old Street, red lanterns, narrow alleyway, traditional tea house architecture', group: 'taiwan', category: 'scenery', region: 'north', x: 62, y: 14, referenceImagePath: '/images/scenes/jiufen.jpg' },
  { id: 'ximending', nameKey: 'travel.scene.ximending', prompt: 'in Ximending, neon signs, busy pedestrian street, vibrant urban atmosphere', group: 'taiwan', category: 'scenery', region: 'north', x: 48, y: 20, referenceImagePath: '/images/scenes/ximending.jpg' },
  { id: 'cks_memorial', nameKey: 'travel.scene.cks_memorial', prompt: 'at Chiang Kai-shek Memorial Hall, large white building with blue roof, spacious liberty square', group: 'taiwan', category: 'scenery', region: 'north', x: 52, y: 23, referenceImagePath: '/images/scenes/cks_memorial.jpg' },
  { id: 'raohe_market', nameKey: 'travel.scene.raohe_market', prompt: 'at Raohe Night Market entrance, glowing temple gate, busy street food stalls', group: 'taiwan', category: 'scenery', region: 'north', x: 58, y: 20, referenceImagePath: '/images/scenes/raohe_market.jpg' },
  { id: 'yehliu', nameKey: 'travel.scene.yehliu', prompt: 'at Yehliu Geopark, rock formations, Queens Head rock, ocean background', group: 'taiwan', category: 'scenery', region: 'north', x: 60, y: 10, referenceImagePath: '/images/scenes/yehliu.jpg' },
  { id: 'shifen_waterfall', nameKey: 'travel.scene.shifen', prompt: 'at Shifen Waterfall, large cascade of water, nature scenery, green lush forest', group: 'taiwan', category: 'scenery', region: 'north', x: 64, y: 17, referenceImagePath: '/images/scenes/shifen_waterfall.jpg' },
  { id: 'tamsui', nameKey: 'travel.scene.tamsui', prompt: 'at Tamsui Fishermans Wharf, Lovers Bridge, river sunset view, romantic atmosphere', group: 'taiwan', category: 'scenery', region: 'north', x: 46, y: 14, referenceImagePath: '/images/scenes/tamsui.jpg' },
  { id: 'guiishan', nameKey: 'travel.scene.guiishan', prompt: 'with Guishan Island (Turtle Island) in the background, ocean view, Yilan coast', group: 'taiwan', category: 'scenery', region: 'north', x: 68, y: 24, referenceImagePath: '/images/scenes/guiishan.jpg' },

  // --- Central (Taichung, Nantou, Changhua) ---
  { id: 'gaomei', nameKey: 'travel.scene.gaomei', prompt: 'at Gaomei Wetlands, wind turbines in background, mirror-like water reflection, sunset', group: 'taiwan', category: 'scenery', region: 'central', x: 36, y: 38, referenceImagePath: '/images/scenes/gaomei.jpg' },
  { id: 'taichung_theater', nameKey: 'travel.scene.theater', prompt: 'in front of National Taichung Theater, curved modern architecture, artistic building', group: 'taiwan', category: 'scenery', region: 'central', x: 42, y: 40, referenceImagePath: '/images/scenes/taichung_theater.jpg' },
  { id: 'rainbow_village', nameKey: 'travel.scene.rainbow', prompt: 'at Rainbow Village in Taichung, colorful painted walls, vibrant art patterns', group: 'taiwan', category: 'scenery', region: 'central', x: 40, y: 42, referenceImagePath: '/images/scenes/rainbow_village.jpg' },
  { id: 'sunmoonlake', nameKey: 'travel.scene.sunmoonlake', prompt: 'at Sun Moon Lake, calm blue water, layers of mountains, traditional boat dock', group: 'taiwan', category: 'scenery', region: 'central', x: 50, y: 48, referenceImagePath: '/images/scenes/sunmoonlake.jpg' },
  { id: 'qingjing', nameKey: 'travel.scene.qingjing', prompt: 'at Qingjing Farm, green rolling hills, sheep grazing, swiss-style architecture', group: 'taiwan', category: 'scenery', region: 'central', x: 54, y: 44, referenceImagePath: '/images/scenes/qingjing.jpg' },
  { id: 'hehuanshan', nameKey: 'travel.scene.hehuanshan', prompt: 'on Hehuanshan mountain peak, sea of clouds, high altitude alpine scenery', group: 'taiwan', category: 'scenery', region: 'central', x: 56, y: 40, referenceImagePath: '/images/scenes/hehuanshan.jpg' },
  { id: 'lugang', nameKey: 'travel.scene.lugang', prompt: 'in Lugang Old Street, red brick historic buildings, narrow lane, cultural heritage', group: 'taiwan', category: 'scenery', region: 'central', x: 34, y: 45, referenceImagePath: '/images/scenes/lugang.jpg' },

  // --- South (Yunlin, Chiayi, Tainan, Kaohsiung, Pingtung) ---
  { id: 'alishan', nameKey: 'travel.scene.alishan', prompt: 'in Alishan Forest, ancient giant cypress trees, misty railway track, forest train', group: 'taiwan', category: 'scenery', region: 'south', x: 45, y: 55, referenceImagePath: '/images/scenes/alishan.jpg' },
  { id: 'hinoki_village', nameKey: 'travel.scene.hinoki', prompt: 'at Hinoki Village Chiayi, japanese style wooden houses, zen garden atmosphere', group: 'taiwan', category: 'scenery', region: 'south', x: 42, y: 56, referenceImagePath: '/images/scenes/hinoki_village.jpg' },
  { id: 'tainan_confucius', nameKey: 'travel.scene.confucius', prompt: 'at Tainan Confucius Temple, traditional red walls, peaceful courtyard, ancient trees', group: 'taiwan', category: 'scenery', region: 'south', x: 40, y: 68, referenceImagePath: '/images/scenes/tainan_confucius.jpg' },
  { id: 'chimei_museum', nameKey: 'travel.scene.chimei', prompt: 'in front of Chimei Museum, grand european classical palace architecture, fountain', group: 'taiwan', category: 'scenery', region: 'south', x: 41, y: 70, referenceImagePath: '/images/scenes/chimei_museum.jpg' },
  { id: 'kaohsiung_music', nameKey: 'travel.scene.music_center', prompt: 'at Kaohsiung Music Center, futuristic honeycomb architecture, harbor view', group: 'taiwan', category: 'scenery', region: 'south', x: 40, y: 80, referenceImagePath: '/images/scenes/kaohsiung_music.jpg' },
  { id: 'dragon_tiger', nameKey: 'travel.scene.dragontiger', prompt: 'at Dragon and Tiger Pagodas Kaohsiung, twin pagodas, lotus lake, colorful bridge', group: 'taiwan', category: 'scenery', region: 'south', x: 41, y: 78, referenceImagePath: '/images/scenes/dragon_tiger.jpg' },
  { id: 'formosa_boulevard', nameKey: 'travel.scene.dome', prompt: 'inside Formosa Boulevard Station, Dome of Light, colorful stained glass ceiling', group: 'taiwan', category: 'scenery', region: 'south', x: 42, y: 81, referenceImagePath: '/images/scenes/formosa_boulevard.jpg' },
  { id: 'kenting', nameKey: 'travel.scene.kenting', prompt: 'at Kenting Baishawan beach, white sand, turquoise ocean, tropical palm trees', group: 'taiwan', category: 'scenery', region: 'south', x: 50, y: 88, referenceImagePath: '/images/scenes/kenting.jpg' },
  { id: 'eluanbi', nameKey: 'travel.scene.eluanbi', prompt: 'at Eluanbi Lighthouse, white lighthouse, green grass, blue sky, southern tip of Taiwan', group: 'taiwan', category: 'scenery', region: 'south', x: 52, y: 92, referenceImagePath: '/images/scenes/eluanbi.jpg' },

  // --- East (Hualien, Taitung) ---
  { id: 'taroko', nameKey: 'travel.scene.taroko', prompt: 'at Taroko Gorge, marble canyon walls, swallow grotto, turquoise river below', group: 'taiwan', category: 'scenery', region: 'east', x: 58, y: 35, referenceImagePath: '/images/scenes/taroko.jpg' },
  { id: 'qingshui_cliff', nameKey: 'travel.scene.qingshui', prompt: 'at Qingshui Cliff, steep cliffs dropping into the pacific ocean, dramatic coastline', group: 'taiwan', category: 'scenery', region: 'east', x: 60, y: 30, referenceImagePath: '/images/scenes/qingshui_cliff.jpg' },
  { id: 'mr_brown_ave', nameKey: 'travel.scene.mrbrown', prompt: 'at Mr. Brown Avenue Chishang, endless green rice paddies, road leading to mountains', group: 'taiwan', category: 'scenery', region: 'east', x: 55, y: 72, referenceImagePath: '/images/scenes/mr_brown_ave.jpg' },
  { id: 'sanxiantai', nameKey: 'travel.scene.sanxiantai', prompt: 'at Sanxiantai, eight-arch footbridge crossing the ocean, rocky coast', group: 'taiwan', category: 'scenery', region: 'east', x: 62, y: 65, referenceImagePath: '/images/scenes/sanxiantai.jpg' },

  // --- Islands ---
  { id: 'penghu', nameKey: 'travel.scene.penghu', prompt: 'in Penghu, traditional coral stone wall houses, blue sky, island vibe', group: 'taiwan', category: 'scenery', region: 'islands', x: 20, y: 55, referenceImagePath: '/images/scenes/penghu.jpg' },

  // --- TAIWAN FOOD MAP (New) ---
  // North Food
  { id: 'food_boba', nameKey: 'travel.food.boba', prompt: 'drinking a classic Taiwan bubble milk tea, holding a plastic cup with large black pearls, urban street background', group: 'taiwan', category: 'food', region: 'north', x: 51, y: 19, referenceImagePath: '/images/scenes/food_boba.jpg', descriptionKey: 'travel.food.boba.desc' },
  { id: 'food_beef_noodle', nameKey: 'travel.food.beef_noodle', prompt: 'eating a bowl of Taiwan braised beef noodles, tender beef chunks, rich dark soup, holding chopsticks, steam rising', group: 'taiwan', category: 'food', region: 'north', x: 49, y: 24, referenceImagePath: '/images/scenes/food_beef_noodle.jpg', descriptionKey: 'travel.food.beef_noodle.desc' },
  { id: 'food_fried_chicken', nameKey: 'travel.food.fried_chicken', prompt: 'holding a huge Taiwan crispy fried chicken cutlet in a paper bag, taking a bite, street food market background', group: 'taiwan', category: 'food', region: 'north', x: 44, y: 36, referenceImagePath: '/images/scenes/food_fried_chicken.jpg', descriptionKey: 'travel.food.fried_chicken.desc' },
  { id: 'food_xiaolongbao', nameKey: 'travel.food.xiaolongbao', prompt: 'eating xiaolongbao (soup dumplings), holding one with chopsticks over a spoon, thin dough skin, steam rising, bamboo steamer in background', group: 'taiwan', category: 'food', region: 'north', x: 53, y: 21, referenceImagePath: '/images/scenes/food_xiaolongbao.jpg', descriptionKey: 'travel.food.xiaolongbao.desc' },
  { id: 'food_stinky_tofu', nameKey: 'travel.food.stinky_tofu', prompt: 'eating Taiwan crispy stinky tofu, topped with pickled cabbage, spicy paste, outdoor market setting', group: 'taiwan', category: 'food', region: 'north', x: 57, y: 22, referenceImagePath: '/images/scenes/food_stinky_tofu.jpg', descriptionKey: 'travel.food.stinky_tofu.desc' },
  { id: 'food_braised_pork', nameKey: 'travel.food.braised_pork', prompt: 'eating Lu Rou Fan (braised pork rice), small bowl of rice topped with fatty minced pork, savory soy sauce glaze', group: 'taiwan', category: 'food', region: 'north', x: 50, y: 20, referenceImagePath: '/images/scenes/food_braised_pork.jpg', descriptionKey: 'travel.food.braised_pork.desc' },
  { id: 'food_iron_egg', nameKey: 'travel.food.iron_egg', prompt: 'eating Tamsui iron eggs, small dark chewy eggs, waterfront background', group: 'taiwan', category: 'food', region: 'north', x: 44, y: 14, referenceImagePath: '/images/scenes/food_iron_egg.jpg', descriptionKey: 'travel.food.iron_egg.desc' },
  { id: 'food_scallion_pancake', nameKey: 'travel.food.scallion_pancake', prompt: 'holding a hot Taiwan scallion pancake with egg, crispy layers, street food stall background', group: 'taiwan', category: 'food', region: 'north', x: 54, y: 17, referenceImagePath: '/images/scenes/food_scallion_pancake.jpg', descriptionKey: 'travel.food.scallion_pancake.desc' },
  { id: 'food_pineapple_cake', nameKey: 'travel.food.pineapple_cake', prompt: 'tasting a Taiwan pineapple cake, buttery pastry, sweet pineapple jam filling', group: 'taiwan', category: 'food', region: 'north', x: 52, y: 20, referenceImagePath: '/images/scenes/food_pineapple_cake.jpg', descriptionKey: 'travel.food.pineapple_cake.desc' },
  { id: 'food_agei', nameKey: 'travel.food.agei', prompt: 'eating Tamsui A-gei, fried tofu stuffed with glass noodles, savory red sauce', group: 'taiwan', category: 'food', region: 'north', x: 46, y: 12, referenceImagePath: '/images/scenes/food_agei.jpg', descriptionKey: 'travel.food.agei.desc' },
  { id: 'food_pig_blood', nameKey: 'travel.food.pig_blood', prompt: 'eating Taiwan pig blood cake on a stick, covered in peanut powder and cilantro', group: 'taiwan', category: 'food', region: 'north', x: 48, y: 22, referenceImagePath: '/images/scenes/food_pig_blood.jpg', descriptionKey: 'travel.food.pig_blood.desc' },
  // Central Food
  { id: 'food_bawan', nameKey: 'travel.food.bawan', prompt: 'eating Changhua meatball (Ba-wan), translucent chewy dough with pork filling, sweet sauce', group: 'taiwan', category: 'food', region: 'central', x: 34, y: 46, referenceImagePath: '/images/scenes/food_bawan.jpg', descriptionKey: 'travel.food.bawan.desc' },
  { id: 'food_oyster_omelet', nameKey: 'travel.food.oyster_omelet', prompt: 'eating oyster omelet at a night market, sweet and spicy red sauce, green vegetables inside', group: 'taiwan', category: 'food', region: 'central', x: 35, y: 44, referenceImagePath: '/images/scenes/food_oyster_omelet.jpg', descriptionKey: 'travel.food.oyster_omelet.desc' },
  // South Food
  { id: 'food_shaved_ice', nameKey: 'travel.food.shaved_ice', prompt: 'eating Taiwan mango shaved ice, huge portion of ice topped with fresh mango chunks and condensed milk', group: 'taiwan', category: 'food', region: 'south', x: 41, y: 81, referenceImagePath: '/images/scenes/food_shaved_ice.jpg', descriptionKey: 'travel.food.shaved_ice.desc' },
  { id: 'food_beef_soup', nameKey: 'travel.food.beef_soup', prompt: 'eating Tainan fresh beef soup at a local street stall, dipping beef in ginger sauce, morning light', group: 'taiwan', category: 'food', region: 'south', x: 38, y: 69, referenceImagePath: '/images/scenes/food_beef_soup.jpg', descriptionKey: 'travel.food.beef_soup.desc' },
  { id: 'food_turkey_rice', nameKey: 'travel.food.turkey_rice', prompt: 'eating Chiayi turkey rice, shredded turkey over white rice with fried shallots, simple local diner', group: 'taiwan', category: 'food', region: 'south', x: 43, y: 55, referenceImagePath: '/images/scenes/food_turkey_rice.jpg', descriptionKey: 'travel.food.turkey_rice.desc' },
  { id: 'food_eel_noodle', nameKey: 'travel.food.eel_noodle', prompt: 'eating Tainan stir-fried eel noodles, crispy eel slices, sweet and sour sauce', group: 'taiwan', category: 'food', region: 'south', x: 38, y: 72, referenceImagePath: '/images/scenes/food_eel_noodle.jpg', descriptionKey: 'travel.food.eel_noodle.desc' },
  { id: 'food_zongzi', nameKey: 'travel.food.zongzi', prompt: 'eating a Taiwan Zongzi (sticky rice tamale), sticky rice with peanuts and pork wrapped in leaves', group: 'taiwan', category: 'food', region: 'south', x: 46, y: 58, referenceImagePath: '/images/scenes/food_zongzi.jpg', descriptionKey: 'travel.food.zongzi.desc' },
  { id: 'food_danzai_noodle', nameKey: 'travel.food.danzai_noodle', prompt: 'eating Tainan Danzai noodles, small bowl with minced meat and shrimp, traditional local setting', group: 'taiwan', category: 'food', region: 'south', x: 37, y: 70, referenceImagePath: '/images/scenes/food_danzai_noodle.jpg', descriptionKey: 'travel.food.danzai_noodle.desc' },
  { id: 'food_coffin_bread', nameKey: 'travel.food.coffin_bread', prompt: 'eating Tainan coffin bread (Gua Cai Ban), fried toast filled with creamy chowder', group: 'taiwan', category: 'food', region: 'south', x: 40, y: 71, referenceImagePath: '/images/scenes/food_coffin_bread.jpg', descriptionKey: 'travel.food.coffin_bread.desc' },
];

export const TRAVEL_SCENES: TravelScene[] = [...TRAVEL_SCENES_INTERNATIONAL, ...TRAVEL_SCENES_TAIWAN];

/** Scene id for "random location" option. At generate time, one of TRAVEL_SCENES is chosen randomly. */
export const TRAVEL_SCENE_ID_RANDOM = 'random';

/** Picks a random scene from TRAVEL_SCENES. Used when TRAVEL_SCENE_ID_RANDOM is selected. */
export function pickRandomTravelScene(): TravelScene {
  const i = Math.floor(Math.random() * TRAVEL_SCENES.length);
  return TRAVEL_SCENES[i];
}

/** Positive prompt template; {SCENE} is replaced by the selected scene prompt. */
export const TRAVEL_POSITIVE_TEMPLATE = `a travel photo of the same person, preserve identity, same face, same person,
realistic photo, photorealistic, high quality,
the person {SCENE},
natural lighting, natural colors, real world photography,
sharp focus, detailed, looks like a real photo`;

/** Negative prompt (fixed). */
export const TRAVEL_NEGATIVE = `different person, change face, change identity, face swap,
AI face, fake face, CGI, plastic skin,
anime, cartoon, illustration, painting,
low quality, blurry, deformed, distorted, extra fingers, bad anatomy`;

/** Output aspect ratio options. */
export type TravelAspectRatio = '1:1' | '16:9' | '9:16';

export const TRAVEL_ASPECT_RATIOS: { id: TravelAspectRatio; nameKey: string }[] = [
  { id: '1:1', nameKey: 'travel.aspect_1_1' },
  { id: '16:9', nameKey: 'travel.aspect_16_9' },
  { id: '9:16', nameKey: 'travel.aspect_9_16' },
];

export const DEFAULT_TRAVEL_ASPECT: TravelAspectRatio = '1:1';

/** Output image size. Flash: 1K only; Pro: 1K, 2K, 4K. */
export type TravelImageSize = '1K' | '2K' | '4K';

export const TRAVEL_IMAGE_SIZES: { id: TravelImageSize; nameKey: string; proOnly: boolean }[] = [
  { id: '1K', nameKey: 'travel.size_1k', proOnly: false },
  { id: '2K', nameKey: 'travel.size_2k', proOnly: true },
  { id: '4K', nameKey: 'travel.size_4k', proOnly: true },
];

export const DEFAULT_TRAVEL_IMAGE_SIZE: TravelImageSize = '1K';

/** Travel photo style presets */
export type TravelStyle = 'natural' | 'golden_hour' | 'film' | 'vibrant' | 'cinematic';

export const TRAVEL_STYLES: { id: TravelStyle; nameKey: string; prompt: string }[] = [
  { id: 'natural', nameKey: 'travel.style.natural', prompt: 'soft natural lighting, photorealistic, clear details' },
  { id: 'golden_hour', nameKey: 'travel.style.golden_hour', prompt: 'golden hour sunlight, warm tones, cinematic lighting, glowing skin' },
  { id: 'film', nameKey: 'travel.style.film', prompt: 'shot on 35mm film, kodak portra 400, grainy texture, vintage feel, soft colors' },
  { id: 'vibrant', nameKey: 'travel.style.vibrant', prompt: 'modern travel photography, instagram style, vibrant colors, high saturation, sharp focus' },
  { id: 'cinematic', nameKey: 'travel.style.cinematic', prompt: 'moody cinematic lighting, dramatic atmosphere, deep shadows, professional color grading' },
];

export const DEFAULT_TRAVEL_STYLE: TravelStyle = 'natural';

/** Weather conditions for AI prompt injection */
export type TravelWeather = 'sunny' | 'rainy' | 'snowy' | 'cloudy' | 'misty';

export const TRAVEL_WEATHER_OPTIONS: { id: TravelWeather; nameKey: string; prompt: string; icon: string }[] = [
  { id: 'sunny', nameKey: 'travel.weather.sunny', prompt: 'sunny day, clear blue sky, bright sunlight', icon: '☀️' },
  { id: 'rainy', nameKey: 'travel.weather.rainy', prompt: 'rainy day, wet streets, rain droplets, raindrops on skin', icon: '🌧️' },
  { id: 'snowy', nameKey: 'travel.weather.snowy', prompt: 'snowing, snow-covered ground, winter atmosphere, snowflakes', icon: '❄️' },
  { id: 'cloudy', nameKey: 'travel.weather.cloudy', prompt: 'overcast sky, soft diffused lighting, cloudy day', icon: '☁️' },
  { id: 'misty', nameKey: 'travel.weather.misty', prompt: 'misty morning, fog in background, mysterious atmosphere, soft haze', icon: '🌫️' },
];

/** Time of day for AI prompt injection */
export type TravelTimeOfDay = 'dawn' | 'noon' | 'sunset' | 'night';

export const TRAVEL_TIME_OPTIONS: { id: TravelTimeOfDay; nameKey: string; prompt: string; icon: string }[] = [
  { id: 'dawn', nameKey: 'travel.time.dawn', prompt: 'early morning, soft dawn light, pastel sky', icon: '🌅' },
  { id: 'noon', nameKey: 'travel.time.noon', prompt: 'midday, high sun, bright and vibrant colors', icon: '☀️' },
  { id: 'sunset', nameKey: 'travel.time.sunset', prompt: 'golden hour, orange and pink sky, long shadows', icon: '🌇' },
  { id: 'night', nameKey: 'travel.time.night', prompt: 'at night, city lights, starry sky, dark atmosphere', icon: '🌙' },
];

/** Vibe / Emotion filters for AI prompt injection */
export type TravelVibe = 'zen' | 'retro' | 'cyberpunk' | 'street' | 'elegant' | 'adventure' | 'cozy' | 'futuristic' | 'romantic';

export interface TravelVibeOption {
  id: TravelVibe;
  nameKey: string;
  prompt: string;
  icon: string;
}

export const TRAVEL_VIBE_OPTIONS: TravelVibeOption[] = [
  { id: 'zen', nameKey: 'travel.vibe.zen', prompt: 'peaceful, zen atmosphere, minimalist, calm', icon: '🧘' },
  { id: 'retro', nameKey: 'travel.vibe.retro', prompt: 'vintage aesthetic, 90s feel, nostalgic colors', icon: '📼' },
  { id: 'cyberpunk', nameKey: 'travel.vibe.cyberpunk', prompt: 'cyberpunk style, neon lights, high tech low life, rain-slicked streets', icon: '🌃' },
  { id: 'street', nameKey: 'travel.vibe.street', prompt: 'street style photography, candid moment, urban vibe', icon: '👟' },
  { id: 'elegant', nameKey: 'travel.vibe.elegant', prompt: 'elegant and sophisticated, high-end fashion magazine style', icon: '💎' },
  { id: 'adventure', nameKey: 'travel.vibe.adventure', prompt: 'adventurous spirit, hiking gear, exploring nature', icon: '🥾' },
  { id: 'cozy', nameKey: 'travel.vibe.cozy', prompt: 'warm and cozy, soft blankets, comfortable setting', icon: '☕' },
  { id: 'futuristic', nameKey: 'travel.vibe.futuristic', prompt: 'futuristic technology, sleek design, sci-fi atmosphere', icon: '🚀' },
  { id: 'romantic', nameKey: 'travel.vibe.romantic', prompt: 'romantic atmosphere, soft focus, warm heart-felt lighting', icon: '💖' },
];

/** Recommended vibes for specific location types */
export const LOCATION_RECOMMENDED_VIBES: Record<string, TravelVibe[]> = {
  // Cities
  'shibuya': ['cyberpunk', 'street', 'futuristic'],
  'nyc': ['street', 'cyberpunk', 'elegant'],
  'london': ['retro', 'street', 'elegant'],
  'taipei101': ['cyberpunk', 'futuristic', 'street'],
  'ximending': ['cyberpunk', 'street', 'retro'],
  'eiffel': ['romantic', 'elegant', 'retro'],
  'santorini': ['romantic', 'elegant', 'zen'],
  'rome': ['retro', 'elegant', 'street'],
  'venice': ['romantic', 'retro', 'elegant'],

  // Historical / Zen
  'kyoto': ['zen', 'retro', 'romantic'],
  'jiufen': ['retro', 'zen', 'romantic'],
  'cks_memorial': ['zen', 'elegant', 'retro'],
  'taj_mahal': ['elegant', 'zen', 'romantic'],
  'pyramids': ['adventure', 'retro', 'elegant'],

  // Nature / Adventure
  'iceland': ['adventure', 'zen', 'futuristic'],
  'swiss_alps': ['adventure', 'cozy', 'zen'],
  'mt_fuji': ['zen', 'adventure', 'romantic'],
  'grand_canyon': ['adventure', 'zen'],
  'taroko': ['adventure', 'zen'],
  'hehuanshan': ['adventure', 'zen', 'cozy'],

  // Food
  'food': ['cozy', 'street', 'elegant'],
};
