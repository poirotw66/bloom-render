# public/examples

Example output shown on the home gallery and on each feature page's empty
state, wired up in `constants/examples.ts`.

These are **crops of real runs of this app**, taken from the UI screenshots in
`/images` that `docs/BLOOMRENDER_MANUAL.md` documents. The screenshots include
the app's own chrome — headers, parameter cards, download buttons — which would
look wrong rendered back inside the app, so each generated photo was cut out of
its screenshot and re-encoded as WebP (long edge capped at 720px, quality 80).

| File                   | Cropped from                | Shown as                          |
| ---------------------- | --------------------------- | --------------------------------- |
| `generate-1/2.webp`    | `generate_2_image.png`      | Generate: two takes on one prompt |
| `editor-before.webp`   | `edit_1_prompt.png`         | Editor: compare slider, before    |
| `editor-after.webp`    | `edit_2_image.png`          | Editor: compare slider, after     |
| `idphoto-before.webp`  | `idphoto_1_messy_image.png` | ID photo: the casual source shot  |
| `idphoto-after.webp`   | `idphoto_2_messy_idp.png`   | ID photo: result, open collar     |
| `idphoto-after-2.webp` | `idphoto_2_messy_idp.png`   | ID photo: result, shirt and tie   |
| `portrait-1/2.webp`    | `portrait_3_full.png`       | Portrait: two studio setups       |
| `travel-1.webp`        | `travel_3_man.png`          | Travel: Eiffel Tower, snow        |
| `travel-2.webp`        | `travel_5_cuple_img.png`    | Travel: Yehliu Geopark, couple    |
| `tryon-before.webp`    | `tryon_3_girl.png`          | Try-on: the uploaded photo        |
| `tryon-after.webp`     | `tryon_4_girl_img.png`      | Try-on: result, style 1           |
| `tryon-after-2.webp`   | `tryon_4_girl_img.png`      | Try-on: result, style 2           |

To add or replace one, crop the region out of the source screenshot and export
WebP at the same budget. Two constraints matter:

- A `compare` entry in `constants/examples.ts` renders a wipe slider, so its
  before and after must share an aspect ratio. Mismatched images make the
  slider crop one of them, which misrepresents the result — use `pair` instead.
- Keep each file well under ~60KB. They are lazy-loaded, but the home gallery
  requests ten of them.

Unlike `public/images/scenes/`, these files _are_ committed: the empty states
depend on them, so a fresh clone has to render correctly without any download
step.
