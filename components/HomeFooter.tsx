/** @license SPDX-License-Identifier: MIT */
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useHomeUpload } from '../hooks/useHomeUpload';
import { ROUTES } from '../constants/routes';
import { GITHUB_REPO_URL } from '../constants/site';
import { openSettingsPanel } from '../utils/settingsPanel';
import OpenRouterSignInButton from './OpenRouterSignInButton';
import { ErrorDisplay } from './ErrorDisplay';

export default function HomeFooter({ onImageSelected }: { onImageSelected: (file: File) => void }) {
  const { t } = useLanguage();
  const { isDemoMode } = useSettings();
  const { input, error, openingSample, pickFile, startEditing } = useHomeUpload(onImageSelected);
  const upload = (
    <>
      {isDemoMode ? t('demo.open_editor_sample') : t('home.upload')}{' '}
      <svg className="m-arrow" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 8h11M9 3l5 5-5 5" />
      </svg>
    </>
  );
  return (
    <footer
      className="home-footer closing"
      data-testid="site-footer"
      aria-labelledby="home-close-title"
    >
      <div className="wrap home-wrap">
        <div className="home-close">
          <div>
            <p className="home-eyebrow">BloomRender</p>
            <h2 id="home-close-title">{t('home.close_title')}</h2>
            <p>{t('home.close_subtitle')}</p>
          </div>
          <input
            ref={input}
            type="file"
            hidden
            accept="image/*"
            aria-label={t('home.upload')}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) pickFile(file);
              event.target.value = '';
            }}
          />
          {error && <ErrorDisplay message={error} />}
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void startEditing()}
            disabled={openingSample}
          >
            {upload}
          </button>
        </div>
        <div className="home-footer__directory">
          <div className="home-faq">
            <div>
              <h3>{t('home.faq_key_title')}</h3>
              <p>{t('home.faq_key_body')}</p>
              <OpenRouterSignInButton compact />
            </div>
            <div>
              <h3>{t('home.faq_privacy_title')}</h3>
              <p>{t('home.faq_privacy_body')}</p>
              <button type="button" className="link" onClick={openSettingsPanel}>
                {t('home.connect_key')}
              </button>
            </div>
          </div>
          <div className="home-footer__legal">
            <span>
              © {new Date().getFullYear()} BloomRender · {t('footer.open_source')}
            </span>
            <div>
              <Link to={ROUTES.HISTORY}>{t('history.title')}</Link>
              <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
                GitHub ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
