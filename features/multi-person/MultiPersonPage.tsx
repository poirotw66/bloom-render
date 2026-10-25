/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Multi-person viral synthesis UI (2–4 uploads + multi-person templates).
 */

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ApiKeyNotice from '../../components/ApiKeyNotice';
import CostEstimateBadge from '../../components/CostEstimateBadge';
import DemoModeBanner from '../../components/DemoModeBanner';
import ProgressIndicator from '../../components/ProgressIndicator';
import ResultActions from '../../components/ResultActions';
import VersionSwitcher from '../../components/VersionSwitcher';
import ViralTemplateBanner from '../../components/ViralTemplateBanner';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { publicAssetUrl } from '../../utils/publicAsset';
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
import { useMultiPerson } from './useMultiPerson';

const MultiPersonPage: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { isDemoMode } = useSettings();
  const mp = useMultiPerson();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = document.querySelector(`[data-testid="multi-person-template-${mp.templateId}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [mp.templateId]);

  return (
    <div className={`${UI_PAGE} ${getPageSurface(theme)}`} data-testid="multi-person-page">
      <div className="flex flex-col items-center gap-6 animate-fade-in w-full max-w-4xl mx-auto">
        <header className="flex flex-col items-center gap-2 text-center px-2">
          <h1 className={UI_TITLE}>
            {t('multi_person.title_part1')}{' '}
            <span className={getTitleAccent(theme)}>{t('multi_person.title_part2')}</span>
          </h1>
          <p className={UI_SUBTITLE}>{t('multi_person.subtitle')}</p>
          <Link
            to={ROUTES.COUPLE_GROUP}
            className="text-sm theme-ink-muted underline-offset-2 hover:underline"
          >
            {t('multi_person.link_couple_group')}
          </Link>
        </header>

        <ApiKeyNotice />
        <DemoModeBanner />

        {mp.templateId && (
          <ViralTemplateBanner
            templateId={mp.templateId}
            hintKey="viral.upload_for_template"
            testId="viral-template-banner-multiperson"
          />
        )}

        {!mp.providerOk && (
          <p className="text-sm text-amber-200/90 text-center px-3" role="status">
            {t('multi_person.error_provider')}
          </p>
        )}

        <section
          className="w-full theme-raised border theme-border rounded-2xl p-4 sm:p-5 flex flex-col gap-3"
          data-testid="multi-person-upload"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold theme-ink">
              {t('multi_person.upload_title', {
                min: String(mp.min),
                max: String(mp.max),
              })}
            </h2>
            <p className="text-sm theme-ink-muted">
              {t('multi_person.upload_count', { count: String(mp.files.length) })}
            </p>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 list-none p-0 m-0">
            {Array.from({ length: mp.max }).map((_, index) => {
              const url = mp.previewUrls[index];
              return (
                <li
                  key={index}
                  className="aspect-[3/4] rounded-xl border theme-border bg-black/20 overflow-hidden flex flex-col"
                >
                  {url ? (
                    <>
                      <img
                        src={url}
                        alt={t('multi_person.slot_alt', { n: String(index + 1) })}
                        className="w-full flex-1 object-cover min-h-0"
                      />
                      <div className="flex gap-1 p-1.5">
                        <button
                          type="button"
                          className={`${UI_BTN_SECONDARY} flex-1 text-xs py-1`}
                          disabled={index === 0 || isDemoMode}
                          onClick={() => mp.move(index, -1)}
                          aria-label={t('multi_person.move_left')}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          className={`${UI_BTN_SECONDARY} flex-1 text-xs py-1`}
                          disabled={isDemoMode}
                          onClick={() => mp.removeAt(index)}
                          aria-label={t('multi_person.remove')}
                        >
                          ✕
                        </button>
                        <button
                          type="button"
                          className={`${UI_BTN_SECONDARY} flex-1 text-xs py-1`}
                          disabled={index >= mp.files.length - 1 || isDemoMode}
                          onClick={() => mp.move(index, 1)}
                          aria-label={t('multi_person.move_right')}
                        >
                          →
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="flex-1 text-sm theme-ink-muted hover:theme-ink"
                      disabled={isDemoMode || mp.files.length >= mp.max}
                      onClick={() => inputRef.current?.click()}
                    >
                      {t('multi_person.add_slot', { n: String(index + 1) })}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {!isDemoMode && mp.files.length < mp.max && (
            <button
              type="button"
              className={`${UI_BTN_SECONDARY} self-center`}
              data-testid="multi-person-add"
              onClick={() => inputRef.current?.click()}
            >
              {t('multi_person.add_photos')}
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            data-testid="multi-person-file"
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              if (list.length) mp.addFiles(list);
              e.target.value = '';
            }}
          />
        </section>

        <section className="w-full flex flex-col gap-3" data-testid="multi-person-templates">
          <h2 className="text-base font-semibold theme-ink text-center">
            {t('multi_person.template_title')}
          </h2>
          <ul className="flex gap-3 overflow-x-auto snap-x pb-2 sm:grid sm:grid-cols-3 list-none p-0 m-0">
            {mp.templates.map((entry) => {
              const active = entry.id === mp.templateId;
              return (
                <li
                  key={entry.id}
                  className="min-w-[min(68vw,200px)] snap-start sm:min-w-0 theme-raised border theme-border rounded-xl overflow-hidden flex flex-col"
                >
                  <img
                    src={publicAssetUrl(entry.thumbnail)}
                    alt={t(entry.thumbnailAltKey)}
                    className="w-full aspect-[4/3] object-cover"
                    loading="lazy"
                  />
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <p className="text-sm font-semibold theme-ink line-clamp-2">
                      {t(entry.titleKey)}
                    </p>
                    <button
                      type="button"
                      data-testid={`multi-person-template-${entry.id}`}
                      className={active ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE}
                      aria-pressed={active}
                      onClick={() => mp.setTemplateId(entry.id)}
                    >
                      {active ? t('multi_person.selected') : t('multi_person.select')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <CostEstimateBadge quantity={1} />
          <button
            type="button"
            data-testid="multi-person-generate"
            className={UI_BTN_PRIMARY}
            disabled={!mp.canGenerate}
            onClick={() => void mp.generate()}
          >
            {mp.loading ? t('multi_person.generating') : t('multi_person.generate')}
          </button>
        </div>

        {mp.error && (
          <p className="text-sm text-red-300 text-center" role="alert">
            {mp.error}
          </p>
        )}

        {mp.loading && (
          <ProgressIndicator progress={mp.progress} statusMessages={[t('multi_person.progress')]} />
        )}

        {mp.resultUrl && (
          <section
            className="w-full flex flex-col gap-4 items-center"
            data-testid="multi-person-result"
          >
            <h2 className="text-base font-semibold theme-ink">{t('multi_person.result_title')}</h2>
            <VersionSwitcher
              count={mp.versions.length}
              activeIndex={mp.activeVersion}
              onSelect={mp.selectVersion}
              titleKey="multi_person.versions_title"
              versionKey="multi_person.version_n"
              testId="multi-person-versions"
            />
            <div className="relative w-full max-w-xl">
              <img
                src={mp.resultUrl}
                alt={t('multi_person.result_alt')}
                className="w-full rounded-xl border theme-border"
                data-testid="multi-person-result-img"
              />
              {isDemoMode && (
                <span
                  className="absolute top-2 left-2 z-10 inline-flex items-center rounded-md bg-sky-500/90 px-2 py-0.5 text-xs font-semibold text-white"
                  data-testid="multi-person-result-demo-label"
                >
                  {t('demo.result_label')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <CostEstimateBadge quantity={1} />
              <button
                type="button"
                data-testid="multi-person-regenerate"
                className={UI_BTN_SECONDARY}
                disabled={!mp.canRegenerate}
                onClick={() => void mp.regenerate()}
              >
                {t('multi_person.regenerate')}
              </button>
            </div>
            <ResultActions
              result={mp.resultUrl}
              fileBaseName="bloomrender-multi-person"
              originalUrl={mp.previewUrls[0] ?? null}
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default MultiPersonPage;
