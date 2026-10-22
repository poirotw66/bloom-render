/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * In-browser background removal and 2× upscaling — no API key.
 */

import React from 'react';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import GenericUploadSection from '../../components/GenericUploadSection';
import GenericResult from '../../components/GenericResult';
import ProgressIndicator from '../../components/ProgressIndicator';
import { LOCAL_ENHANCE_MODELS } from '../../services/localEnhance';
import { useEnhance } from './useEnhance';
import {
  UI_PAGE,
  UI_SUBTITLE,
  UI_TITLE,
  getPageSurface,
  getTitleAccent,
} from '../../utils/uiClasses';

interface EnhancePageProps {
  onImageSelected: (file: File) => void;
}

const EnhancePage: React.FC<EnhancePageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const enhance = useEnhance();

  return (
    <div className={`${UI_PAGE} ${getPageSurface(theme)}`}>
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className={UI_TITLE}>
          <span className={getTitleAccent(theme)}>{t('enhance.title')}</span>
        </h1>
        <p className={UI_SUBTITLE}>{t('enhance.subtitle')}</p>

        <p className="text-sm text-gray-400 text-center max-w-xl">
          {t('enhance.no_api_key_banner')}
        </p>

        <div className="w-full max-w-xl rounded-xl border border-gray-700/60 bg-gray-900/40 p-4 text-left text-xs text-gray-400 space-y-2">
          <p className="font-semibold text-gray-300">{t('enhance.models_heading')}</p>
          <ul className="list-disc pl-5 space-y-1">
            {LOCAL_ENHANCE_MODELS.map((m) => (
              <li key={m.modelId}>
                <a
                  href={m.modelCardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline"
                >
                  {m.label}
                </a>
                {' — '}
                {t('enhance.model_meta', {
                  size: String(m.approxSizeMb),
                  license: m.license,
                })}
              </li>
            ))}
          </ul>
          <p>{t('enhance.models_cache_note')}</p>
        </div>

        {enhance.result ? (
          <GenericResult
            result={enhance.result}
            originalUrl={enhance.previewUrl}
            onAgain={enhance.clearResult}
            onEditInEditor={() =>
              onImageSelected(dataURLtoFile(enhance.result!, 'enhance-export.png'))
            }
            fileBaseName="local-enhance"
            editKey="enhance.edit"
            againKey="enhance.again"
            paramsTitleKey="enhance.result_params"
            params={[
              {
                labelKey: 'enhance.task_label',
                value: t(enhance.task === 'remove-bg' ? 'enhance.remove_bg' : 'enhance.upscale_2x'),
              },
            ]}
          />
        ) : enhance.loading ? (
          <ProgressIndicator
            progress={enhance.progress?.percent}
            statusMessages={[enhance.progress?.statusKey || 'enhance.status_running']}
            currentStatusIndex={0}
          />
        ) : (
          <div className="w-full max-w-xl flex flex-col gap-4">
            <fieldset className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-200">
              <legend className="sr-only">{t('enhance.task_label')}</legend>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="enhance-task"
                  checked={enhance.task === 'remove-bg'}
                  onChange={() => enhance.setTask('remove-bg')}
                />
                {t('enhance.remove_bg')}
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="enhance-task"
                  checked={enhance.task === 'upscale-2x'}
                  onChange={() => enhance.setTask('upscale-2x')}
                />
                {t('enhance.upscale_2x')}
              </label>
            </fieldset>

            <GenericUploadSection
              previewUrl={enhance.previewUrl}
              error={enhance.error}
              loading={enhance.loading}
              isDraggingOver={enhance.isDraggingOver}
              onFileChange={enhance.handleFileChange}
              onGenerate={() => void enhance.handleRun()}
              onDragOver={enhance.handleDragOver}
              onDragLeave={enhance.handleDragLeave}
              onDrop={enhance.handleDrop}
              uploadHintKey="enhance.upload_hint"
              generateButtonKey="enhance.run"
              changePhotoKey="enhance.change_photo"
              icon=""
              canGenerate={Boolean(enhance.file)}
              uploadInputId="enhance-image-upload"
              showCostEstimate={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancePage;
