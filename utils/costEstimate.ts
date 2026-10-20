/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { lookupImagePriceUsd } from '../constants/imagePricing';

export type CostEstimate =
  | { kind: 'known'; unitUsd: number; quantity: number; totalUsd: number }
  | { kind: 'unknown' }
  | { kind: 'free'; quantity: number };

export function estimateGenerationCost(options: {
  modelId: string;
  quantity?: number;
  imageSize?: string | null;
  /** Demo / offline provider — always free. */
  isDemo?: boolean;
}): CostEstimate {
  const quantity = Math.max(1, Math.floor(options.quantity ?? 1));
  if (options.isDemo) {
    return { kind: 'free', quantity };
  }
  const unit = lookupImagePriceUsd(options.modelId, options.imageSize);
  if (unit === undefined) {
    return { kind: 'unknown' };
  }
  if (unit === 0) {
    return { kind: 'free', quantity };
  }
  return {
    kind: 'known',
    unitUsd: unit,
    quantity,
    totalUsd: unit * quantity,
  };
}

/** Format a USD amount for UI, e.g. 0.039 → "0.04", 0.134 → "0.13". */
export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount)) return '0.00';
  if (amount === 0) return '0.00';
  if (amount < 0.01) return amount.toFixed(3);
  return amount.toFixed(2);
}
