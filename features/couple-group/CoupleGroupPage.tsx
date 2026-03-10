/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Main page for couple/group photo feature.
 */

import React from 'react';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import ProgressIndicator from '../../components/ProgressIndicator';
import CoupleGroupModeTabs from './CoupleGroupModeTabs';
import CoupleGroupStyleSelector from './CoupleGroupStyleSelector';
import CoupleGroupUploadSection from './CoupleGroupUploadSection';
import CoupleGroupResult from './CoupleGroupResult';
import { useCoupleGroup } from './useCoupleGroup';
import QuantitySelector from '../../components/QuantitySelector';
import OutputSizeRatioSelector from '../../components/OutputSizeRatioSelector';

interface CoupleGroupPageProps {
  onImageSelected: (file: File) => void;
}

const CoupleGroupPage: React.FC<CoupleGroupPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const coupleGroup = useCoupleGroup();
  const resultCount = coupleGroup.results?.length ?? 0;
  const hasMultipleResults = resultCount > 1;

  return (
    <div className="w-full max-w-5xl mx-auto text-center px-4 py-6 sm:p-8 transition-all duration-300 rounded-2xl border-2 border-transparent">
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <header className="flex flex-col items-center gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-100 sm:text-5xl md:text-6xl">
            {t('couple_group.title_part1')}{' '}
            <span className="text-pink-400">{t('couple_group.title_part2')}</span>
          </h1>
          <p className="max-w-2xl text-lg text-gray-300 md:text-xl leading-relaxed">
            {t('couple_group.subtitle')}
          </p>
          <CoupleGroupModeTabs mode={coupleGroup.mode} onChange={coupleGroup.setMode} />
        </header>

        {coupleGroup.results && coupleGroup.results.length > 0 ? (
          <section className="w-full flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {hasMultipleResults && (
                <button
                  onClick={coupleGroup.handleBatchDownload}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 transition-colors text-sm shadow-lg shadow-green-600/20"
                >
                  💾 {t('history.batch_download')} ({resultCount})
                </button>
              )}
              <button
                onClick={coupleGroup.clearResult}
                className="px-5 py-2.5 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors text-sm border border-gray-600"
              >
                {t('couple_group.again')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
              {coupleGroup.results.map((result, idx) => (
                <CoupleGroupResult
                  key={idx}
                  result={result}
                  mode={coupleGroup.mode}
                  style={coupleGroup.style}
                  onDownload={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = `couple-group-${coupleGroup.mode}-${idx + 1}.png`;
                    link.click();
                  }}
                  onAgain={coupleGroup.clearResult}
                  onEditInEditor={() => {
                    onImageSelected(dataURLtoFile(result, `couple-group-${idx + 1}.png`));
                  }}
                />
              ))}
            </div>
          </section>
        ) : coupleGroup.result ? (
          <CoupleGroupResult
            result={coupleGroup.result}
            mode={coupleGroup.mode}
            style={coupleGroup.style}
            onDownload={() => {
              if (!coupleGroup.result) return;
              const link = document.createElement('a');
              link.href = coupleGroup.result;
              link.download = `couple-group-${coupleGroup.mode}-${Date.now()}.png`;
              link.click();
            }}
            onAgain={coupleGroup.clearResult}
            onEditInEditor={() => {
              if (!coupleGroup.result) return;
              onImageSelected(dataURLtoFile(coupleGroup.result, `couple-group-${Date.now()}.png`));
            }}
          />
        ) : coupleGroup.loading ? (
          <ProgressIndicator
            progress={coupleGroup.progress}
            statusMessages={['couple_group.generating']}
          />
        ) : (
          <div className="w-full max-w-2xl mx-auto bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
            <CoupleGroupStyleSelector
              mode={coupleGroup.mode}
              style={coupleGroup.style}
              onChange={coupleGroup.setStyle}
              disabled={coupleGroup.loading}
            />
            <QuantitySelector
              quantity={coupleGroup.quantity}
              onChange={coupleGroup.setQuantity}
              disabled={coupleGroup.loading}
            />
            <OutputSizeRatioSelector
              outputSize={coupleGroup.outputSize}
              aspectRatio={coupleGroup.aspectRatio}
              onOutputSizeChange={coupleGroup.setOutputSize}
              onAspectRatioChange={coupleGroup.setAspectRatio}
              disabled={coupleGroup.loading}
            />
            <CoupleGroupUploadSection
              mode={coupleGroup.mode}
              files={coupleGroup.files}
              previewUrls={coupleGroup.previewUrls}
              error={coupleGroup.error}
              loading={coupleGroup.loading}
              isDraggingOver={coupleGroup.isDraggingOver}
              onFileChange={coupleGroup.handleFileChange}
              onGenerate={coupleGroup.handleGenerate}
              onRemoveFile={coupleGroup.removeFile}
              onDragOver={coupleGroup.handleDragOver}
              onDragLeave={coupleGroup.handleDragLeave}
              onDrop={coupleGroup.handleDrop}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CoupleGroupPage;
