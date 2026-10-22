/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Old photo restoration + optional colorize + optional local 2× upscale.
 */

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import ApiKeyNotice from '../../components/ApiKeyNotice';
import DemoModeBanner from '../../components/DemoModeBanner';
import ExampleShowcase from '../../components/ExampleShowcase';
import GenericUploadSection from '../../components/GenericUploadSection';
import GenericResult from '../../components/GenericResult';
import ProgressIndicator from '../../components/ProgressIndicator';
import { useRestore } from './useRestore';
import {
  UI_BTN_SECONDARY,
  UI_OPTION_ACTIVE,
  UI_OPTION_INACTIVE,
  UI_PAGE,
  UI_SUBTITLE,
  UI_TITLE,
  getPageSurface,
  getTitleAccent,
} from '../../utils/uiClasses';

interface RestorePageProps {
  onImageSelected: (file: File) => void;
}

export type RestoreLocationState = {
  restorePreset?: { colorize?: boolean };
};

const RestorePage: React.FC<RestorePageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const location = useLocation();
  const restore = useRestore();

  useEffect(() => {
    const preset = (location.state as RestoreLocationState | null)?.restorePreset;
    if (!preset) return;
    if (typeof preset.colorize === 'boolean') restore.setColorize(preset.colorize);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once from navigation state
  }, [location.state]);

  const isEmptyState = !restore.result && !restore.loading;

  return (
    <div className={`${UI_PAGE} ${getPageSurface(theme)}`} data-testid="restore-page">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className={UI_TITLE}>
          <span className={getTitleAccent(theme)}>{t('restore.title')}</span>
        </h1>
        <p className={UI_SUBTITLE}>{t('restore.subtitle')}</p>

        <ApiKeyNotice />
        <DemoModeBanner />

        {restore.result ? (
          <div className="w-full flex flex-col gap-6">
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={restore.clearResult} className={UI_BTN_SECONDARY}>
                {t('restore.generate_again')}
              </button>
            </div>
            <GenericResult
              result={restore.result}
              originalUrl={restore.previewUrl}
              onAgain={restore.clearResult}
              onEditInEditor={() =>
                onImageSelected(dataURLtoFile(restore.result!, 'restore-export.png'))
              }
              fileBaseName="old-photo-restore"
              editKey="restore.edit"
              againKey="restore.generate_again"
              paramsTitleKey="restore.params_title"
              params={[
                {
                  labelKey: 'restore.colorize_label',
                  value: restore.colorize ? t('restore.colorize_on') : t('restore.colorize_off'),
                },
                {
                  labelKey: 'restore.upscale_label',
                  value: restore.upscaleAfter ? t('restore.upscale_on') : t('restore.upscale_off'),
                },
              ]}
              remixUrl={restore.remixUrl}
            />
          </div>
        ) : restore.loading ? (
          <ProgressIndicator
            progress={restore.progress}
            statusMessages={[
              restore.upscaling ? t('restore.progress_upscale') : t('restore.progress_restore'),
            ]}
          />
        ) : (
          <>
            <div className="w-full max-w-xl flex flex-col gap-3 text-left">
              <p className="text-sm font-medium theme-ink-soft">{t('restore.options_heading')}</p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t('restore.colorize_label')}
              >
                <button
                  type="button"
                  aria-pressed={restore.colorize}
                  data-testid="restore-colorize-on"
                  onClick={() => restore.setColorize(true)}
                  className={restore.colorize ? UI_OPTION_ACTIVE : UI_OPTION_INACTIVE}
                >
                  {t('restore.colorize_on')}
                </button>
                <button
                  type="button"
                  aria-pressed={!restore.colorize}
                  data-testid="restore-colorize-off"
                  onClick={() => restore.setColorize(false)}
                  className={!restore.colorize ? UI_OPTION_ACTIVE : UI_OPTION_INACTIVE}
                >
                  {t('restore.colorize_off')}
                </button>
              </div>
              <label className="flex items-start gap-3 text-sm theme-ink-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={restore.upscaleAfter}
                  data-testid="restore-upscale-toggle"
                  onChange={(e) => restore.setUpscaleAfter(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium theme-ink-soft block">
                    {t('restore.upscale_label')}
                  </span>
                  {t('restore.upscale_hint')}
                </span>
              </label>
            </div>

            <GenericUploadSection
              previewUrl={restore.previewUrl}
              error={restore.error}
              loading={restore.loading}
              isDraggingOver={restore.isDraggingOver}
              onFileChange={restore.handleFileChange}
              onGenerate={() => void restore.handleGenerate()}
              onDragOver={(e) => {
                e.preventDefault();
                restore.setIsDraggingOver(true);
              }}
              onDragLeave={() => restore.setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                restore.setIsDraggingOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) {
                  restore.setFile(f);
                  restore.clearResult();
                }
              }}
              uploadHintKey="restore.upload_hint"
              generateButtonKey="restore.generate_btn"
              changePhotoKey="restore.change_photo"
              uploadInputId="restore-image-upload"
              canGenerate={Boolean(restore.file)}
            />
          </>
        )}

        {isEmptyState && <ExampleShowcase feature="restore" />}
      </div>
    </div>
  );
};

export default RestorePage;
