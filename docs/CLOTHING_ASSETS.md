# Generated clothing references

The library includes twelve AI-generated flat lays: six tops, three pairs of
trousers, one skirt and two outerwear pieces. Each is an unbranded single garment
on a neutral background, generated from text without input photographs.

The public source record is
[`clothing-generation-manifest.json`](../public/images/tryon-materials/clothing-generation-manifest.json).
It preserves the exact generation prompts, requested OpenAI model
`gpt-image-2.6-sunburst`, 1024×1024 medium-quality PNG settings, and SHA-256 values
of the shipped files. Generation used the imagegen skill's bundled API CLI.
The original outputs are retained locally in `output/imagegen/clothing-final/`;
that folder and the private budget ledger are ignored by Git.

The catalog's `prompt` describes the garment for try-on. It deliberately omits
the flat-lay generation instructions, so applying the reference does not ask the
try-on provider to generate another product photograph.

These entries use `LicenseRef-AI-Generated` and link to their manifest. They are
distinct from the original CC0 SVG illustrations and deterministic 3D mannequin
references. See the directory's [use statement](../public/images/tryon-materials/LICENSE.txt).
No PoseWear images, user portraits or prior private try-on results are included.

`npm run check:csp` checks the reviewed ID/category registry, generation settings,
manifest identity, image dimensions and hashes. The complete build repeats these
checks against `dist/`. Removing a registered garment, dropping its AI label,
changing image bytes or omitting the manifest fails validation. These checks
verify provenance and shipped files; they do not claim deterministic AI output.
