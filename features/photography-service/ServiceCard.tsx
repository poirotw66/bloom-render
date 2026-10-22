/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PhotographyServiceItem } from './types';
import { UI_BTN_PRIMARY, UI_CARD } from '../../utils/uiClasses';

interface ServiceCardProps {
  item: PhotographyServiceItem;
  onClick: (item: PhotographyServiceItem) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ item, onClick }) => {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      className={`group ${UI_CARD} p-6 flex flex-col gap-4 text-left hover:opacity-95 transition-opacity duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)]`}
      onClick={() => onClick(item)}
      aria-label={t(item.actionLabelKey)}
    >
      <div className="flex justify-between items-start gap-4">
        <h3 className="text-xl font-semibold theme-ink group-hover:brand-text transition-colors">
          {t(item.nameKey)}
        </h3>
        {item.badgeKey && (
          <span className="px-2 py-0.5 brand-bg text-white text-sm font-semibold tracking-wide rounded-md">
            {t(item.badgeKey)}
          </span>
        )}
      </div>

      <p className="text-base theme-ink-muted leading-relaxed line-clamp-3">
        {t(item.descriptionKey)}
      </p>

      <div className="mt-auto pt-4 flex items-center justify-end">
        <span className={UI_BTN_PRIMARY}>{t(item.actionLabelKey)}</span>
      </div>
    </button>
  );
};

export default ServiceCard;
