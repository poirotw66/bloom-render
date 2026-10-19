/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Result image with optional before/after CompareSlider.
 */

import React, { useState } from 'react';
import CompareSlider from './CompareSlider';
import { useLanguage } from '../contexts/LanguageContext';
import { UI_BTN_SECONDARY } from '../utils/uiClasses';

interface ResultImageProps {
  resultUrl: string;
  originalUrl?: string | null;
  alt?: string;
  imageClassName?: string;
  className?: string;
  /** Prefer showing the slider when an original is available (default true). */
  preferCompare?: boolean;
}

const ResultImage: React.FC<ResultImageProps> = ({
  resultUrl,
  originalUrl,
  alt,
  imageClassName = 'w-full h-auto',
  className = '',
  preferCompare = true,
}) => {
  const { t } = useLanguage();
  const canCompare = Boolean(originalUrl);
  const [showCompare, setShowCompare] = useState(preferCompare && canCompare);

  return (
    <div className={`flex flex-col items-center gap-3 w-full ${className}`}>
      {canCompare && (
        <div className="flex gap-2">
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-lg ${showCompare ? 'bg-white/15 text-white' : UI_BTN_SECONDARY}`}
            onClick={() => setShowCompare(true)}
            aria-pressed={showCompare}
          >
            {t('result.compare_toggle')}
          </button>
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-lg ${!showCompare ? 'bg-white/15 text-white' : UI_BTN_SECONDARY}`}
            onClick={() => setShowCompare(false)}
            aria-pressed={!showCompare}
          >
            {t('result.result_only')}
          </button>
        </div>
      )}

      {showCompare && originalUrl ? (
        <CompareSlider
          originalUrl={originalUrl}
          currentUrl={resultUrl}
          imageClassName={imageClassName}
        />
      ) : (
        <img src={resultUrl} alt={alt ?? t('result.image_alt')} className={imageClassName} />
      )}
    </div>
  );
};

export default ResultImage;
