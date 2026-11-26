# Pose views and paired references

A pose reference is one exact material ID. The original materials keep their
existing IDs. The standing study adds four actual camera views of one fixed
synthetic mannequin pose: front, three-quarter, profile and back. Each camera has
one line-art render and one normalized depth render.

For example, `standing-study-profile-depth` means the profile camera's depth
image. `standing-study-profile-lineart` is its aligned line-art partner. Both
carry `poseReference.pairId = "standing-study-profile"`. `poseReference` contains
only the pair ID and `lineart` / `depth` representation. Camera, framing and
posture remain in the shared `pose` metadata.

## Choosing a view

On a material detail page, choose **Pose view** and **Reference representation**
when those alternatives exist. The route changes to the exact material ID. The
try-on reference library provides the same controls for the selected pose;
changing either control loads and replaces the actual pose reference. A failed
load leaves the existing selection intact and shows an error.

The basket, prompt hints, board PNG, v1 recipe links, draft snapshots, generation
history and MCP all retain the selected material ID. There is no separate view
state that could disagree with the image. Existing recipes require no migration.
The try-on role limit remains one pose reference; a line-art/depth pair does not
silently add two input images or request a multi-view output.

## Comparing the pair

Open **View image**, then **Compare line art and depth**. The keyboard-accessible
range reveals the aligned depth image over the line-art image from that same
camera. Both use the existing zoom, mirror, bounded pan and image-aligned grid.
Comparing changes only the inspection display; the currently selected material
ID and representation remain the generation input. Missing or failed partner
images show an error instead of claiming a complete comparison. Older materials
without partners do not display pair controls.

These are original, synthetic structural references, not photographs or measured
human depth. The depth image is camera-relative: near surfaces are white, farther
surfaces are dark, and the background is zero. The declared range is in synthetic
scene units, not calibrated physical measurements. Automatic prompts describe
that meaning and use one camera view. Manual prompt text remains unchanged.

## Source and reproducibility

The eight PNG files and `standing-study-manifest.json` live in
`public/images/tryon-materials/` and are released as original CC0-1.0 assets. The
manifest records all camera parameters, generator/geometry SHA-256 values and
per-image SHA-256 values. The same scene geometry and camera produce each pair.

To regenerate or verify the assets, use Python with NumPy and Pillow. The checked
outputs were generated with NumPy 1.26.4 and Pillow 12.0.0:

```sh
python3 scripts/generate-pose-study.py
python3 scripts/generate-pose-study.py --check
```

`--check` rerenders the scene and verifies deterministic output, paired
silhouettes and depth variation. It is separate from the normal Node build;
NumPy and Pillow are not production or build dependencies.

`npm run check:csp` checks catalog pair identity, shared pose/camera metadata,
manifest camera consistency, generator hash, actual PNG hashes and dimensions.
The post-build check repeats image/manifest validation against `dist/`. The Node
check validates the geometry hash's format; the explicit Python rerender is the
check that proves geometry/output reproducibility.

## Read-only MCP

`bloomrender_search_references` accepts `view: "back"` and
`representation: "lineart" | "depth"` in addition to the existing pose filters.
`get_reference` and search results expose `poseReference`, same-representation
`poseAlternatives` and the opposite `pairedReference`, each with exact material
IDs and public URLs. `compose_brief` preserves those IDs in its v1 recipe link.
All tools remain read-only and generate no images.
