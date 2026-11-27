# Pose views and paired references

A pose reference is one exact material ID. The original materials keep their
existing IDs. Seven original studies provide relaxed standing, one hand on the hip, seated,
walking, arms crossed, hands in pockets and crossed ankles poses. Each fixed 3D pose has four actual camera views: front, three-quarter,
profile and back. Each camera has one line-art render and one normalized depth
render. The seated mannequin has bent knees, both feet on the floor and hands
resting on its knees. The hand-on-hip study bends one elbow outward while the
opposite arm stays relaxed. The walking study uses an extended stride with the right
leg forward, left foot lifted and opposite arm swing. Arms crossed bends both
forearms across the torso; hands in pockets places hands at the front hips;
crossed ankles overlaps the lower legs with one foot forward. Walking uses its
own `posture: "walking"` value; the other three new studies use `standing`.

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

The fifty-six PNG files and seven manifests (`standing-study`,
`hand-on-hip-study`, `seated-study`, `walking-study`, `arms-crossed-study`,
`hands-in-pockets-study` and `crossed-ankles-study`) live in `public/images/tryon-materials/` and are released as original CC0-1.0 assets. Each
manifest records its posture, all camera parameters, generator/geometry SHA-256 values and
per-image SHA-256 values. The same scene geometry and camera produce each pair. Each study declares its
own depth range and framing. All twenty-four previously published study PNGs remain byte-identical
when the library expands; existing material IDs keep their meaning.

To regenerate or verify the assets, use Python with NumPy and Pillow. The checked
outputs were generated with NumPy 1.26.4 and Pillow 12.0.0:

```sh
python3 scripts/generate-pose-study.py
python3 scripts/generate-pose-study.py --check
```

`--check` rerenders the scene and verifies deterministic output, paired
silhouettes, genuine per-surface z-buffer depth variation and unclipped image bounds.
The four new studies retain distinct geometry hashes and camera-aligned pairs. It is separate from the normal Node build;
NumPy and Pillow are not production or build dependencies.

`constants/poseStudies.mjs` explicitly registers the supported studies; manifests
cannot automatically grant trust to new groups or arbitrary files.

`npm run check:csp` checks catalog pair identity, shared pose/camera metadata,
manifest camera consistency, generator hash, actual PNG hashes and dimensions.
The post-build check repeats image/manifest validation against `dist/`. The Node
check validates the geometry hash's format; the explicit Python rerender is the
check that proves geometry/output reproducibility.

## Read-only MCP

`bloomrender_search_references` accepts `posture: "walking"`, `view: "back"` and
`representation: "lineart" | "depth"` in addition to the existing pose filters.
For example, `{posture:"walking",view:"profile",representation:"depth"}`
selects `walking-study-profile-depth`; its partner is
`walking-study-profile-lineart`. `get_reference` and search results expose `poseReference`, same-representation
`poseAlternatives` and the opposite `pairedReference`, each with exact material
IDs and public URLs. `compose_brief` preserves those IDs in its v1 recipe link.
All tools remain read-only and generate no images.
