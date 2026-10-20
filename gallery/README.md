# Community prompt gallery

JSON presets shown on the in-app **Prompt gallery** page (`/prompt-gallery`).

Each file (except `schema.json` and this README) is one entry. CI runs
`npm run gallery:validate` to check every entry against [`schema.json`](./schema.json)
and to confirm the `thumbnail` exists under `public/`.

See [CONTRIBUTING.md](../CONTRIBUTING.md#community-prompt-gallery) for how to
add an entry by pull request.
