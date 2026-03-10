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

interface ThemedPageProps {
  onImageSelected: (file: File) => void;
}

const ThemedPage: React.FC<ThemedPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const themed = useThemed();
  const surface =
    theme === 'newyear'
      ? 'bg-red-900/30 border-red-700/50 shadow-red-900/25'
      : theme === 'bloom'
        ? 'bg-gray-900/40 border-fuchsia-500/15 shadow-fuchsia-500/10'
        : 'bg-black/60 border-slate-700/60 shadow-slate-900/30';

  const handleEditInEditor = (result: string, index?: number) => {
    if (!result) return;
    const filename = index !== undefined ? `themed-${index + 1}.png` : 'themed-export.png';
    onImageSelected(dataURLtoFile(result, filename));
  };

  const resultCount = themed.themedResults?.length ?? 0;
  const hasMultipleResults = resultCount > 1;

  return (
    <div
      className={`w-full max-w-5xl mx-auto text-center px-4 py-6 sm:p-8 transition-all duration-300 rounded-2xl border-2 shadow-xl backdrop-blur-xl ${surface}`}
    >
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <header className="flex flex-col items-center gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-100 sm:text-5xl md:text-6xl">
            <span
              className={`${
                theme === 'newyear'
                  ? 'text-red-200'
                  : theme === 'bloom'
                    ? 'text-fuchsia-200'
                    : 'text-purple-200'
              }`}
            >
              {t('themed.title')}
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-gray-300 md:text-xl leading-relaxed">
            {t('themed.subtitle')}
          </p>
        </header>

        {themed.themedResults && themed.themedResults.length > 0 ? (
          <section className="w-full flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {hasMultipleResults && (
                <button
                  onClick={themed.handleThemedBatchDownload}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 transition-colors text-sm shadow-lg shadow-green-600/20"
                >
                  💾 {t('history.batch_download')} ({resultCount})
                </button>
              )}
              <button
                onClick={themed.clearThemedResult}
                className="px-5 py-2.5 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors text-sm border border-gray-600"
              >
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
