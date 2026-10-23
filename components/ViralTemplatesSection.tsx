/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Discoverable viral “玩法” template picker (landing + generate).
 * Taste PRESERVE: keep theme hues; tighten rhythm, chips, and card density.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { VIRAL_TEMPLATES, type ViralTemplateCategory } from '../constants/viralTemplates';
import { ROUTES } from '../constants/routes';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { publicAssetUrl } from '../utils/publicAsset';
import { applyViralTemplate, remixUrlForTemplate } from '../utils/applyViralTemplate';
import {
  canStartStyleCollage,
  STYLE_COLLAGE_MAX,
  toggleViralSelection,
} from '../utils/viralSelection';
import {
  UI_BTN_PRIMARY,
  UI_BTN_SECONDARY,
  UI_CHIP_ACTIVE,
  UI_CHIP_INACTIVE,
} from '../utils/uiClasses';

const CATEGORIES: Array<ViralTemplateCategory | 'all'> = [
  'all',
  'figurine',
  'polaroid',
  'era',
  'taiwan',
  'toy',
  'art',
  'retro',
  'social',
  'costume',
];

/** When viewing “all” on desktop grid, collapse to avoid a tall wall. */
const ALL_PREVIEW_COUNT = 8;

interface ViralTemplatesSectionProps {
  className?: string;
  /** Compact layout for generate / travel feature pages. */
  compact?: boolean;
  /** Optional starting category filter (e.g. Taiwan scenes on Travel). */
  initialCategory?: ViralTemplateCategory | 'all';
}

const ViralTemplatesSection: React.FC<ViralTemplatesSectionProps> = ({
  className = '',
  compact = false,
  initialCategory = 'all',
}) => {
  const { t } = useLanguage();
  const { isDemoMode } = useSettings();
  const navigate = useNavigate();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(initialCategory);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [collageMode, setCollageMode] = useState(false);
  const [collageIds, setCollageIds] = useState<string[]>([]);
  const [collageHint, setCollageHint] = useState<string | null>(null);

  const entries =
    category === 'all'
      ? VIRAL_TEMPLATES
      : VIRAL_TEMPLATES.filter((entry) => entry.category === category);

  const collapseAll =
    !compact && category === 'all' && !showAll && entries.length > ALL_PREVIEW_COUNT;
  const visibleEntries = collapseAll ? entries.slice(0, ALL_PREVIEW_COUNT) : entries;

  const onApply = async (id: string) => {
    const template = VIRAL_TEMPLATES.find((entry) => entry.id === id);
    if (!template) return;
    setBusyId(id);
    try {
      await applyViralTemplate(template, navigate, { demoMode: isDemoMode });
    } finally {
      setBusyId(null);
    }
  };

  const onCategory = (value: (typeof CATEGORIES)[number]) => {
    setCategory(value);
    setShowAll(false);
  };

  const onToggleCollage = (id: string) => {
    setCollageHint(null);
    const next = toggleViralSelection(collageIds, id, { max: STYLE_COLLAGE_MAX });
    if (next.rejectedAtMax) {
      setCollageHint(t('style_collage.error_max', { max: String(STYLE_COLLAGE_MAX) }));
    }
    setCollageIds(next.ids);
  };

  const openCollage = () => {
    if (!canStartStyleCollage(collageIds.length)) {
      setCollageHint(
        t('style_collage.error_need_count', {
          min: '4',
          max: String(STYLE_COLLAGE_MAX),
        }),
      );
      return;
    }
    navigate(ROUTES.STYLE_COLLAGE, { state: { selectedIds: collageIds } });
  };

  return (
    <section
      className={`w-full text-left ${className}`}
      aria-labelledby="viral-templates-heading"
      data-testid="viral-templates"
    >
      <div className="mb-3 sm:mb-4 space-y-1.5">
        <h2
          id="viral-templates-heading"
          className="text-xl sm:text-2xl font-semibold tracking-tight theme-ink"
        >
          {t('viral.section_title')}
        </h2>
        <p className="text-sm sm:text-base theme-ink-muted max-w-2xl leading-relaxed">
          {t('viral.section_subtitle')}
        </p>
      </div>

      {!compact && (
        <div className="mb-3 flex flex-wrap gap-2 items-center" data-testid="viral-extra-actions">
          <button
            type="button"
            data-testid="viral-collage-mode"
            aria-pressed={collageMode}
            className={collageMode ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE}
            onClick={() => {
              setCollageMode((v) => !v);
              setCollageHint(null);
              if (collageMode) setCollageIds([]);
            }}
          >
            {collageMode ? t('viral.collage_mode_on') : t('viral.collage_mode')}
          </button>
          <Link
            to={ROUTES.STYLE_COLLAGE}
            className={`${UI_BTN_SECONDARY} text-sm no-underline`}
            data-testid="viral-open-collage"
          >
            {t('viral.open_collage')}
          </Link>
          <Link
            to={ROUTES.MULTI_PERSON}
            className={`${UI_BTN_SECONDARY} text-sm no-underline`}
            data-testid="viral-open-multi-person"
          >
            {t('viral.open_multi_person')}
          </Link>
          {collageMode && (
            <button
              type="button"
              data-testid="viral-collage-start"
              className={`${UI_BTN_PRIMARY} text-sm`}
              disabled={!canStartStyleCollage(collageIds.length)}
              onClick={openCollage}
            >
              {t('viral.collage_start', { count: String(collageIds.length) })}
            </button>
          )}
        </div>
      )}

      {collageMode && collageHint && (
        <p className="mb-2 text-sm text-amber-200/90" role="status">
          {collageHint}
        </p>
      )}

      <div
        className="sticky top-0 z-10 -mx-1 px-1 py-2 mb-3 sm:mb-4 flex flex-nowrap gap-2 overflow-x-auto [scrollbar-width:thin] bg-[color:var(--bg-main)]/92 backdrop-blur-sm"
        role="group"
        aria-label={t('viral.filter_label')}
      >
        {CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={category === value}
            onClick={() => onCategory(value)}
            className={`shrink-0 ${category === value ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE}`}
          >
            {t(`viral.filter_${value}`)}
          </button>
        ))}
      </div>

      <ul
        className={
          compact
            ? 'grid gap-3 sm:gap-4 list-none p-0 m-0 grid-cols-1 sm:grid-cols-2'
            : 'flex gap-3 list-none p-0 m-0 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:thin] sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 sm:gap-4'
        }
      >
        {visibleEntries.map((entry, index) => {
          const inCollage = collageIds.includes(entry.id);
          return (
            <li
              key={entry.id}
              className={
                compact
                  ? 'theme-raised border theme-border rounded-2xl overflow-hidden flex flex-col'
                  : 'theme-raised border theme-border rounded-2xl overflow-hidden flex flex-col min-w-[min(72vw,260px)] snap-start sm:min-w-0'
              }
            >
              <img
                src={publicAssetUrl(entry.thumbnail)}
                alt={t(entry.thumbnailAltKey)}
                className="w-full aspect-[4/3] object-cover bg-black/30"
                loading={index < 4 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <div className="flex flex-col gap-1.5 p-3.5 sm:p-4 flex-1">
                <h3 className="text-sm sm:text-base font-semibold theme-ink leading-snug">
                  {t(entry.titleKey)}
                </h3>
                <p className="text-xs sm:text-sm theme-ink-muted line-clamp-2 sm:line-clamp-3 leading-relaxed">
                  {t(entry.descriptionKey)}
                </p>
                <div className="mt-auto flex flex-col gap-2 pt-2">
                  {collageMode ? (
                    <button
                      type="button"
                      data-testid={`viral-collage-toggle-${entry.id}`}
                      aria-pressed={inCollage}
                      onClick={() => onToggleCollage(entry.id)}
                      className="w-full rounded-xl brand-bg text-white font-semibold py-2.5 text-sm hover:opacity-95 transition-opacity cursor-pointer focus:outline-none focus-visible:brand-ring"
                    >
                      {inCollage ? t('viral.collage_remove') : t('viral.collage_add')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === entry.id}
                      data-testid={`viral-apply-${entry.id}`}
                      onClick={() => void onApply(entry.id)}
                      className="w-full rounded-xl brand-bg text-white font-semibold py-2.5 text-sm hover:opacity-95 transition-opacity cursor-pointer focus:outline-none focus-visible:brand-ring disabled:opacity-60"
                    >
                      {busyId === entry.id ? t('viral.applying') : t('viral.try_this')}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${UI_BTN_SECONDARY} w-full text-sm`}
                    onClick={async () => {
                      const url = remixUrlForTemplate(entry);
                      try {
                        await navigator.clipboard.writeText(url);
                      } catch {
                        window.prompt(t('viral.copy_link'), url);
                      }
                    }}
                  >
                    {t('viral.copy_remix')}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {collapseAll && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            data-testid="viral-show-more"
            onClick={() => setShowAll(true)}
            className={`${UI_BTN_SECONDARY} px-5 py-2.5 text-sm`}
          >
            {t('viral.show_more', { count: entries.length - ALL_PREVIEW_COUNT })}
          </button>
        </div>
      )}
    </section>
  );
};

export default ViralTemplatesSection;
