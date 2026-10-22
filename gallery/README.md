# Community prompt gallery

JSON presets shown on the in-app **Prompt gallery** page (`/prompt-gallery`).

Each file (except `schema.json` and this README) is one entry. CI runs
`npm run gallery:validate` to check every entry against [`schema.json`](./schema.json)
and to confirm any `thumbnail` exists under `public/`.

`thumbnail` is optional. Only set it when the image matches the title; otherwise
omit it and the app renders a feature-colored gradient card.

Every entry needs both `title` (English) and `titleZh` (Traditional Chinese).
Optional `descriptionZh` / `tagsZh` are shown in the zh-TW UI.

You can also propose entries with the **Prompt gallery submission** GitHub issue
form (validated by `.github/workflows/validate-gallery-issue.yml`).

See [CONTRIBUTING.md](../CONTRIBUTING.md#community-prompt-gallery) for how to
add an entry by pull request.
