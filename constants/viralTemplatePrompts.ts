/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * English model prompts for viral templates. Loaded on apply / generate only —
 * not part of the homepage card catalog chunk.
 */

export const VIRAL_TEMPLATE_PROMPTS: Record<string, string> = {
  'figurine-box':
    'Transform the person into a collectible 1/7 scale PVC figure in a window retail box. Clear plastic blister, cardboard backing with brand logo and character name, studio product lighting, sharp focus, photoreal toy photography.',
  'polaroid-frame':
    'Restyle as an instant Polaroid photo: thick white border, soft flash lighting, slight vintage color cast, handwritten date in the bottom margin, intimate snapshot feel, film grain.',
  'era-70s-taiwan':
    'Time-travel the portrait to 1970s Taiwan: Kodachrome warmth, soft flash, period clothing and hair, modest apartment or street backdrop of that era, nostalgic documentary photo, subtle film grain.',
  'era-80s-taiwan':
    'Time-travel the portrait to 1980s Taiwan: neon night markets, big hair, pastel windbreaker vibes, flash-lit night snapshot, VHS softness, nostalgic Taipei evening atmosphere.',
  'era-90s-taiwan':
    'Time-travel the portrait to 1990s Taiwan: disposable-camera look, school uniform or casual 90s streetwear, karaoke or night market glow, slightly overexposed flash, millennial nostalgia.',
  'taiwan-night-market':
    'Place the person naturally at a bustling Taiwan night market: red lanterns, steam from food stalls, neon signage, crowded aisle, warm tungsten and neon mix, candid travel photo, photorealistic.',
  'taiwan-jiufen':
    'Place the person on the misty lantern-lit steps of Jiufen Old Street, Taiwan: tea-house rooftops, orange lanterns in fog, cool dusk light, cinematic travel portrait, photorealistic.',
  'taiwan-101':
    'Place the person at a Taipei viewpoint with Taipei 101 glowing in the skyline behind them at blue hour, clean city lights bokeh, stylish travel portrait, photorealistic.',
  'chibi-3d':
    'Transform the person into a cute 3D chibi vinyl figure with an oversized head and short body, standing on a simple round base. Soft pastel studio backdrop, clean product lighting, smooth toy plastic material, charming collectible look, photoreal toy photography.',
  'line-stickers':
    'Turn the person into a 3x3 messenger sticker sheet: nine cartoon expressions of the same character (happy, sad, angry, surprised, love, sleepy, cheering, wink, shy), thick white outline, flat pastel colors, clean white background, no readable text or logos, sticker-pack product layout.',
  'acrylic-standee':
    'Transform the person into an anime-styled die-cut acrylic standee on a clear plastic base, standing on a desk. Glossy transparent acrylic edges, colorful character art of the subject, soft room lighting, shallow depth of field, product photography.',
  'pixel-art':
    'Restyle the person as a 16-bit pixel-art game character sprite sheet: clear walk-cycle frames side by side, limited retro color palette, chunky pixels, placed in a simple side-scrolling retro game scene background, nostalgic console-era look, no readable UI text.',
  claymation:
    'Restyle the portrait as plasticine stop-motion claymation: visible fingerprint texture in the clay, soft handmade facial features, miniature set with crafts-table lighting, whimsical stop-motion film still, tactile material detail.',
  'ukiyo-e':
    'Restyle the portrait as a Japanese ukiyo-e woodblock print: bold outlines, flat color fields, the Great Wave and Mount Fuji in the background, washi paper texture, Edo-period print aesthetic, refined traditional composition.',
  'hk-90s-film':
    'Restyle as a 1990s Hong Kong film still: rainy neon street at night, saturated green and red neon reflections on wet asphalt, heavy film grain, dramatic cinematic lighting, period fashion, moody crime-drama atmosphere, photoreal movie frame.',
  'magazine-cover':
    "Transform into a glossy fashion magazine cover: confident editorial pose, studio beauty lighting, sharp retouch. Use a clearly fictional masthead name and invented cover lines only — do not use real magazine brands, real celebrities' names, barcodes, QR codes, or trademarks. Clean magazine layout, 3:4 cover crop.",
  purikura:
    'Restyle as a Japanese purikura photo-booth strip: cute close-up faces, sparkles and heart stickers, pink decorative frame, soft beauty filter, playful kawaii decorations, multi-frame booth layout feel, bright pastel colors.',
  'brick-minifig':
    'Transform the person into a plastic building-brick minifigure toy: cylindrical head, C-shaped hands, blocky torso printed with a simplified face and outfit inspired by the subject, standing on a studded baseplate, bright studio product shot, clean toy plastic materials. Do not use any trademarked brand names or logos.',
  'pro-headshot':
    'Create a polished corporate headshot of the person: navy business suit, neat grooming, soft professional studio lighting, gently blurred modern office background, confident friendly expression, LinkedIn-ready portrait, photorealistic.',
  'anime-handpainted':
    'Restyle the person as a hand-painted anime-film illustration in a countryside scene: soft watercolor backgrounds, gentle cel-shaded character rendering, warm afternoon light, pastoral hills and sky, painterly traditional animation look. Do not reference any real animation studio or film title.',
  'pet-human':
    'Anthropomorphize the pet in the photo into a realistic human portrait whose hair/fur color, eye color, and expression match the pet. Show a clear side-by-side composition: original pet on one side and the matching human portrait on the other, soft natural lighting, photorealistic.',
  'comic-pop-art':
    'Restyle as American comic pop art: bold black outlines, Ben-Day/halftone dots, saturated primary colors, dynamic comic-book portrait, empty speech bubble with no readable text or letters, graphic novel cover energy.',
  'tarot-card':
    'Transform into an ornate tarot card titled The Star: the person as the central figure, gold filigree border, mystical celestial symbols, rich jewel tones, aged card stock texture, vertical tarot layout, no modern logos.',
  'vintage-travel-poster':
    'Restyle as a 1950s vintage travel poster: gouache flat colors, simplified shapes, the person as the stylish traveler in the foreground, scenic landmark backdrop, classic mid-century poster typography that remains decorative and unreadable as real brand text, slightly aged paper.',
  'trading-card':
    'Transform into a fantasy holographic trading card of the person as a character: ornate frame, shimmering holo foil effect, fictional ATK and DEF numbers, elemental energy accents, collectible card layout. Do not use any real game titles, brand names, or logos.',
  'yukata-festival':
    'Dress the person in a colorful Japanese yukata at a summer festival at dusk: paper lanterns, festival stalls soft-focused behind, warm evening light, hair ornament, photorealistic travel portrait.',
  'wuxia-costume':
    'Restyle as a wuxia film still: the person as a swordsman or swordswoman in flowing historical Chinese robes, bamboo forest mist, cool cinematic lighting, dramatic pose with a jian sword, photorealistic costume drama look. Do not use real TV show or film titles.',
  'y2k-digicam':
    'Restyle as an early-2000s compact digital camera snapshot: harsh on-camera flash, slight red-eye risk, low dynamic range, cool indoor night vibe, orange LCD date stamp in a corner (fictional date), candid Y2K party aesthetic, photorealistic.',
  astronaut:
    'Transform into an astronaut portrait inside a spacecraft: reflective helmet visor optional or open, Earth visible through the window behind them, soft cabin lighting. Use a plain white spacesuit with no agency logos, national flags, mission patches, or brand markings.',
  'iso-diorama':
    'Place the person inside a tiny isometric 3D room diorama: cutaway dollhouse view, desk and cozy furniture, soft miniature lighting, cute scale model materials, clean isometric camera angle, photoreal miniature photography.',
  'yearbook-90s':
    'Restyle as a 1990s school yearbook portrait: classic mottled blue studio backdrop, soft butterfly lighting, period hair and clothing, printed yearbook crop with a simple caption reading CLASS OF 1996 under the photo, nostalgic yearbook print texture.',
  'stained-glass':
    'Restyle the portrait as a gothic stained-glass window: leaded black outlines, jewel-toned translucent glass panes, cathedral window frame, luminous backlight as if sun through glass, sacred art composition.',
  'watercolor-illustration':
    'Restyle as a delicate watercolor illustration portrait: soft wet-on-wet washes, visible paper tooth, gentle color blooms at edges, airy negative space. Preserve the subject’s exact facial features, likeness, age, and identity — only the medium changes.',
  'cyberpunk-neon':
    'Restyle as a cyberpunk neon night portrait: rainy reflective streets, magenta and cyan neon rim light, holographic haze, futuristic city bokeh. Keep the subject’s face, bone structure, and identity clearly recognizable — no face swap.',
  'classical-oil-painting':
    'Restyle as a classical oil painting portrait: rich Rembrandt-like lighting, visible brushstrokes, dark muted background, museum canvas texture. Faithfully preserve the person’s facial features, expression, and identity as the painted sitter.',
  'felt-plush':
    'Transform into a handmade needle-felt wool plush doll of the person: soft fuzzy fiber texture, stitched details, seated on a simple studio surface. The doll must clearly resemble the subject’s face, hairstyle, and identity in felt form.',
  'paper-cut':
    'Restyle as layered paper-cut art: stacked colored paper silhouettes with soft drop shadows between layers, craft-studio lighting, intricate portrait cutouts. Keep the subject’s facial likeness and identity readable in the layered silhouette design.',
  embroidery:
    'Restyle as a thread embroidery portrait on linen: visible satin and split stitches, subtle fabric weave, hoop-frame composition. Stitch the subject’s real facial features and identity accurately in thread — recognizable embroidered likeness.',
  'pencil-sketch':
    'Restyle as a refined graphite pencil sketch on textured drawing paper: cross-hatching, soft graphite gradients, unfinished edges. Accurately preserve the person’s facial structure, likeness, and identity in the sketch.',
  vaporwave:
    'Restyle with vaporwave aesthetics: pastel pink and cyan gradients, soft VHS glow, classical statue or grid accents in the background, dreamy 90s retro-futurism. Keep the subject’s face and identity clearly the same person — no celebrity likeness.',
  'film-noir':
    'Restyle as a black-and-white film noir still: hard Venetian-blind shadows, high-contrast lighting, smoky room, 1940s detective-movie atmosphere. Preserve the subject’s exact facial features and identity in monochrome.',
  'snow-globe':
    'Place a miniature of the person inside a clear glass snow globe: swirling fake snow, cozy winter diorama base, soft product lighting, reflections on the glass. The miniature must retain the subject’s facial likeness and identity.',
  'cny-portrait':
    'Create a warm Lunar New Year family-style portrait photo: festive red and gold decorations, soft indoor lighting, celebratory atmosphere. Keep every recognizable face and identity from the upload accurate — do not invent or replace people; dress and set only.',
  'wedding-photo':
    'Restyle as a romantic seaside wedding portrait: elegant wedding attire, soft golden-hour beach light, gentle sea breeze, cinematic couple or solo bridal composition matching the upload. Preserve the subject’s real face, likeness, and identity — costume and setting only, no celebrity faces.',
  'book-nook':
    'Place a miniature of the person inside a cozy book-nook diorama between book spines: tiny bookshelf alcove, warm fairy lights, stacked books as walls, soft miniature product lighting. The miniature must clearly retain the subject’s facial likeness and identity.',
  'anime-sky-poster':
    'Restyle as an anime evening sky poster: vast twilight gradient sky, glowing clouds, dramatic silhouette-friendly composition with the person in the foreground. Keep the subject’s exact facial features, likeness, and identity clearly recognizable — no celebrity face.',
  'fantasy-rpg-hero':
    'Restyle as a fantasy RPG hero character portrait: ornate but generic armor or mage robes, soft magical rim light, misty ruins backdrop. Do not use any real game titles or brand logos. Preserve the person’s real face, bone structure, and identity under the costume.',
  'korean-studio-portrait':
    'Restyle as a polished Korean-style studio ID/portrait photo: clean softbox lighting, subtle beauty retouch that still looks natural, plain light backdrop, neat wardrobe. Faithfully preserve the subject’s facial features, likeness, and identity.',
  'chalk-caricature':
    'Restyle as a cute chalkboard chalk caricature: black slate background, colorful chalk pastel lines, chibi proportions with a big head, dusty chalk texture. The drawing must still clearly resemble the subject’s face and identity.',
  'mermaid-underwater':
    'Restyle as an underwater mermaid portrait: shimmering mermaid tail costume, soft caustic light rays through blue-green water, floating hair, bubbles. Preserve the subject’s real facial features, likeness, and identity — costume and underwater set only.',
  'autumn-cafe':
    'Place the person in a cozy autumn café scene wearing a soft bear-ear beanie: warm window light, latte on the table, orange leaves outside. Keep the subject’s face, expression, and identity accurate — wardrobe and café setting only.',
  'temple-festival':
    'Place the person at a lively Taiwanese temple festival in traditional festival attire: incense smoke, temple lanterns, festive crowd soft in the background, warm evening light. Preserve the subject’s exact facial features and identity; do not invent other recognizable people.',
  'flat-vector-avatar':
    'Restyle as a flat vector avatar profile picture: clean geometric shapes, bold simple colors, circular crop friendly composition, no gradients overload. The avatar must remain a clear likeness of the subject’s face and identity.',
  'double-exposure':
    'Create an artistic double-exposure portrait: the person’s silhouette blended with a nature or cityscape texture inside the profile, soft filmic tones. Keep the subject’s facial structure and identity readable through the double exposure.',
  'city-pop-cover':
    'Restyle as a late-70s/80s city-pop album cover aesthetic: soft airbrushed portrait, pastel sunset or coastal city backdrop, glossy vinyl-era graphic layout with decorative unreadable text only. Preserve the subject’s real face and identity; no real artist names or real album titles.',
  'crochet-amigurumi':
    'Transform into a handmade crochet amigurumi doll of the person: visible yarn stitches, soft stuffed proportions, seated on a simple craft-table surface. The doll must clearly resemble the subject’s face, hairstyle, and identity in yarn form. Do not use any trademarked toy brand names.',
  'couple-portrait':
    'Create a romantic couple portrait from the attached reference people: soft natural light, complementary wardrobe, intimate but tasteful posing. Preserve each person’s real facial features, likeness, and identity separately — do not blend or mix faces. No celebrity lookalikes.',
  'family-portrait':
    'Create a warm multi-generational family portrait from the attached reference people: cozy indoor or garden setting, soft even lighting, natural smiles. Keep every person’s facial features, age cues, and identity accurate and distinct — never blend faces between people.',
  'friends-group':
    'Create a lively friends group photo from the attached reference people: casual outdoor or café setting, candid joyful energy, balanced group composition. Preserve each friend’s facial features and identity clearly — do not morph or mix faces. No real celebrity names.',
  'low-poly-portrait':
    'Restyle as a low-poly geometric portrait: faceted triangular planes, clean hard edges, soft studio fill light. Preserve the subject’s exact facial features, likeness, and identity — do not beautify into a different person.',
  'risograph-poster':
    'Restyle as a risograph print poster portrait: limited ink colors, visible grain and misregistration, bold graphic shapes. Keep the person’s real face, bone structure, and identity clearly recognizable.',
  'popup-book':
    'Place a paper pop-up book scene of the person: layered cardboard cutouts, folded tabs, storybook lighting. The paper figure must retain the subject’s facial likeness and identity.',
  'christmas-cozy':
    'Place the person in a cozy Christmas living-room portrait: warm fairy lights, soft knit textures, gentle fireplace glow. Preserve the subject’s real facial features and identity — wardrobe and set only. No trademarked characters.',
  'halloween-costume':
    'Restyle with a playful Halloween costume portrait: tasteful spooky makeup or mask accents, moody autumn night lighting. Keep the person’s face and identity recognizable under the costume. No trademarked mascots.',
  'mid-autumn-moon':
    'Place the person in a Mid-Autumn Festival moon-viewing scene: lantern glow, full moon, soft night sky. Preserve the subject’s facial features and identity accurately.',
  'valentine-roses':
    'Create a romantic Valentine portrait with roses and soft pink light. Keep the subject’s real face, likeness, and identity — florals and wardrobe only.',
  'chef-portrait':
    'Restyle as a professional chef portrait: white chef coat, kitchen backdrop, appetizing warm light. Preserve the person’s exact facial features and identity under the chef attire.',
  'pilot-captain':
    'Restyle as an airline captain portrait: pilot uniform and cap, soft cockpit or terminal backdrop. Preserve the subject’s real face and identity. No real airline logos or trademarks.',
  'scientist-lab':
    'Restyle as a scientist in a clean lab: white lab coat, subtle glassware backdrop, cool bright lighting. Keep the person’s facial features, likeness, and identity accurate.',
  'pet-royal':
    'Transform the uploaded pet photo into a royal oil-painting portrait: ornate frame lighting, noble pose, classical brushwork. Preserve the pet’s exact breed traits, markings, face, and identity — do not turn it into a different animal.',
  'pet-superhero':
    'Transform the uploaded pet into a playful superhero costume portrait: cape or mask accents, dynamic comic lighting. Preserve the pet’s real face, markings, and identity. No trademarked superhero names or logos.',
  'graduation-group':
    'Create a graduation group photo from the attached reference people: caps and gowns, campus backdrop, celebratory daylight. Preserve each person’s facial features and identity distinctly — do not blend faces.',
  'camping-friends':
    'Create a camping friends group photo from the attached references: tent and campfire glow, outdoor evening light. Keep every face and identity distinct — no face mixing.',
  'birthday-party':
    'Create a birthday party group photo from the attached references: cake and balloons, warm indoor celebration light. Preserve each person’s likeness and identity separately.',
  'cafe-meetup':
    'Create a café meetup group photo from the attached references: latte cups, window light, casual seating. Keep each face clearly distinct and true to the uploads.',
  'airport-travel':
    'Create a travel airport group photo from the attached references: luggage and terminal atmosphere, bright overhead light. Preserve every person’s facial identity — no blending.',
  'sports-team':
    'Create a sports team group photo from the attached references: matching athletic jerseys (generic, no real team logos), outdoor field light. Keep each face and identity distinct.',
  'wedding-guests':
    'Create a wedding guests group photo from the attached references: formal attire, soft venue lighting, celebratory mood. Preserve each guest’s facial features and identity — do not mix faces.',
  'christmas-party':
    'Create a Christmas party group photo from the attached references: festive decorations, warm indoor lights. Keep every person’s face and identity clearly separate and accurate.',
};

export function getViralPrompt(id: string): string {
  const prompt = VIRAL_TEMPLATE_PROMPTS[id];
  if (!prompt) {
    throw new Error(`Missing viral prompt for ${id}`);
  }
  return prompt;
}
