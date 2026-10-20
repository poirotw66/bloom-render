/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Community prompt gallery: browse seeded presets and apply one with a click.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SavedPromptsImportExport from '../../components/SavedPromptsImportExport';
import { PROMPT_GALLERY_ENTRIES, type PromptGalleryFeature } from '../../constants/promptGallery';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { applyPromptGalleryPreset } from '../../utils/applyPromptGalleryPreset';
import { publicAssetUrl } from '../../utils/publicAsset';
import { UI_PAGE, UI_SUBTITLE, UI_TITLE, getPageSurface } from '../../utils/uiClasses';

const FEATURE_FILTERS: Array<PromptGalleryFeature | 'all'> = [
  'all',
  'generate',
  'retouch',
  'adjust',
  'filter',
];

const PromptGalleryPage: React.FC = () => {
  const { t } = useLanguage();
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
    <div className={`${UI_PAGE} w-full max-w-5xl mx-auto ${surface}`}>
      <header className="text-center mb-8">
        <h1 className={UI_TITLE}>{t('prompt_gallery.title')}</h1>
        <p className={`${UI_SUBTITLE} mt-2`}>{t('prompt_gallery.subtitle')}</p>
      </header>

      <section
        className="mb-8 rounded-2xl border border-white/10 bg-black/20 p-4"
        aria-labelledby="prompt-gallery-library"
      >
        <h2 id="prompt-gallery-library" className="text-lg font-semibold text-gray-100 mb-1">
          {t('prompt_gallery.library_title')}
        </h2>
        <p className="text-sm text-gray-400 mb-3">{t('prompt_gallery.library_hint')}</p>
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
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              filter === value
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {t(`prompt_gallery.filter_${value}`)}
          </button>
        ))}
      </div>

      {applyError && <p className="mb-4 text-sm text-red-300">{applyError}</p>}

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-col rounded-2xl border border-white/10 bg-gray-900/40 overflow-hidden"
          >
            <img
              src={publicAssetUrl(entry.thumbnail)}
              alt=""
              className="w-full aspect-[4/3] object-cover bg-black/40"
              loading="lazy"
            />
            <div className="flex flex-col gap-2 p-4 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-gray-100">{entry.title}</h3>
                <span className="shrink-0 text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-white/10 text-gray-300">
                  {t(`prompt_gallery.feature_${entry.feature}`)}
                </span>
              </div>
              {entry.description && (
                <p className="text-xs text-gray-400 line-clamp-2">{entry.description}</p>
              )}
              <p className="text-xs text-gray-500 line-clamp-3 font-mono">{entry.prompt}</p>
              <button
                type="button"
                disabled={applyingId === entry.id}
                onClick={() => void handleApply(entry.id)}
                className="mt-auto w-full rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold py-2.5 text-sm hover:opacity-95 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {applyingId === entry.id ? t('prompt_gallery.applying') : t('prompt_gallery.apply')}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {entries.length === 0 && (
        <p className="text-center text-gray-400 py-12">{t('prompt_gallery.empty')}</p>
      )}

      <p className="mt-10 text-center text-xs text-gray-500">
        {t('prompt_gallery.contribute_hint')}
      </p>
    </div>
  );
};

export default PromptGalleryPage;
