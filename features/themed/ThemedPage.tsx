/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import ProgressIndicator from '../../components/ProgressIndicator';
import { useThemed } from './useThemed';
import ThemedForm from './ThemedForm';
import ThemedUploadSection from './ThemedUploadSection';
import ThemedResult from './ThemedResult';
import QuantitySelector from '../../components/QuantitySelector';
import OutputSizeRatioSelector from '../../components/OutputSizeRatioSelector';
import GenerationFailureNotice from '../../components/GenerationFailureNotice';
import {
  UI_BTN_SECONDARY,
  UI_BTN_SUCCESS,
  UI_PAGE,
  UI_SUBTITLE,
  UI_TITLE,
  getPageSurface,
  getTitleAccent,
} from '../../utils/uiClasses';

interface ThemedPageProps {
  onImageSelected: (file: File) => void;
}

const ThemedPage: React.FC<ThemedPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const themed = useThemed();

  const handleEditInEditor = (result: string, index?: number) => {
    if (!result) return;
    const filename = index !== undefined ? `themed-${index + 1}.png` : 'themed-export.png';
    onImageSelected(dataURLtoFile(result, filename));
  };

  const resultCount = themed.themedResults?.length ?? 0;
  const hasMultipleResults = resultCount > 1;

  return (
    <div className={`${UI_PAGE} ${getPageSurface(theme)}`}>
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <header className="flex flex-col items-center gap-3">
          <h1 className={UI_TITLE}>
            <span className={getTitleAccent(theme)}>{t('themed.title')}</span>
          </h1>
          <p className={UI_SUBTITLE}>{t('themed.subtitle')}</p>
        </header>

        {themed.themedResults && themed.themedResults.length > 0 ? (
          <section className="w-full flex flex-col gap-6">
            <GenerationFailureNotice
              failures={themed.failures}
              requestedCount={themed.requestedCount}
              succeededCount={themed.succeededCount}
              isRetrying={themed.isRetrying}
              onRetry={themed.handleRetryFailed}
              context="themed"
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
              {hasMultipleResults && (
                <button
                  type="button"
                  onClick={themed.handleThemedBatchDownload}
                  className={UI_BTN_SUCCESS}
                >
                  💾 {t('history.batch_download')} ({resultCount})
                </button>
              )}
              <button type="button" onClick={themed.clearThemedResult} className={UI_BTN_SECONDARY}>
                {t('couple_group.again')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
              {themed.themedResults.map((result, idx) => (
                <ThemedResult
                  key={idx}
                  themedResult={result}
                  themeType={themed.themeType}
                  onDownload={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = `themed-${idx + 1}.png`;
                    link.click();
                  }}
                  onAgain={themed.clearThemedResult}
                  onEditInEditor={() => handleEditInEditor(result, idx)}
                />
              ))}
            </div>
          </section>
        ) : themed.themedResult ? (
          <ThemedResult
            themedResult={themed.themedResult}
            themeType={themed.themeType}
            onDownload={themed.handleThemedDownload}
            onAgain={themed.clearThemedResult}
            onEditInEditor={() => handleEditInEditor(themed.themedResult!)}
          />
        ) : themed.themedLoading ? (
          <ProgressIndicator progress={themed.progress} statusMessages={['themed.generating']} />
        ) : (
          <div className="w-full max-w-2xl mx-auto bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
            <ThemedForm
              themeType={themed.themeType}
              setThemeType={themed.setThemeType}
              disabled={themed.themedLoading}
            />
            <QuantitySelector
              quantity={themed.quantity}
              onChange={themed.setQuantity}
              disabled={themed.themedLoading}
            />
            <OutputSizeRatioSelector
              outputSize={themed.outputSize}
              aspectRatio={themed.aspectRatio}
              onOutputSizeChange={themed.setOutputSize}
              onAspectRatioChange={themed.setAspectRatio}
              disabled={themed.themedLoading}
            />
            <ThemedUploadSection
              themedPreviewUrl={themed.themedPreviewUrl}
              themedError={themed.themedError}
              themedLoading={themed.themedLoading}
              isDraggingOver={themed.isDraggingOver}
              onFileChange={themed.handleThemedFileChange}
              onGenerate={themed.handleThemedGenerate}
              onDragOver={themed.handleDragOver}
              onDragLeave={themed.handleDragLeave}
              onDrop={themed.handleDrop}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemedPage;
