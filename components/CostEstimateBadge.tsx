/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Compact cost hint shown next to generate controls.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { estimateGenerationCost, formatUsd } from '../utils/costEstimate';

interface CostEstimateBadgeProps {
  quantity?: number;
  /** Override resolution when the page picks 1K/2K/4K locally. */
  imageSize?: string | null;
  className?: string;
}

const CostEstimateBadge: React.FC<CostEstimateBadgeProps> = ({
  quantity = 1,
  imageSize,
  className = '',
}) => {
  const { t } = useLanguage();
  const { effectiveModel, isDemoMode } = useSettings();
  const estimate = estimateGenerationCost({
    modelId: effectiveModel,
    quantity,
    imageSize,
    isDemo: isDemoMode,
  });

  let label: string;
  if (estimate.kind === 'unknown') {
    label = t('cost.price_unknown');
  } else if (estimate.kind === 'free') {
    label = t('cost.free');
  } else if (estimate.quantity <= 1) {
    label = t('cost.estimate_unit', { amount: formatUsd(estimate.unitUsd) });
  } else {
    label = t('cost.estimate_times', {
      amount: formatUsd(estimate.unitUsd),
      count: String(estimate.quantity),
    });
  }

  return (
    <p
      className={`text-xs text-gray-400 text-center ${className}`}
      title={t('cost.estimate_hint')}
      data-testid="cost-estimate"
    >
      {label}
    </p>
  );
};

export default CostEstimateBadge;
