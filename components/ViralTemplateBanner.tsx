/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Shows the selected viral template (thumb + title) on upload / generate surfaces.
 */

import React from 'react';
import { getViralTemplateCardById } from '../constants/viralTemplateCards';
import { useLanguage } from '../contexts/LanguageContext';
import { publicAssetUrl } from '../utils/publicAsset';

type ViralTemplateBannerProps = {
  templateId: string;
  className?: string;
  /** Extra hint under the title (e.g. upload instruction). */
  hintKey?: string;
  testId?: string;
};

const ViralTemplateBanner: React.FC<ViralTemplateBannerProps> = ({
  templateId,
  className = '',
  hintKey = 'viral.upload_for_template',
  testId = 'viral-template-banner',
}) => {
  const { t } = useLanguage();
  const template = getViralTemplateCardById(templateId);
  if (!template) return null;

  return (
    <div
      className={`w-full max-w-xl flex items-center gap-3 rounded-xl border theme-border theme-raised px-3 py-2.5 ${className}`}
      data-testid={testId}
      data-template-id={template.id}
      role="status"
    >
      <img
        src={publicAssetUrl(template.thumbnail)}
        alt={t(template.thumbnailAltKey)}
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0 border theme-border"
        data-testid="viral-template-banner-thumb"
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="text-xs theme-ink-muted">{t('viral.selected_template')}</p>
        <p
          className="text-base font-semibold theme-ink truncate"
          data-testid="viral-template-banner-title"
        >
          {t(template.titleKey)}
        </p>
        {hintKey ? <p className="text-xs theme-ink-muted mt-0.5">{t(hintKey)}</p> : null}
      </div>
    </div>
  );
};

export default ViralTemplateBanner;
