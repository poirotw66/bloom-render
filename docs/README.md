# Documentation

User- and contributor-facing docs for BloomRender. Internal planning notes were removed from this folder.

| Doc                                                  | Audience     | Description                                                                                         |
| ---------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| [showcase/](./showcase/README.md)                    | README       | Current Wave K/L UI screenshots + core-flow GIF used by the root README                             |
| [BLOOMRENDER_MANUAL.md](./BLOOMRENDER_MANUAL.md)     | Users        | Illustrated walkthrough (Traditional Chinese): generate, ID photo, portrait, travel, try-on, editor |
| [SCENE_IMAGES_SOURCES.md](./SCENE_IMAGES_SOURCES.md) | Setup        | Scene thumbs/refs layout and optional full-res downloads                                            |
| [SCENE_IMAGES_STATUS.md](./SCENE_IMAGES_STATUS.md)   | Setup        | Full scene list, filenames, and readiness status                                                    |
| [TYPES.md](./TYPES.md)                               | Contributors | Where shared vs feature-local TypeScript types live                                                 |

Wave Y/Z feature routes (also in root README):

- `/style-collage` — one photo × 4–6 viral styles → collage with grid/banner/story layouts, labels/borders, PNG/JPG, version regenerate.
- `/multi-person` — 2–4 portraits + multi-person viral templates (identity-preserving prompts, version regenerate).
- Viral pack: holiday + pet filter chips, favorites/recent (`bloom_viral_*` localStorage).

README showcase assets: [`docs/showcase/`](./showcase/). Older manual step photos still live under [`images/`](../images/) at the repo root.
