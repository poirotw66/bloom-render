# Adapted third-party modules

BloomRender includes code adapted from [PoseWear](https://github.com/atuizz/posewear),
Copyright (c) 2026 PoseWear contributors, under the MIT License.

The imported source is pinned to commit
`f9f55db356464af87f97b39f5bb57930ed0cd6df`:

| Original module                       | BloomRender adaptation               | Use                                                                       |
| ------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| `src/palette.js`                      | `utils/posewearPalette.ts`           | Extract material-image colors in the viewer.                              |
| `src/references.js, formatBrief only` | `utils/posewearReferences.ts`        | Copy ordered public references and local-image placeholders.              |
| `src/studio.js, clear/undo selection` | `utils/posewearSelectionSnapshot.ts` | Restore local reference selection with a revision guard.                  |
| `src/extras.js, batch selection`      | `utils/posewearBatchSelection.ts`    | Select visible catalog faces and prune stale selections.                  |
| `src/history.js, reference lightbox`  | `utils/posewearHistoryReferences.ts` | Trace stored reference images and identify missing originals.             |
| `src/extras.js, batch ZIP/copy`       | `utils/posewearMaterialBatch.ts`     | Export selected catalog images and combined public reference briefs.      |
| `src/extras.js, search suggestions`   | `utils/posewearSearchSuggestions.ts` | Keep bounded local query history and catalog-based suggestions.           |
| `src/extras.js, similar references`   | `utils/posewearSimilarMaterials.ts`  | Rank deterministic same-role suggestions using structured pose metadata.  |
| `src/history.js, selection/stepLb`    | `utils/posewearHistorySelection.ts`  | Select visible history records and navigate the filtered result sequence. |

The adaptations use typed ES modules and React consumers instead of the original
browser-global APIs. BloomRender supplies its own material catalog, localized labels,
public URLs and clipboard fallback. No upstream images, catalogs, translated material
descriptions, character assets, fonts or third-party datasets are included by these ports.

The complete, unmodified [MIT copyright and permission notice](public/licenses/posewear-MIT.txt)
ships with the site at `licenses/posewear-MIT.txt` and is linked from Settings.
[The provenance manifest](third_party/posewear/manifest.json) records source URLs,
revision and SHA-256 checksums. The project's own [license](LICENSE), existing vendored
notices and installed dependencies' licenses remain separate.
