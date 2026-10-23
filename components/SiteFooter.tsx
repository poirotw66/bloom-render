/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { GITHUB_REPO_URL } from '../constants/site';
import { GitHubIcon } from './icons';

const SiteFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer
      data-testid="site-footer"
      className="w-full max-w-[1600px] mx-auto px-5 pb-8 sm:px-6 md:px-8"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm theme-ink-muted border-t theme-border pt-5 mt-2">
        <span>{t('footer.open_source')}</span>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 theme-ink-soft hover:brand-text focus:outline-none focus-visible:brand-ring rounded-md"
        >
          <GitHubIcon className="w-4 h-4" />
          {t('footer.contribute')}
        </a>
      </div>
    </footer>
  );
};

export default SiteFooter;
