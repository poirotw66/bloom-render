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
