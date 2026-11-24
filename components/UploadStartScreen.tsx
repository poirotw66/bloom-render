/** @license SPDX-License-Identifier: MIT */
import { lazy, Suspense, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useHomeDesign } from '../hooks/useHomeDesign';
import { useHomeUpload } from '../hooks/useHomeUpload';
import { usePasteImage } from '../hooks/usePasteImage';
import { publicAssetUrl as asset } from '../utils/publicAsset';
import { openSettingsPanel } from '../utils/settingsPanel';
import { ROUTES } from '../constants/routes';
import CompareSlider from './CompareSlider';
import { ErrorDisplay } from './ErrorDisplay';

const ViralTemplatesSection = lazy(() => import('./ViralTemplatesSection'));
const Arrow = () => (
  <svg className="m-arrow" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M2 8h11M9 3l5 5-5 5" />
  </svg>
);

export default function UploadStartScreen({
  active = true,
  onImageSelected,
}: {
  active?: boolean;
  onImageSelected: (file: File) => void;
}) {
  if (!active) return null;
  return <HomePage onImageSelected={onImageSelected} />;
}

function HomePage({ onImageSelected }: { onImageSelected: (file: File) => void }) {
  const { t } = useLanguage();
  const settings = useSettings();
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<'editor' | 'restore'>('editor');
  const { input, error, openingSample, pickFile, startEditing } = useHomeUpload(onImageSelected);
  const dropZone = useRef<HTMLElement>(null);
  useHomeDesign();
  usePasteImage(dropZone, pickFile, { enabled: !settings.isDemoMode });
  const hasKey = Boolean(settings.effectiveApiKey.trim());
  const upload = (
    <>
      {settings.isDemoMode ? t('demo.open_editor_sample') : t('home.upload')} <Arrow />
    </>
  );
  return (
    <>
      <section
        id="top"
        ref={dropZone}
        className={`home-hero hero hero--centred ${dragging ? 'home-hero--dragging' : ''}`}
        data-enter
        aria-labelledby="home-title"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          )
            setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) pickFile(file);
        }}
      >
        <div className="wrap home-wrap">
          <div className="hero-text home-hero__content">
            <div className="home-hero__text">
              <p className="home-eyebrow">{t('home.eyebrow')}</p>
              <h1 id="home-title" data-enter-whole>
                {t('home.title')}
                <br />
                <span>{t('home.title_second')}</span>
              </h1>
              <p className="hero__lead">{t('home.subtitle')}</p>
              <div className="home-actions btn-row">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => void startEditing()}
                  disabled={openingSample}
                >
                  {upload}
                </button>
                {!settings.isDemoMode && !hasKey ? (
                  <button
                    type="button"
                    className="btn btn--secondary"
                    data-testid="try-demo-button"
                    onClick={settings.enableDemoMode}
                  >
                    {t('demo.try_demo')} <span aria-hidden="true">↗</span>
                  </button>
                ) : (
                  <a className="btn btn--secondary" href="#styles">
                    {t('home.browse_styles')} <span aria-hidden="true">↓</span>
                  </a>
                )}
              </div>
              {!settings.isDemoMode && !hasKey && (
                <p className="home-key-note" data-testid="api-key-notice">
                  <span>{t('home.key_note')}</span>{' '}
                  <button type="button" className="link" onClick={openSettingsPanel}>
                    {t('home.connect_key')}
                  </button>
                </p>
              )}
              {settings.isDemoMode && (
                <p className="home-key-note" role="status">
                  {t('home.demo_note')}{' '}
                  <button type="button" className="link" onClick={openSettingsPanel}>
                    {t('home.connect_key')}
                  </button>
                </p>
              )}
              {error && <ErrorDisplay message={error} />}
              <input
                ref={input}
                id="image-upload-start"
                type="file"
                hidden
                tabIndex={-1}
                accept="image/*"
                aria-label={t('start.upload_button')}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) pickFile(file);
                  event.target.value = '';
                }}
              />
            </div>
            <div
              className="home-preview hero__window app-frame"
              data-ui="bloom-editor"
              data-enter-media
              data-testid="home-editor-preview"
            >
              <div className="home-preview__bar">
                <span className="home-preview__brand">
                  BloomRender <span>/ {t('home.preview_studio')}</span>
                </span>
                <span className="home-preview__hint">{t('home.preview_hint')}</span>
              </div>
              <div className="home-preview__body">
                <div
                  className="home-preview__tools"
                  role="group"
                  aria-label={t('home.preview_tools')}
                >
                  <span className="home-eyebrow">{t('home.preview_tools')}</span>
                  <button
                    type="button"
                    aria-pressed={preview === 'editor'}
                    onClick={() => setPreview('editor')}
                  >
                    <span aria-hidden="true">✧</span>
                    {t('main.tab_retouch')}
                  </button>
                  <button
                    type="button"
                    aria-pressed={preview === 'restore'}
                    onClick={() => setPreview('restore')}
                  >
                    <span aria-hidden="true">◈</span>
                    {t('home.preview_restore')}
                  </button>
                  <p>{t('home.preview_instruction')}</p>
                </div>
                <div
                  style={
                    {
                      '--compare-ratio': preview === 'editor' ? 720 / 403 : 4 / 3,
                    } as import('react').CSSProperties
                  }
                  className="home-preview__canvas"
                  data-testid="mobile-hero-showcase"
                >
                  <CompareSlider
                    key={preview}
                    originalUrl={asset(`examples/${preview}-before.webp`)}
                    currentUrl={asset(`examples/${preview}-after.webp`)}
                    className="home-compare"
                    imageClassName="home-compare__image"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Suspense
        fallback={
          <section className="home-section home-styles-loading" aria-busy="true">
            <div className="wrap home-wrap">
              <h2>{t('viral.section_title')}</h2>
            </div>
          </section>
        }
      >
        <ViralTemplatesSection presentation="home" />
      </Suspense>
      <section id="studio" className="home-section home-studio" aria-labelledby="home-studio-title">
        <div className="wrap home-wrap">
          <h2 id="home-studio-title">{t('home.studio_title')}</h2>
          <div className="home-studio__grid">
            <div className="home-studio__text">
              <p className="home-lead">{t('home.studio_intro')}</p>
              <div className="home-tool-list">
                {(
                  [
                    ['01', 'home.tool_portrait', 'home.tool_portrait_desc', ROUTES.ID_PHOTO],
                    ['02', 'home.tool_travel', 'home.tool_travel_desc', ROUTES.TRAVEL],
                    ['03', 'home.tool_group', 'home.tool_group_desc', ROUTES.MULTI_PERSON],
                  ] as const
                ).map(([number, title, description, route]) => (
                  <Link key={route} to={route}>
                    <span className="home-tool-list__number" aria-hidden="true">
                      {number}
                    </span>
                    <span>
                      <strong>{t(title)}</strong>
                      <span>{t(description)}</span>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
              <Link className="btn btn--secondary" to={ROUTES.PROMPT_GALLERY}>
                {t('home.prompt_gallery')} <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <figure
              className="home-studio__visual frame frame--photo"
              data-moment="liquid-hover"
              data-moment-opts='{"strength":0.25}'
            >
              <img
                src={asset('examples/travel-1.webp')}
                alt={t('examples.travel_1')}
                loading="lazy"
                decoding="async"
                width="960"
                height="540"
                data-source="BloomRender"
                data-subject="AI travel photo"
              />
            </figure>
          </div>
        </div>
      </section>
    </>
  );
}
