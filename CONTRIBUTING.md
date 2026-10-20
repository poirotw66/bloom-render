# Contributing

Thanks for your interest in BloomRender.

## Setup

```bash
npm ci
npm test
```

In **Settings**, choose **Image provider** (`Google Gemini` or `OpenRouter (BYOK)`) and paste the matching key. Keys stay in the browser tab (`sessionStorage`, cleared when the tab closes) and are never committed or bundled. Do not put API keys in `.env` files or CI secrets for this app.

Useful checks before opening a PR:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

Full gate (mirrors CI):

```bash
npm ci && npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

When you change UI copy, add the same key to both `locales/en.ts` and `locales/zh-TW.ts` (`locales/parity.test.ts` enforces this).

Also run the community gallery check when you touch `gallery/`:

```bash
npm run gallery:validate
```

## Community prompt gallery

The in-app **Prompt gallery** (`/prompt-gallery`) is seeded from JSON files in [`gallery/`](./gallery/). Each entry is one preset visitors can apply in a single click.

### Add an entry by PR

1. Copy an existing file in `gallery/` (not `schema.json`).
2. Rename it to a new kebab-case id, e.g. `misty-harbor.json`.
3. Fill the fields required by [`gallery/schema.json`](./gallery/schema.json):
   - `id` — must match the filename without `.json`
   - `title`, `prompt`, `feature` (`generate` | `retouch` | `adjust` | `filter`)
   - `settings` — optional `aspectRatio` / `quantity` for generate, or `tab` for editor surfaces
   - `thumbnail` — path under `public/`, usually an existing `examples/*.webp`
4. Optionally set `description`, `author`, and `tags`.
5. Run `npm run gallery:validate` locally (CI runs the same check).
6. Open a PR that only adds/updates gallery JSON unless the schema itself needs a change.

Thumbnails should reuse files already in `public/examples/` when possible so we do not bloat the repo. If you must add a new image, keep it small WebP (see `public/examples/README.md`).

### Personal saved prompts

Users can **Export** / **Import** their own prompt chips as JSON from the Prompt gallery page. That file is local browser data — it is separate from the community `gallery/*.json` presets submitted by PR.

## Scope

**Welcome**

- Photo studio UX and generation quality (edit, generate, ID photo, portrait, travel, themed, couple/group, try-on)
- Image provider work under `services/imageProviders/` (Gemini + OpenRouter)
- Docs, i18n, tests, and CI hygiene
- Accessibility and performance improvements that keep visuals intact

**Keep in mind**

- Travel custom-scene **prompt optimization** and home-screen **model compare** are Gemini-only
- Do not commit secrets, `.env`, or `.env.local`

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold it.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
