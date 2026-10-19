# Security Policy

## Reporting a vulnerability

Please report security issues **privately** via GitHub Security Advisories for this repository (Security → Advisories → New draft advisory), or contact the maintainer through their GitHub profile.

Do **not** open a public issue for unpatched vulnerabilities.

## API keys and secrets

This project is a **bring-your-own-key (BYOK)** browser app:

- Production / GitHub Pages builds **never** embed API keys in the client bundle.
- In Settings, users choose **Image provider** (`Google Gemini` or `OpenRouter (BYOK)`) and paste the matching key. Keys are stored in `sessionStorage` for the current browser tab only (cleared when the tab closes) and are never bundled. Non-secret prefs (provider, model, theme, …) stay in `localStorage`.
- There is **no** API-key environment-variable injection for production builds. See [`.env.example`](./.env.example).
- Travel **custom-scene prompt optimization** is Gemini-only (text endpoint). Image generation/editing for all studio features can use Gemini or OpenRouter via the ImageProvider layer.

**Never paste API keys or session data into issues, pull requests, or screenshots.**

If you believe a key was exposed in a commit, comment, or deployed artifact:

1. Rotate / revoke the key at the provider immediately.
2. Notify the maintainers privately if the exposure is still reachable in git history or a public deployment.

## Scope notes

- Client-side XSS in a BYOK app can expose the user’s own key in that browser — report XSS as a security issue.
