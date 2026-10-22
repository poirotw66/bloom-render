/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Community prompt gallery: browse seeded presets and apply one with a click.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SavedPromptsImportExport from '../../components/SavedPromptsImportExport';
import {
  PROMPT_GALLERY_ENTRIES,
  localizedGalleryDescription,
  localizedGalleryTags,
  localizedGalleryTitle,
  type PromptGalleryEntry,
  type PromptGalleryFeature,
} from '../../constants/promptGallery';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { applyPromptGalleryPreset } from '../../utils/applyPromptGalleryPreset';
import { publicAssetUrl } from '../../utils/publicAsset';
import {
  UI_BTN_PRIMARY,
  UI_CARD_SOFT,
  UI_CHIP_ACTIVE,
  UI_CHIP_INACTIVE,
  UI_PAGE,
  UI_SUBTITLE,
  UI_TITLE,
  getPageSurface,
  getTitleAccent,
} from '../../utils/uiClasses';

const FEATURE_FILTERS: Array<PromptGalleryFeature | 'all'> = [
  'all',
  'generate',
  'retouch',
  'adjust',
  'filter',
];

/** Title-matching gradient fallback when no thumbnail asset is available. */
function GalleryThumb({
  entry,
  title,
  tags,
}: {
  entry: PromptGalleryEntry;
  title: string;
  tags?: string[];
}) {
  if (entry.thumbnail) {
    return (
      <img
        src={publicAssetUrl(entry.thumbnail)}
        alt=""
        className="w-full aspect-[4/3] object-cover theme-raised"
        loading="lazy"
      />
    );
  }

  const featureTint: Record<PromptGalleryFeature, string> = {
    generate: 'from-fuchsia-700/80 via-rose-800/70 to-indigo-900/90',
    retouch: 'from-sky-700/80 via-cyan-800/70 to-slate-900/90',
    adjust: 'from-amber-700/70 via-orange-900/60 to-stone-900/90',
    filter: 'from-violet-700/80 via-purple-900/70 to-zinc-900/90',
  };

  return (
    <div
      className={`w-full aspect-[4/3] flex flex-col justify-end p-4 bg-gradient-to-br ${featureTint[entry.feature]}`}
      role="img"
      aria-label={title}
      data-testid="gallery-gradient-card"
    >
      <p className="text-white text-lg font-semibold leading-snug drop-shadow-sm line-clamp-3">
        {title}
      </p>
      {tags && tags.length > 0 && (
        <p className="mt-1 text-white/80 text-xs tracking-wide">{tags.slice(0, 3).join(' · ')}</p>
      )}
    </div>
  );
}

const PromptGalleryPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const surface = getPageSurface(theme);
  const [filter, setFilter] = useState<PromptGalleryFeature | 'all'>('all');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const entries = useMemo(
    () =>
      filter === 'all'
        ? PROMPT_GALLERY_ENTRIES
        : PROMPT_GALLERY_ENTRIES.filter((entry) => entry.feature === filter),
    [filter],
  );

  const handleApply = useCallback(
    async (id: string) => {
      const entry = PROMPT_GALLERY_ENTRIES.find((item) => item.id === id);
      if (!entry) return;
      setApplyError(null);
      setApplyingId(id);
      try {
        await applyPromptGalleryPreset(entry, navigate);
      } catch {
        setApplyError(t('prompt_gallery.apply_failed'));
      } finally {
        setApplyingId(null);
      }
    },
    [navigate, t],
  );

  return (
    <div className={`${UI_PAGE} ${surface}`} data-testid="prompt-gallery-page">
      <header className="text-center mb-8">
        <h1 className={UI_TITLE}>
          <span className={getTitleAccent(theme)}>{t('prompt_gallery.title')}</span>
        </h1>
        <p className={`${UI_SUBTITLE} mt-2`}>{t('prompt_gallery.subtitle')}</p>
      </header>

      <section
        className="mb-8 rounded-2xl border theme-border theme-raised p-4"
        aria-labelledby="prompt-gallery-library"
      >
        <h2 id="prompt-gallery-library" className="text-lg font-semibold theme-ink mb-1">
          {t('prompt_gallery.library_title')}
        </h2>
        <p className="text-sm theme-ink-muted mb-3">{t('prompt_gallery.library_hint')}</p>
        <SavedPromptsImportExport />
      </section>

      <div
        className="flex flex-wrap items-center gap-2 mb-6"
        role="group"
        aria-label={t('prompt_gallery.filter_label')}
      >
        {FEATURE_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={filter === value ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE}
          >
            {t(`prompt_gallery.filter_${value}`)}
          </button>
        ))}
      </div>

      {applyError && <p className="mb-4 text-sm text-red-300">{applyError}</p>}

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
        {entries.map((entry) => {
          const title = localizedGalleryTitle(entry, language);
          const description = localizedGalleryDescription(entry, language);
          const tags = localizedGalleryTags(entry, language);
          return (
            <li key={entry.id} className={`flex flex-col ${UI_CARD_SOFT}`}>
              <GalleryThumb entry={entry} title={title} tags={tags} />
              <div className="flex flex-col gap-2 p-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold theme-ink">{title}</h3>
                  <span className="shrink-0 text-sm tracking-wide rounded-md px-2 py-0.5 brand-bg text-white">
                    {t(`prompt_gallery.feature_${entry.feature}`)}
                  </span>
                </div>
                {description && (
                  <p className="text-sm theme-ink-muted line-clamp-2">{description}</p>
                )}
                <p className="text-sm theme-ink-muted line-clamp-3 font-sans">{entry.prompt}</p>
                <button
                  type="button"
                  disabled={applyingId === entry.id}
                  onClick={() => void handleApply(entry.id)}
                  className={`mt-auto w-full ${UI_BTN_PRIMARY}`}
                >
                  {applyingId === entry.id
                    ? t('prompt_gallery.applying')
                    : t('prompt_gallery.apply')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {entries.length === 0 && (
        <p className="text-center theme-ink-muted py-12">{t('prompt_gallery.empty')}</p>
      )}

      <p className="mt-10 text-center text-sm theme-ink-muted">
        {t('prompt_gallery.contribute_hint')}
      </p>
    </div>
  );
};

export default PromptGalleryPage;
