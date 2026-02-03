# Scene Reference Images – Where to Get Them

This document describes how to obtain the reference images listed in [SCENE_IMAGES_STATUS.md](./SCENE_IMAGES_STATUS.md). Place downloaded files in `public/images/scenes/` with the **exact filenames** from the status table.

## Automated Download (International Scenery)

From the project root, run:

```bash
node scripts/download-scene-images.js
```

The script fetches images from **Wikimedia Commons** (free to use). If you see HTTP 429 (rate limit), wait a few hours and run again; existing files are skipped.

## Manual Search (Chrome / Any Browser)

For missing images or food/dessert scenes not in the script, search on these free stock photo sites and save with the correct filename:

| Site | URL | License |
|------|-----|--------|
| **Wikimedia Commons** | https://commons.wikimedia.org/ | Public domain / CC |
| **Pexels** | https://www.pexels.com/ | Free for commercial use |
| **Unsplash** | https://unsplash.com/ | Free (attribution appreciated) |

### Search keywords (English)

- **International scenery**: e.g. "Prague Charles Bridge", "Amsterdam canal", "Great Wall China", "Mount Fuji", "Golden Gate Bridge", "Sydney Opera House", "Pyramids Giza", etc.
- **Food**: e.g. "Italian pizza", "Japanese sushi", "French croissant", "Taiwan bubble tea", "beef noodle soup", etc.
- **Taiwan**: "伯朗大道", "珍珠奶茶", "牛肉麵", "小籠包", etc.

After downloading, rename the file to match the status table (e.g. `prague.jpg`, `food_boba.jpg`) and put it in `public/images/scenes/`.

## Status

See [SCENE_IMAGES_STATUS.md](./SCENE_IMAGES_STATUS.md) for the full list and which images are still missing.
