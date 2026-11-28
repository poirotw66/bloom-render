# Generated clothing and pose references

The approved 2026-11-28 batch adds 36 garment flat lays and 24 single-view pose
studies. The catalog now has 136 exact material IDs presented as 87 browsing
cards. Existing 3D study pairs and the first twelve generated garments keep
their original IDs and image bytes.

The new public [generation manifest](../public/images/tryon-materials/reference-generation-2026-11-28-manifest.json)
records the actual English prompt, requested model `gpt-image-2.6-sunburst`,
1024×1024 medium-quality PNG settings and SHA-256 for each image. Generation
used the imagegen skill's bundled API CLI with no input images. The original
outputs remain in the ignored local `output/imagegen/batch-2026-11-28/final/`
folder; `selected/` and `selected-jobs.jsonl` retain the reviewed choices and
their actual prompts, including any targeted correction. Keys, billing records,
draft lists and upstream inventory are not public
assets.

The subjects are original designs described with common garment and pose terms.
Source subject IDs record the category research only; no upstream gallery image
was downloaded, supplied to the model or copied into this library. These images
use `LicenseRef-AI-Generated` and the directory's [use statement](../public/images/tryon-materials/LICENSE.txt),
not the CC0 dedication for our SVG and deterministic 3D references.

Pose entries carry exact `pose` metadata and support standing, seated,
squatting, kneeling and lying filters. They depict faceless synthetic mannequins
in opaque gray bodysuits. Each entry has one eye-level three-quarter camera
view; there is no `poseReference`, additional camera or paired depth image.
Their try-on prompt asks the model to follow the body pose without transferring
the mannequin, bodysuit or rendering style. Garment try-on prompts describe the
cut, fabric and color without repeating flat-lay generation instructions.

`constants/generatedMaterialBatches.mjs` registers both reviewed batches. The
source and built-asset checks verify complete catalog identity, role metadata,
manifest/model/settings, 1024×1024 dimensions and exact image hashes. A public
manifest cannot authorize a new file by itself. AI output is not claimed to be
reproducible; these checks preserve the reviewed files and their provenance.
