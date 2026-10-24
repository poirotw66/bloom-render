/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * One photo → 4–6 viral styles → labeled collage PNG.
 */

import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import ApiKeyNotice from '../../components/ApiKeyNotice';
import CostEstimateBadge from '../../components/CostEstimateBadge';
import DemoModeBanner from '../../components/DemoModeBanner';
import ProgressIndicator from '../../components/ProgressIndicator';
import ResultActions from '../../components/ResultActions';
import VersionSwitcher from '../../components/VersionSwitcher';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { publicAssetUrl } from '../../utils/publicAsset';
import type { StyleCollageLayoutMode } from '../../utils/styleCollageLayout';
import {
  UI_BTN_PRIMARY,
  UI_BTN_SECONDARY,
  UI_CHIP_ACTIVE,
  UI_CHIP_INACTIVE,
  UI_PAGE,
  UI_SUBTITLE,
  UI_TITLE,
  getPageSurface,
  getTitleAccent,
} from '../../utils/uiClasses';
import { useStyleCollage } from './useStyleCollage';

const LAYOUT_MODES: StyleCollageLayoutMode[] = ['grid', 'banner', 'story'];

const StyleCollagePage: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { isDemoMode } = useSettings();
  const collage = useStyleCollage();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`${UI_PAGE} ${getPageSurface(theme)}`} data-testid="style-collage-page">
      <div className="flex flex-col items-center gap-6 animate-fade-in w-full max-w-5xl mx-auto">
        <header className="flex flex-col items-center gap-2 text-center px-2">
          <h1 className={UI_TITLE}>
            {t('style_collage.title_part1')}{' '}
            <span className={getTitleAccent(theme)}>{t('style_collage.title_part2')}</span>
          </h1>
          <p className={UI_SUBTITLE}>{t('style_collage.subtitle')}</p>
          <Link
            to={ROUTES.HOME}
            className="text-sm theme-ink-muted underline-offset-2 hover:underline"
          >
            {t('style_collage.back_viral')}
          </Link>
        </header>

        <ApiKeyNotice />
        <DemoModeBanner />

        <section className="w-full theme-raised border theme-border rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
          <h2 className="text-base font-semibold theme-ink">{t('style_collage.upload_title')}</h2>
          {collage.previewUrl ? (
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <img
                src={collage.previewUrl}
                alt={t('style_collage.upload_alt')}
                className="w-40 h-40 object-cover rounded-xl border theme-border"
              />
              {!isDemoMode && (
                <button
                  type="button"
                  className={UI_BTN_SECONDARY}
                  onClick={() => inputRef.current?.click()}
                >
                  {t('style_collage.change_photo')}
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              className={`${UI_BTN_PRIMARY} w-full sm:w-auto`}
              onClick={() => inputRef.current?.click()}
              disabled={isDemoMode}
            >
              {t('style_collage.choose_photo')}
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            data-testid="style-collage-file"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              collage.onFileChange(file);
              e.target.value = '';
            }}
          />
        </section>

        <section
          className="w-full flex flex-col gap-3"
          data-testid="style-collage-select"
          aria-label={t('style_collage.select_label')}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold theme-ink">
              {t('style_collage.select_title', {
                min: String(collage.min),
                max: String(collage.max),
              })}
            </h2>
            <p className="text-sm theme-ink-muted" data-testid="style-collage-count">
              {t('style_collage.selected_count', { count: String(collage.selectedIds.length) })}
            </p>
          </div>
          {collage.selectHint && (
            <p className="text-sm text-amber-200/90" role="status">
              {collage.selectHint}
            </p>
          )}
          <ul className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:overflow-visible list-none p-0 m-0">
            {collage.templates.map((entry) => {
              const selected = collage.selectedIds.includes(entry.id);
              return (
                <li
                  key={entry.id}
                  className="min-w-[min(70vw,220px)] snap-start sm:min-w-0 theme-raised border theme-border rounded-xl overflow-hidden flex flex-col"
                >
                  <img
                    src={publicAssetUrl(entry.thumbnail)}
                    alt={t(entry.thumbnailAltKey)}
                    className="w-full aspect-[4/3] object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <p className="text-sm font-semibold theme-ink line-clamp-2">
                      {t(entry.titleKey)}
                    </p>
                    <button
                      type="button"
                      data-testid={`style-collage-toggle-${entry.id}`}
                      aria-pressed={selected}
                      className={selected ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE}
                      onClick={() => collage.toggleId(entry.id)}
                    >
                      {selected ? t('style_collage.remove') : t('style_collage.add')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <section
            className="theme-raised border theme-border rounded-xl p-3 sm:p-4 flex flex-col gap-3"
            data-testid="style-collage-layout"
          >
            <h3 className="text-sm font-semibold theme-ink">{t('style_collage.layout_title')}</h3>
            <div className="flex flex-wrap gap-2">
              {LAYOUT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  data-testid={`style-collage-layout-${mode}`}
                  aria-pressed={collage.layoutMode === mode}
                  className={collage.layoutMode === mode ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE}
                  onClick={() => collage.setLayoutMode(mode)}
                >
                  {t(`style_collage.layout_${mode === 'grid' ? 'grid' : mode}`)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-sm theme-ink">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={collage.showLabels}
                  onChange={(e) => collage.setShowLabels(e.target.checked)}
                />
                {t('style_collage.opt_labels')}
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={collage.showBorder}
                  onChange={(e) => collage.setShowBorder(e.target.checked)}
                />
                {t('style_collage.opt_border')}
              </label>
              <label className="inline-flex items-center gap-2">
                {t('style_collage.gap_label')}
                <input
                  type="range"
                  min={8}
                  max={32}
                  step={4}
                  value={collage.gap}
                  onChange={(e) => collage.setGap(Number(e.target.value))}
                  aria-label={t('style_collage.gap_label')}
                />
              </label>
              <label className="inline-flex items-center gap-2">
                {t('style_collage.format_label')}
                <select
                  value={collage.exportFormat}
                  onChange={(e) =>
                    collage.setExportFormat(e.target.value === 'jpeg' ? 'jpeg' : 'png')
                  }
                  className="theme-raised border theme-border rounded-lg px-2 py-1"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPG</option>
                </select>
              </label>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3 justify-center pt-1">
            <CostEstimateBadge quantity={collage.selectedIds.length || collage.min} />
            <button
              type="button"
              className={UI_BTN_SECONDARY}
              onClick={collage.clearSelection}
              disabled={collage.selectedIds.length === 0 || collage.loading}
            >
              {t('style_collage.clear')}
            </button>
            <button
              type="button"
              data-testid="style-collage-generate"
              className={UI_BTN_PRIMARY}
              disabled={!collage.canGenerate}
              onClick={() => void collage.generateAll()}
            >
              {collage.loading ? t('style_collage.generating') : t('style_collage.generate')}
            </button>
          </div>
        </section>

        {collage.error && (
          <p className="text-sm text-red-300 text-center" role="alert">
            {collage.error}
          </p>
        )}

        {collage.loading && (
          <ProgressIndicator
            progress={collage.progress}
            statusMessages={[
              t('style_collage.progress', {
                done: String(collage.completed),
                total: String(collage.selectedIds.length),
              }),
            ]}
          />
        )}

        {collage.slots.length > 0 && (
          <section className="w-full flex flex-col gap-4" data-testid="style-collage-slots">
            <h2 className="text-base font-semibold theme-ink text-center">
              {t('style_collage.tiles_title')}
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 list-none p-0 m-0">
              {collage.slots.map((slot, index) => (
                <li
                  key={slot.templateId}
                  className="theme-raised border theme-border rounded-xl overflow-hidden flex flex-col"
                >
                  {slot.resultUrl ? (
                    <div className="relative w-full aspect-square">
                      <img
                        src={slot.resultUrl}
                        alt={t(slot.template.titleKey)}
                        className="w-full h-full object-cover"
                        data-testid={`style-collage-slot-img-${slot.templateId}`}
                      />
                      {isDemoMode && (
                        <span
                          className="absolute top-1.5 left-1.5 z-10 inline-flex items-center rounded-md bg-sky-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                          data-testid={`style-collage-demo-label-${slot.templateId}`}
                        >
                          {t('demo.result_label')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-black/30 flex items-center justify-center text-xs theme-ink-muted px-2 text-center">
                      {slot.error || t('style_collage.pending')}
                    </div>
                  )}
                  <div className="p-2.5 flex flex-col gap-2">
                    <p className="text-xs font-semibold theme-ink line-clamp-2">
                      {t(slot.template.titleKey)}
                    </p>
                    {slot.error && (
                      <button
                        type="button"
                        className={`${UI_BTN_SECONDARY} text-xs py-1.5`}
                        data-testid={`style-collage-retry-${slot.templateId}`}
                        disabled={collage.loading}
                        onClick={() => void collage.retrySlot(index)}
                      >
                        {t('style_collage.retry')}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {collage.collageUrl && (
          <section
            className="w-full flex flex-col gap-4 items-center"
            data-testid="style-collage-result"
          >
            <h2 className="text-base font-semibold theme-ink">{t('style_collage.result_title')}</h2>
            <VersionSwitcher
              count={collage.versions.length}
              activeIndex={collage.activeVersion}
              onSelect={collage.selectVersion}
            />
            <div className="relative w-full max-w-3xl">
              <img
                src={collage.collageUrl}
                alt={t('style_collage.result_alt')}
                className="w-full rounded-xl border theme-border"
              />
              {isDemoMode && (
                <span
                  className="absolute top-2 left-2 z-10 inline-flex items-center rounded-md bg-sky-500/90 px-2 py-0.5 text-xs font-semibold text-white"
                  data-testid="style-collage-result-demo-label"
                >
                  {t('demo.result_label')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <CostEstimateBadge quantity={collage.selectedIds.length || collage.min} />
              <button
                type="button"
                data-testid="style-collage-regenerate"
                className={UI_BTN_SECONDARY}
                disabled={!collage.canRegenerate}
                onClick={() => void collage.regenerate()}
              >
                {t('style_collage.regenerate')}
              </button>
            </div>
            <ResultActions
              result={collage.collageUrl}
              fileBaseName="bloomrender-style-collage"
              originalUrl={collage.previewUrl}
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default StyleCollagePage;
