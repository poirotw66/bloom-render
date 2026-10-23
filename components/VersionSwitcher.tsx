/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Switch among up to N generation versions.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { UI_CHIP_ACTIVE, UI_CHIP_INACTIVE } from '../utils/uiClasses';

interface VersionSwitcherProps {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  titleKey?: string;
  versionKey?: string;
  testId?: string;
}

const VersionSwitcher: React.FC<VersionSwitcherProps> = ({
  count,
  activeIndex,
  onSelect,
  titleKey = 'style_collage.versions_title',
  versionKey = 'style_collage.version_n',
  testId = 'version-switcher',
}) => {
  const { t } = useLanguage();
  if (count <= 1) return null;
  return (
    <div className="flex flex-col gap-2 items-center w-full" data-testid={testId}>
      <p className="text-sm font-semibold theme-ink">{t(titleKey)}</p>
      <div className="flex flex-wrap gap-2 justify-center" role="tablist" aria-label={t(titleKey)}>
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            data-testid={`${testId}-${i}`}
            className={i === activeIndex ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE}
            onClick={() => onSelect(i)}
          >
            {t(versionKey, { n: String(i + 1) })}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VersionSwitcher;
