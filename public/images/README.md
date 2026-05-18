# Static images

## Required for deployment (commit these)

- **`world-map.webp`** – World map background used in the Travel feature (World Map view). Place it here: `public/images/world-map.webp`. Keep the file small so the repo stays light.
- **`taiwan-map.webp`** – Taiwan map background used in the Travel feature. Place it here: `public/images/taiwan-map.webp`. Keep the file small so the repo stays light.

## Scene reference images (not committed)

- **`scenes/`** – Travel scene reference photos are listed in `scenes/README.md`. They are not committed (see `.gitignore`). To have them on GitHub Pages, run `node scripts/download-scene-images.js` in CI before building, or add them locally for development.
