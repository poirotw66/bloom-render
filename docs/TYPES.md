# Type definitions layout

This document describes where shared and feature-specific TypeScript types live. We are **not** consolidating everything into one folder in one pass; new types should follow these conventions.

## Root `types.ts`

Cross-feature domain types used by multiple modules:

- ID photo: `RetouchLevel`, `IdPhotoType`, `OutputSpec`, `ClothingOption`
- Portrait / themed: `PortraitType`, `ThemedType`
- Travel **types only** (scenes, regions, vibes, etc.) — see below
- Editor / generation helpers as needed

**Constants** for ID photo options remain in `constants/idPhoto.ts` (labels, presets), not in `types.ts`.

## `constants/travel.ts`

Travel **prompt templates**, option presets, map metadata, and helpers (`pickRandomTravelScene` takes a scene list). The **scene catalog** (149 locations) lives in `constants/travel-data/*.json` and is loaded via `loadTravelSceneCatalog()` in `constants/travelScenesLoader.ts` (separate Vite chunks).

Travel **types** are defined in `types.ts` and re-exported from `constants/travel.ts` for convenience when importing scene data and types together.

## Feature-local types

Types that are only used inside one feature should stay next to that feature:

| Location                                | Purpose                                            |
| --------------------------------------- | -------------------------------------------------- |
| `features/photography-service/types.ts` | Photography service menu categories and items      |
| Feature hooks / pages                   | Small props-only types can remain in the same file |

## Routes

Route path strings are **not** types in `types.ts`. Use `constants/routes.ts` (`ROUTES`, `buildRoute`) as the single source of truth for client paths.

## When adding new types

1. Used by 2+ features → `types.ts` (or a dedicated `types/` module if the file grows).
2. Tied to one feature’s UI/API → `features/<name>/types.ts` or colocated with the hook.
3. Large static lists / enums with copy → `constants/<domain>.ts`, with types in `types.ts` if shared.
