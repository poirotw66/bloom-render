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
    <footer data-testid="site-footer" className="tool-footer">
      <div className="wrap tool-shell-wrap tool-footer-content">
        <span>{t('footer.open_source')}</span>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="tool-footer-link"
        >
          <GitHubIcon className="w-4 h-4" />
          {t('footer.contribute')}
        </a>
      </div>
    </footer>
  );
};

export default SiteFooter;
