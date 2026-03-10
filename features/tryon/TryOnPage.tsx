/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI Virtual Try-On page: upload person + clothing photos, generate catalog-style results.
 */

import React from 'react';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import ProgressIndicator from '../../components/ProgressIndicator';
import TryOnOptionSelectors from './TryOnOptionSelectors';
import TryOnOutputOptions from './TryOnOutputOptions';
import TryOnUploadSection from './TryOnUploadSection';
import TryOnResult from './TryOnResult';
import { useTryOn } from './useTryOn';

interface TryOnPageProps {
  onImageSelected: (file: File) => void;
}

const TryOnPage: React.FC<TryOnPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const settings = useSettings();
  const tryOn = useTryOn();
  const hasApiKey = Boolean(settings.apiKey?.trim());

  const resultList = tryOn.results.length > 0 ? tryOn.results : tryOn.result ? [tryOn.result] : [];
  const hasMultipleResults = resultList.length > 1;

  return (
    <div className="w-full max-w-5xl mx-auto text-center px-4 py-6 sm:p-8 transition-all duration-300 rounded-2xl border-2 border-transparent">
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <header className="flex flex-col items-center gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-100 sm:text-5xl md:text-6xl">
            {t('tryon.title_part1')} <span className="text-teal-400">{t('tryon.title_part2')}</span>
          </h1>
          <p className="max-w-2xl text-lg text-gray-300 md:text-xl leading-relaxed">
            {t('tryon.subtitle')}
          </p>
        </header>

        {!hasApiKey && (
          <div className="w-full max-w-xl mx-auto rounded-xl bg-amber-500/20 border border-amber-500/50 px-4 py-3 text-left">
            <p className="text-amber-200 text-sm font-medium">⚙️ {t('tryon.api_key_required')}</p>
            <p className="text-amber-200/80 text-xs mt-1">{t('tryon.api_key_hint')}</p>
          </div>
        )}

        {resultList.length > 0 ? (
          <section className="w-full flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {hasMultipleResults && (
                <button
                  type="button"
                  onClick={tryOn.handleBatchDownload}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition-colors text-sm shadow-lg shadow-teal-600/20"
                >
                  💾 {t('tryon.batch_download')} ({resultList.length})
                </button>
              )}
              <button
                type="button"
                onClick={tryOn.clearResult}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors text-sm border border-gray-600"
              >
                {t('tryon.again')}
              </button>
            </div>
            <p className="text-base text-gray-400 leading-relaxed">
              {t('tryon.choose_style_hint')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
              {resultList.map((dataUrl, idx) => (
                <TryOnResult
                  key={idx}
                  result={dataUrl}
                  label={resultList.length > 1 ? `${t('tryon.style')} ${idx + 1}` : undefined}
                  onDownload={() => {
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = `try-on-${idx + 1}.png`;
                    link.click();
                  }}
                  onEditInEditor={() => {
                    onImageSelected(dataURLtoFile(dataUrl, `try-on-${idx + 1}.png`));
                  }}
                  hideAgain
                />
              ))}
            </div>
          </section>
        ) : tryOn.loading ? (
          <ProgressIndicator progress={tryOn.progress} statusMessages={['tryon.generating']} />
        ) : (
          <div className="w-full max-w-2xl mx-auto bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
            <TryOnOptionSelectors
              background={tryOn.background}
              style={tryOn.style}
              onBackgroundChange={tryOn.setBackground}
              onStyleChange={tryOn.setStyle}
              disabled={tryOn.loading}
            />
            <TryOnOutputOptions
              outputSize={tryOn.outputSize}
              aspectRatio={tryOn.aspectRatio}
              onOutputSizeChange={tryOn.setOutputSize}
              onAspectRatioChange={tryOn.setAspectRatio}
              disabled={tryOn.loading}
            />
            <TryOnUploadSection
              personPreviewUrl={tryOn.personPreviewUrl}
              clothingPreviewUrls={tryOn.clothingPreviewUrls}
              error={tryOn.error}
              loading={tryOn.loading}
              isDraggingOver={tryOn.isDraggingOver}
              canGenerate={tryOn.canGenerate}
              minClothing={tryOn.minClothing}
              maxClothing={tryOn.maxClothing}
              quantity={tryOn.quantity}
              onQuantityChange={tryOn.setQuantity}
              onPersonFileChange={tryOn.handlePersonFileChange}
              onClothingFileChange={tryOn.handleClothingFileChange}
              onRemoveClothing={tryOn.removeClothing}
              onGenerate={tryOn.handleGenerate}
              onDragOver={tryOn.handleDragOver}
              onDragLeave={tryOn.handleDragLeave}
              onDropPerson={tryOn.handleDropPerson}
              onDropClothing={tryOn.handleDropClothing}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TryOnPage;
