# BloomRender

[English](./README.md) | [繁體中文](./README.zh-TW.md)

[![CI](https://github.com/poirotw66/bloom-render/actions/workflows/ci.yml/badge.svg)](https://github.com/poirotw66/bloom-render/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Live demo](https://img.shields.io/badge/demo-bloss0m.com-e23d2f)](https://www.bloss0m.com/bloom-render/)

**BloomRender — Let your ideas bloom.**

AI-powered photo editing and generation studio with bring-your-own-key **Google Gemini** or **OpenRouter**: retouch, filters, ID photos, portraits, travel shots, themed shoots, couple/group photos, and virtual try-on.

**Try demo, no key needed:** Open [the live site](https://www.bloss0m.com/bloom-render/) and tap **Try demo** (or choose **Live demo (no key)** in Settings). Generate on each feature with bundled sample photos — no API key and no call to an AI provider. Results are marked **Demo**. Add a Gemini or OpenRouter key in Settings when you want to generate with your own photos.

### Preview

| Text to image                                         | AI ID photo                                   | Image editor                                |
| ----------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| ![Text to image result](images/generate_2_image.webp) | ![ID photo result](images/idphoto_5_idp.webp) | ![Editor retouch](images/edit_2_image.webp) |

| AI travel photo                                         | AI virtual try-on                              |
| ------------------------------------------------------- | ---------------------------------------------- |
| ![Travel photo result](images/travel_5_couple_img.webp) | ![Try-on result](images/tryon_4_girl_img.webp) |

---

## Features

Start-screen tabs, in order: **Upload** → **Text to image** → **Photography service** → **ID photo** → **Portrait** → **Travel** → **Themed** → **Couple / group** → **Try-on**.

- **Upload** — Drop or pick a file and open the editor.
- **Text to image** — Describe a scene, pick aspect ratio (1:1, 4:3, 3:4, 16:9, 9:16) and count (1–4); download singles or a ZIP, or send one result to the editor.
- **Image editor** — Point-and-prompt retouch, style filters, global adjustments, free/ID-spec crop; undo, redo, compare, reset, download.
- **AI ID photo** — Document type, retouch level, output size, clothing (text or reference); single and batch ZIP download.
- **AI portrait** — Professional headshots from a portrait upload.
- **AI travel photo** — World / Taiwan map scene picks with weather, time, outfit, and framing; solo, couple, or group.
- **AI themed shoot** — Theme, size, and aspect ratio from a portrait.
- **AI couple / group** — 2 portraits (couple) or 3–6 (group) into one composite.
- **AI virtual try-on** — One person photo + 1–5 garment photos; multi-style results with single or bulk download.
- **Settings** — Image provider (Gemini / OpenRouter), matching API key + model, language, theme (browser-only).
- **i18n** — English and Traditional Chinese.
- **Themes** — Bloom, Night, New Year.
- **History** — Browse, filter, and batch-download past generations.

---

## Quick start

Requirements: **Node.js 20+**, npm (use `npm ci` when installing from the lockfile).

1. **Install**

   ```bash
   npm ci
   ```

2. **API key (BYOK) or Try demo** — Open **Settings**, choose **Image provider** (`Google Gemini`, `OpenRouter (BYOK)`, or `Live demo (no key)`). For real generation, paste the matching key. Keys stay in the browser tab (`sessionStorage`) only and are cleared when the tab closes. They are never committed, never read from env files, and never baked into the production bundle. Or tap **Try demo** to explore with bundled samples without a key. See [`.env.example`](./.env.example).

3. **Run**

   ```bash
   npm run dev
   ```

   Open the URL shown in the terminal (default [http://localhost:3002](http://localhost:3002)).

4. **Optional static assets**
   - Maps for Travel: `public/images/world-map.webp`, `public/images/taiwan-map.webp` (see `public/images/README.md`). Convert PNG → WebP with `node scripts/convert-public-images-to-webp.mjs` if needed.
   - Scene reference images under `public/images/scenes/` are optional; follow [docs/SCENE_IMAGES_SOURCES.md](docs/SCENE_IMAGES_SOURCES.md). Text-only generation still works without them.

---

## API keys

| Context              | How                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Settings (BYOK)**  | Gear → **Image provider**: `Google Gemini` or `OpenRouter (BYOK)`. Paste the matching key and pick a model. Keys live in `sessionStorage` for this tab only (cleared when the tab closes). Never bundled. |
| **Get a key**        | Gemini: [Google AI Studio](https://aistudio.google.com/app/apikey). OpenRouter: [openrouter.ai/keys](https://openrouter.ai/keys).                                                                         |
| **Env / CI / Pages** | No API key env var is used. Do not set `GEMINI_API_KEY` / `OPENROUTER_*` for builds — nothing injects keys into the client.                                                                               |

### What each provider covers

| Surface                                                                                                     | Provider                                                         |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Text-to-image, editor (retouch / filter / adjust), ID photo, portrait, travel, themed, couple/group, try-on | Selected provider (`services/imageProviders/`)                   |
| Travel **custom-scene prompt optimization** (text)                                                          | **Gemini-only** — skipped on OpenRouter; your raw prompt is used |
| Home-screen **model compare**                                                                               | **Gemini-only** (compares Gemini model ids)                      |

Prefer image-capable OpenRouter models (e.g. `google/gemini-2.5-flash-image`). Models without image-reference support may fail on edit / try-on / multi-photo flows.

Do not commit `.env` / `.env.local` or paste keys into issues. Set quotas and billing limits on the provider side.

---

## Tech stack

- **Runtime** — React 19, TypeScript, Vite 6
- **Routing** — React Router 7
- **Editing** — react-image-crop
- **AI** — [@google/genai](https://www.npmjs.com/package/@google/genai) (Gemini) + OpenRouter Images API via `services/imageProviders/`
- **On-device enhance** — [@huggingface/transformers](https://www.npmjs.com/package/@huggingface/transformers) (WebGPU + WASM) for background removal and 2× upscaling — no API key
- **Batch download** — JSZip
- **Styles** — Tailwind CSS 4 via `@tailwindcss/vite` (build-time; not CDN) + custom CSS
- **Tooling** — ESLint, Prettier, Vitest, Husky, lint-staged

### Client-side models (Enhance)

Lazy-loaded on first use, cached by the browser. Approximate first-download sizes:

| Task               | Model                                                                                         | ~Size | License    |
| ------------------ | --------------------------------------------------------------------------------------------- | ----- | ---------- |
| Background removal | [Xenova/modnet](https://huggingface.co/Xenova/modnet) (MODNet / RMBG-class matting)           | 25 MB | Apache-2.0 |
| 2× upscaling       | [Xenova/swin2SR-classical-sr-x2-64](https://huggingface.co/Xenova/swin2SR-classical-sr-x2-64) | 45 MB | Apache-2.0 |

Runtime: ONNX via transformers.js (prefers WebGPU, falls back to WASM). See `/enhance` in the app and `services/localEnhance/`.

---

## Architecture

Image generation goes through `services/imageProviders/`: a shared `ImageProvider` interface (`generateImage`, `validateApiKey`) with Gemini, OpenRouter, and offline demo implementations selected via `getImageProvider()`. Feature modules call `runImageGeneration`, which resolves the active provider from Settings and returns a data URL. BYOK API keys are stored only in `sessionStorage` (tab-scoped; cleared when the tab closes) via `utils/credentialStorage.ts` — never in `localStorage` for ongoing use, env files, or the production bundle.

Local enhance (background removal / 2× upscale) is separate: `@huggingface/transformers` pipelines in `services/localEnhance/`, lazy-loaded and browser-cached, exposed on the Enhance page and as actions on generation result pages.

---

## Scripts

| Command                           | Description                                                |
| --------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                     | Dev server (port 3002)                                     |
| `npm run build`                   | Production build to `dist/` (+ `404.html` for SPA hosting) |
| `npm run preview`                 | Preview the production build                               |
| `npm run typecheck`               | `tsc --noEmit`                                             |
| `npm run lint`                    | ESLint                                                     |
| `npm test`                        | Vitest                                                     |
| `npm run format` / `format:check` | Prettier write / check                                     |

---

## Deploy

- Ship the `dist/` folder to any static host.
- **GitHub Pages**: set `GITHUB_PAGES=true` so `base` is `/bloom-render/`. See [.github/workflows/deploy.yml](.github/workflows/deploy.yml) (runs on `main` only, after the CI quality gate).

---

## Docs

See [docs/README.md](docs/README.md) for the full index. Highlights:

- **[User manual](docs/BLOOMRENDER_MANUAL.md)** (Traditional Chinese) — walkthroughs for generate, ID photo, portrait, travel, try-on, and the editor
- **[Scene image sources](docs/SCENE_IMAGES_SOURCES.md)** / **[status](docs/SCENE_IMAGES_STATUS.md)** — optional travel reference images
- **[Type layout](docs/TYPES.md)** — where shared vs feature-local TypeScript types live

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). Security reports: [SECURITY.md](./SECURITY.md).

---

## License

[MIT](./LICENSE) © 2026 poirotw66
