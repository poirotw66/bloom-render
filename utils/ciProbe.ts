/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TEMPORARY — deliberately broken, to be removed in the next commit.
 *
 * The CI workflow has never actually executed: `ci.yml` is registered but has
 * zero runs, and every one of this repo's 93 workflow runs is Deploy-on-push.
 * A green pipeline would only prove it ran; this proves it *blocks*.
 *
 * `npm run build` compiles this file without complaint — esbuild strips types
 * and never checks them — so if CI goes red here, `tsc --noEmit` is the step
 * doing the work, which is the whole premise of the gate.
 */

export const probeCount: number = 'not a number';

export const probeResult = probeCount.toFixed(undefinedIdentifierThatDoesNotExist);
