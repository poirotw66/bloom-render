/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Discoverable viral “玩法” template picker (landing + generate).
 * Taste PRESERVE: keep theme hues; tighten rhythm, chips, and card density.
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getViralTemplateCardById,
  VIRAL_TEMPLATE_CARDS,
  type ViralTemplateCard,
  type ViralTemplateCategory,
} from '../constants/viralTemplateCards';
import { ROUTES } from '../constants/routes';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { publicAssetUrl } from '../utils/publicAsset';
import { buildRemixUrl } from '../utils/remixLink';
import {
  canStartStyleCollage,
  STYLE_COLLAGE_MAX,
  toggleViralSelection,
} from '../utils/viralSelection';
import {
  clearViralFavorites,
  clearViralRecent,
  getViralFavorites,
  getViralRecent,
  toggleViralFavorite,
  pushViralRecent,
} from '../utils/viralFavorites';
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
  'holiday',
  'pet',
];

/** When viewing “all” on desktop grid, collapse to avoid a tall wall. */
const ALL_PREVIEW_COUNT = 8;

interface ViralTemplatesSectionProps {
  className?: string;
  presentation?: 'default' | 'home';
  /** Compact layout for generate / travel feature pages. */
  compact?: boolean;
  /** Optional starting category filter (e.g. Taiwan scenes on Travel). */
  initialCategory?: ViralTemplateCategory | 'all';
}

const ViralTemplatesSection: React.FC<ViralTemplatesSectionProps> = ({
  className = '',
  presentation = 'default',
  compact = false,
  initialCategory = 'all',
}) => {
  const { t } = useLanguage();
  const { isDemoMode } = useSettings();
  const navigate = useNavigate();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(initialCategory);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [collageMode, setCollageMode] = useState(false);
  const [collageIds, setCollageIds] = useState<string[]>([]);
  const [collageHint, setCollageHint] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => getViralFavorites());
  const [recent, setRecent] = useState<string[]>(() => getViralRecent());
  const [shelf, setShelf] = useState<'none' | 'favorites' | 'recent'>('none');

  const baseEntries =
    category === 'all'
      ? VIRAL_TEMPLATE_CARDS
      : VIRAL_TEMPLATE_CARDS.filter((entry) => entry.category === category);
  const shelfIds = shelf === 'favorites' ? favorites : shelf === 'recent' ? recent : null;
  const entries =
    shelfIds === null
      ? baseEntries
      : shelfIds
          .map((id) => getViralTemplateCardById(id))
          .filter((e): e is ViralTemplateCard => Boolean(e))
          .filter((e) => category === 'all' || e.category === category);

  const home = presentation === 'home';
  const [phone, setPhone] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)');
    const update = () => setPhone(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const previewCount = home ? (phone ? 3 : 4) : ALL_PREVIEW_COUNT;
  const collapseAll = !compact && category === 'all' && !showAll && entries.length > previewCount;
  const visibleEntries = collapseAll ? entries.slice(0, previewCount) : entries;

  const onApply = async (id: string) => {
    const template = getViralTemplateCardById(id);
    if (!template) return;
    setBusyId(id);
    try {
      pushViralRecent(id);
      setRecent(getViralRecent());
      const { applyViralTemplate } = await import('../utils/applyViralTemplate');
      await applyViralTemplate(template, navigate, { demoMode: isDemoMode });
    } finally {
      setBusyId(null);
    }
  };

  const onCategory = (value: (typeof CATEGORIES)[number]) => {
    setCategory(value);
    setShowAll(false);
    setCopiedId(null);
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

  if (home)
    return (
      <section
        id="styles"
        className={`home-section home-styles ${showAll || visibleEntries.length > previewCount || collageMode ? 'home-styles--expanded' : ''}`}
        aria-labelledby="viral-templates-heading"
        data-testid="viral-templates"
      >
        <div className="wrap home-wrap">
          <div className="home-section__head">
            <h2 id="viral-templates-heading">{t('home.styles_title')}</h2>
            <p>{t('home.styles_intro')}</p>
          </div>
          <div className="home-library-bar">
            <div className="home-categories" role="group" aria-label={t('viral.filter_label')}>
              {CATEGORIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  data-testid={`viral-category-${value}`}
                  aria-pressed={category === value}
                  onClick={() => onCategory(value)}
                >
                  {t(`viral.filter_${value}`)}
                </button>
              ))}
            </div>
            <label className="home-category-select">
              {t('home.choose_category')}
              <select
                value={category}
                onChange={(event) => onCategory(event.target.value as typeof category)}
              >
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {t(`viral.filter_${value}`)}
                  </option>
                ))}
              </select>
            </label>
            <details className="home-library-tools" data-testid="viral-library-tools">
              <summary>
                {t(
                  shelf === 'favorites'
                    ? 'viral.favorites_title'
                    : shelf === 'recent'
                      ? 'viral.recent_title'
                      : 'home.library_tools',
                )}{' '}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 2v12M2 8h12" />
                </svg>
              </summary>
              <div
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('button, a'))
                    event.currentTarget.closest('details')?.removeAttribute('open');
                }}
              >
                <button
                  type="button"
                  data-testid="viral-shelf-favorites"
                  aria-pressed={shelf === 'favorites'}
                  onClick={() => setShelf((v) => (v === 'favorites' ? 'none' : 'favorites'))}
                >
                  {t('viral.favorites_title')}
                </button>
                <button
                  type="button"
                  data-testid="viral-shelf-recent"
                  aria-pressed={shelf === 'recent'}
                  onClick={() => {
                    setRecent(getViralRecent());
                    setShelf((v) => (v === 'recent' ? 'none' : 'recent'));
                  }}
                >
                  {t('viral.recent_title')}
                </button>
                <button
                  type="button"
                  data-testid="viral-collage-mode"
                  aria-pressed={collageMode}
                  onClick={() => {
                    setCollageMode((v) => !v);
                    setCollageHint(null);
                    if (collageMode) setCollageIds([]);
                  }}
                >
                  {collageMode ? t('viral.collage_mode_on') : t('viral.collage_mode')}
                </button>
                {shelf === 'favorites' && favorites.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearViralFavorites();
                      setFavorites([]);
                    }}
                  >
                    {t('viral.favorites_clear')}
                  </button>
                )}
                {shelf === 'recent' && recent.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearViralRecent();
                      setRecent([]);
                    }}
                  >
                    {t('viral.recent_clear')}
                  </button>
                )}
                <Link to={ROUTES.STYLE_COLLAGE} data-testid="viral-open-collage">
                  {t('viral.open_collage')}
                </Link>
                <Link to={ROUTES.MULTI_PERSON} data-testid="viral-open-multi-person">
                  {t('viral.open_multi_person')}
                </Link>
              </div>
            </details>
          </div>
          {collageMode && (
            <div className="home-collage-actions">
              <p>{t('home.collage_hint')}</p>
              <button
                type="button"
                className="btn btn--primary"
                data-testid="viral-collage-start"
                disabled={!canStartStyleCollage(collageIds.length)}
                onClick={openCollage}
              >
                {t('viral.collage_start', { count: String(collageIds.length) })}
              </button>
            </div>
          )}
          {collageHint && <p role="status">{collageHint}</p>}
          <ul className="home-style-grid">
            {visibleEntries.map((entry) => (
              <li key={entry.id} className="home-style-card card">
                <div className="home-style-card__picture">
                  <img
                    src={publicAssetUrl(entry.thumbnail)}
                    alt={t(entry.thumbnailAltKey)}
                    loading="lazy"
                    decoding="async"
                    width="480"
                    height="360"
                    data-source="BloomRender"
                    data-subject={entry.id}
                  />
                  <div className="home-style-card__quick">
                    <button
                      type="button"
                      data-testid={`viral-favorite-${entry.id}`}
                      aria-pressed={favorites.includes(entry.id)}
                      aria-label={
                        favorites.includes(entry.id)
                          ? t('viral.favorite_remove')
                          : t('viral.favorite_add')
                      }
                      onClick={() => setFavorites(toggleViralFavorite(entry.id))}
                    >
                      {favorites.includes(entry.id) ? '♥' : '♡'}
                    </button>
                    <button
                      type="button"
                      aria-label={t(
                        copiedId === entry.id ? 'viral.remix_copied' : 'viral.copy_remix',
                      )}
                      title={t(copiedId === entry.id ? 'viral.remix_copied' : 'viral.copy_remix')}
                      onClick={async () => {
                        const url = buildRemixUrl({ v: 1, id: entry.id });
                        try {
                          await navigator.clipboard.writeText(url);
                          setCopiedId(entry.id);
                        } catch {
                          window.prompt(t('viral.copy_link'), url);
                        }
                      }}
                    >
                      {copiedId === entry.id ? (
                        <span aria-hidden="true">✓</span>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden="true"
                        >
                          <rect x="8" y="8" width="12" height="12" rx="2" />
                          <path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="home-style-card__body">
                  <h3>{t(entry.titleKey)}</h3>
                  {collageMode ? (
                    <button
                      type="button"
                      data-testid={`viral-collage-toggle-${entry.id}`}
                      aria-pressed={collageIds.includes(entry.id)}
                      onClick={() => onToggleCollage(entry.id)}
                    >
                      {collageIds.includes(entry.id)
                        ? t('viral.collage_remove')
                        : t('viral.collage_add')}{' '}
                      <span aria-hidden="true">+</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid={`viral-apply-${entry.id}`}
                      disabled={busyId === entry.id}
                      onClick={() => void onApply(entry.id)}
                    >
                      {busyId === entry.id ? t('viral.applying') : t('viral.try_this')}{' '}
                      <span aria-hidden="true">↗</span>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {entries.length === 0 && (
            <p className="home-library-empty" role="status">
              {t('home.empty_shelf')}
            </p>
          )}
          {collapseAll && (
            <button
              type="button"
              className="home-show-more link"
              data-testid="viral-show-more"
              onClick={() => setShowAll(true)}
            >
              {t('viral.show_more', { count: entries.length - previewCount })}{' '}
              <span aria-hidden="true">↓</span>
            </button>
          )}
        </div>
      </section>
    );

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
        <div className="mb-3 flex flex-wrap gap-2" data-testid="viral-shelves">
          <button
            type="button"
            data-testid="viral-shelf-favorites"
            aria-pressed={shelf === 'favorites'}
            className={shelf === 'favorites' ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE}
            onClick={() => setShelf((v) => (v === 'favorites' ? 'none' : 'favorites'))}
          >
            {t('viral.favorites_title')}
          </button>
          <button
            type="button"
            data-testid="viral-shelf-recent"
            aria-pressed={shelf === 'recent'}
            className={shelf === 'recent' ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE}
            onClick={() => {
              setRecent(getViralRecent());
              setShelf((v) => (v === 'recent' ? 'none' : 'recent'));
            }}
          >
            {t('viral.recent_title')}
          </button>
          {shelf === 'favorites' && favorites.length > 0 && (
            <button
              type="button"
              className={`${UI_BTN_SECONDARY} text-sm`}
              onClick={() => {
                clearViralFavorites();
                setFavorites([]);
              }}
            >
              {t('viral.favorites_clear')}
            </button>
          )}
          {shelf === 'recent' && recent.length > 0 && (
            <button
              type="button"
              className={`${UI_BTN_SECONDARY} text-sm`}
              onClick={() => {
                clearViralRecent();
                setRecent([]);
              }}
            >
              {t('viral.recent_clear')}
            </button>
          )}
        </div>
      )}

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
            data-testid={`viral-category-${value}`}
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
                  <button
                    type="button"
                    data-testid={`viral-favorite-${entry.id}`}
                    aria-pressed={favorites.includes(entry.id)}
                    aria-label={
                      favorites.includes(entry.id)
                        ? t('viral.favorite_remove')
                        : t('viral.favorite_add')
                    }
                    className={`${UI_BTN_SECONDARY} w-full text-sm`}
                    onClick={() => setFavorites(toggleViralFavorite(entry.id))}
                  >
                    {favorites.includes(entry.id)
                      ? '♥ ' + t('viral.favorite_remove')
                      : '♡ ' + t('viral.favorite_add')}
                  </button>
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
                      const url = buildRemixUrl({ v: 1, id: entry.id });
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
