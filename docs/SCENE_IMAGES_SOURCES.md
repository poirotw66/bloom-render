# Scene Reference Images – Where to Get Them

This document describes how to obtain travel scene reference images listed in [SCENE_IMAGES_STATUS.md](./SCENE_IMAGES_STATUS.md).

The repo ships **optimized** assets only (not full-resolution originals):

| Path                                        | Purpose                                          |
| ------------------------------------------- | ------------------------------------------------ |
| `public/images/scenes/thumbs/256/<id>.webp` | UI grids (~128px display)                        |
| `public/images/scenes/thumbs/512/<id>.webp` | Map hover / larger previews                      |
| `public/images/scenes/ref/<id>.webp`        | Model reference (long edge ≤1536px, quality ~82) |

Catalog entries still use paths like `/images/scenes/eiffel.webp`; the app maps those to `thumbs/` and `ref/` at runtime.

## Automated Download + Prepare

From the project root:

```bash
# Optional: fetch full-resolution sources into public/images/scenes/
node scripts/download-scene-images.js

# Build thumbs + capped refs and remove oversized originals from the scenes root
node scripts/prepare-scene-images.mjs
```

`prepare-scene-images.mjs` requires `cwebp` / `webpinfo` (`apt install webp`). Pass `--keep-originals` if you want to keep full-res files locally (do not commit them).

## Manual Search (Chrome / Any Browser)

For missing images or food/dessert scenes not in the download script, search on these free stock photo sites and save with the correct basename (e.g. `prague.webp`):

| Site                  | URL                            | License                        |
| --------------------- | ------------------------------ | ------------------------------ |
| **Wikimedia Commons** | https://commons.wikimedia.org/ | Public domain / CC             |
| **Pexels**            | https://www.pexels.com/        | Free for commercial use        |
| **Unsplash**          | https://unsplash.com/          | Free (attribution appreciated) |

### Search keywords (English)

- **International scenery**: e.g. "Prague Charles Bridge", "Amsterdam canal", "Great Wall China", "Mount Fuji", "Golden Gate Bridge", "Sydney Opera House", "Pyramids Giza", etc.
- **Food**: e.g. "Italian pizza", "Japanese sushi", "French croissant", "Taiwan bubble tea", "beef noodle soup", etc.
- **Taiwan**: "伯朗大道", "珍珠奶茶", "牛肉麵", "小籠包", etc.

After downloading a full-resolution file into `public/images/scenes/`, run `node scripts/prepare-scene-images.mjs` so thumbs and refs are regenerated.

## Optional full-resolution originals

Full-size downloads are **not** stored in git (they previously ballooned `public/` past 130 MB). Keep them on disk only if you need to re-run `prepare-scene-images.mjs` with different sizes/qualities. The app never loads originals at runtime.

## Status

See [SCENE_IMAGES_STATUS.md](./SCENE_IMAGES_STATUS.md) for the full list and which images are still missing.
