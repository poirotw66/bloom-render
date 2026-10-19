# Contributing

Thanks for your interest in BloomRender.

## Setup

```bash
npm ci
npm test
```

Paste a Google Gemini API key in the in-app **Settings** panel. Keys stay in the browser (`localStorage`) and are never committed or bundled. Do not put API keys in `.env` files or CI secrets for this app.

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

## Scope

**Welcome**

- Photo studio UX and generation quality (edit, generate, ID photo, portrait, travel, themed, couple/group, try-on)
- Docs, i18n, tests, and CI hygiene
- Accessibility and performance improvements that keep visuals intact

**Not in scope for drive-by PRs right now**

- License changes (already MIT)
- New image providers (e.g. OpenRouter) — planned for a later wave behind a provider abstraction
- Community templates / code of conduct — later wave

Please keep PRs focused. Do not commit secrets, `.env`, or `.env.local`.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
