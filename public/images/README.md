# Static images

## Required for deployment (commit these)

- **`world-map.png`** – World map background used in the Travel feature (World Map view). Place it here: `public/images/world-map.png`. Keep the file small so the repo stays light.
- **`taiwan-map.png`** – Taiwan map background used in the Travel feature. Place it here so the path is `public/images/taiwan-map.png`. Keep the file small so the repo stays light.

## Scene reference images (not committed)

- **`scenes/`** – Travel scene reference photos are listed in `scenes/README.md`. They are not committed (see `.gitignore`). To have them on GitHub Pages, run `node scripts/download-scene-images.js` in CI before building, or add them locally for development.
