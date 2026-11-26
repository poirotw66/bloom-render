# Material sources and CSP checks

`npm run check:csp` validates the source catalogs and the effective CSP in
`index.html`. Both `npm run build` and `npm run build:analyze` run it before Vite,
then run `npm run check:csp:built` after route HTML generation. The second check
also verifies the copied assets and every generated app route HTML shell in
`dist/`, including the 404 fallback. Vendored demo HTML is outside the app route
set and is not modified or treated as an application shell.
Missing assets, route shells, invalid attribution and policy drift fail the build.

## Adding a reference asset

1. Put the asset under `public/` and add its path to the appropriate catalog.
   `constants/assetSources.mjs` declares the six catalog adapters: try-on
   materials, gallery entries, both travel scene catalogs, viral template cards,
   and feature/homepage examples. All currently use local paths. Absolute remote
   URLs are rejected because their runtime path resolvers expect local assets.
2. For try-on materials, supply a nonempty `license` and an HTTPS `source`
   attribution URL. Attribution links are metadata. Their hosts never become CSP
   permissions.
3. For a travel scene with a `referenceImagePath`, supply its 256px thumbnail,
   512px thumbnail and reference image. These paths use the same helpers as the
   browser. Omit `referenceImagePath` for a text-only scene. London and Havana
   currently use this fallback because their references have not been supplied.
4. Run `npm run check:csp`, then `npm run build`.

Paths cannot traverse out of `public/`, use credentials, encoded traversal,
protocol-relative URLs or escaping symlinks. TypeScript catalog asset expressions
must be statically supported by their inventory adapter; unsupported expressions
fail rather than silently escaping validation.

## Adding a provider or network origin

`constants/networkSources.mjs` contains the explicit trusted origins and their
`connect-src` / `img-src` permissions. It supplies CSP generation, API endpoint
constants and the service worker NetworkOnly pattern. Origins must be exact HTTPS
origins without credentials, paths, wildcards or queries. Registry changes require
an explicit code review; catalog contents cannot automatically extend the policy.

Use the shared endpoint constants for provider calls. If trusted origins change,
update the source `index.html` CSP to match `constants/csp.mjs`; the pre-build
check reports any mismatch. Per-route shells receive the same policy from the
route emitter. Existing Gemini, OpenAI, OpenRouter, Hugging Face and WASM CDN
connections remain allowed. The host used solely for hosted images has image
permission only.

This guard inventories declared static catalogs. It does not crawl arbitrary app
code, fetch third-party resources, prove remote availability, inspect user uploads,
or predict URLs returned dynamically by a provider. Such requests remain subject
to the browser CSP; an untrusted provider result URL does not gain permission.
Browser regression tests exercise permitted and blocked requests against the
production policy without paid API calls.
