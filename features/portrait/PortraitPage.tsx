/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import ProgressIndicator from '../../components/ProgressIndicator';
import { usePortrait } from './usePortrait';
import PortraitForm from './PortraitForm';
import PortraitUploadSection from './PortraitUploadSection';
import PortraitResult from './PortraitResult';
import QuantitySelector from '../../components/QuantitySelector';
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

interface PortraitPageProps {
  onImageSelected: (file: File) => void;
}

const PortraitPage: React.FC<PortraitPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const portrait = usePortrait();

  const handleEditInEditor = (result: string, index?: number) => {
    if (!result) return;
    const filename = index !== undefined ? `portrait-${index + 1}.png` : 'portrait-export.png';
    onImageSelected(dataURLtoFile(result, filename));
  };

  return (
    <div className={`${UI_PAGE} ${getPageSurface(theme)}`}>
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className={UI_TITLE}>
          <span className={getTitleAccent(theme)}>{t('portrait.title')}</span>
        </h1>
        <p className={UI_SUBTITLE}>{t('portrait.subtitle')}</p>

        {portrait.portraitResults && portrait.portraitResults.length > 0 ? (
          <div className="w-full flex flex-col gap-6">
            <GenerationFailureNotice
              failures={portrait.failures}
              requestedCount={portrait.requestedCount}
              succeededCount={portrait.succeededCount}
              isRetrying={portrait.isRetrying}
              onRetry={portrait.handleRetryFailed}
              context="portrait"
            />
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={portrait.handlePortraitBatchDownload}
                className={UI_BTN_SUCCESS}
              >
                💾 {t('history.batch_download')} ({portrait.portraitResults.length})
              </button>
              <button
                type="button"
                onClick={portrait.clearPortraitResult}
                className={UI_BTN_SECONDARY}
              >
                {t('portrait.generate_again')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
              {portrait.portraitResults.map((result, idx) => (
                <PortraitResult
                  key={idx}
                  portraitResult={result}
                  portraitType={portrait.portraitType}
                  portraitOutputSpec={portrait.portraitOutputSpec}
                  onDownload={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = `portrait-${idx + 1}.png`;
                    link.click();
                  }}
                  onAgain={portrait.clearPortraitResult}
                  onEditInEditor={() => handleEditInEditor(result, idx)}
                />
              ))}
            </div>
          </div>
        ) : portrait.portraitResult ? (
          <PortraitResult
            portraitResult={portrait.portraitResult}
            portraitType={portrait.portraitType}
            portraitOutputSpec={portrait.portraitOutputSpec}
            onDownload={portrait.handlePortraitDownload}
            onAgain={portrait.clearPortraitResult}
            onEditInEditor={() => handleEditInEditor(portrait.portraitResult!)}
          />
        ) : portrait.portraitLoading ? (
          <ProgressIndicator
            progress={portrait.progress}
            statusMessages={['portrait.generating']}
            onCancel={portrait.cancelGeneration}
          />
        ) : (
          <>
            <PortraitForm
              portraitType={portrait.portraitType}
              setPortraitType={portrait.setPortraitType}
              portraitOutputSpec={portrait.portraitOutputSpec}
              setPortraitOutputSpec={portrait.setPortraitOutputSpec}
              imageSize={portrait.imageSize}
              setImageSize={portrait.setImageSize}
              disabled={portrait.portraitLoading}
            />
            <div className="w-full max-w-md mx-auto">
              <QuantitySelector
                quantity={portrait.quantity}
                onChange={portrait.setQuantity}
                disabled={portrait.portraitLoading}
              />
            </div>
            <PortraitUploadSection
              portraitPreviewUrl={portrait.portraitPreviewUrl}
              portraitError={portrait.portraitError}
              portraitLoading={portrait.portraitLoading}
              isDraggingOver={portrait.isDraggingOver}
              onFileChange={portrait.handlePortraitFileChange}
              onGenerate={portrait.handlePortraitGenerate}
              onDragOver={portrait.handleDragOver}
              onDragLeave={portrait.handleDragLeave}
              onDrop={portrait.handleDrop}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PortraitPage;
