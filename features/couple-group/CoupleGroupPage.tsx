/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Main page for couple/group photo feature.
 */

import React from 'react';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import ApiKeyNotice from '../../components/ApiKeyNotice';
import ProgressIndicator from '../../components/ProgressIndicator';
import CoupleGroupModeTabs from './CoupleGroupModeTabs';
import CoupleGroupStyleSelector from './CoupleGroupStyleSelector';
import CoupleGroupUploadSection from './CoupleGroupUploadSection';
import CoupleGroupResult from './CoupleGroupResult';
import { useCoupleGroup } from './useCoupleGroup';
import QuantitySelector from '../../components/QuantitySelector';
import GenerationFailureNotice from '../../components/GenerationFailureNotice';
import OutputSizeRatioSelector from '../../components/OutputSizeRatioSelector';
import {
  UI_BTN_SECONDARY,
  UI_BTN_SUCCESS,
  UI_PAGE,
  UI_SUBTITLE,
  UI_TITLE,
} from '../../utils/uiClasses';

interface CoupleGroupPageProps {
  onImageSelected: (file: File) => void;
}

const CoupleGroupPage: React.FC<CoupleGroupPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const coupleGroup = useCoupleGroup();
  const resultCount = coupleGroup.results?.length ?? 0;
  const hasMultipleResults = resultCount > 1;

  return (
    <div className={`${UI_PAGE} border-transparent shadow-none`}>
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <header className="flex flex-col items-center gap-3">
          <h1 className={UI_TITLE}>
            {t('couple_group.title_part1')}{' '}
            <span className="text-pink-400">{t('couple_group.title_part2')}</span>
          </h1>
          <p className={UI_SUBTITLE}>{t('couple_group.subtitle')}</p>
          <CoupleGroupModeTabs mode={coupleGroup.mode} onChange={coupleGroup.setMode} />
        </header>

        <ApiKeyNotice />

        {coupleGroup.results && coupleGroup.results.length > 0 ? (
          <section className="w-full flex flex-col gap-6">
            <GenerationFailureNotice
              failures={coupleGroup.failures}
              requestedCount={coupleGroup.requestedCount}
              succeededCount={coupleGroup.succeededCount}
              isRetrying={coupleGroup.isRetrying}
              onRetry={coupleGroup.handleRetryFailed}
              context="couple_group"
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
              {hasMultipleResults && (
                <button
                  type="button"
                  onClick={coupleGroup.handleBatchDownload}
                  className={UI_BTN_SUCCESS}
                >
                  💾 {t('history.batch_download')} ({resultCount})
                </button>
              )}
              <button type="button" onClick={coupleGroup.clearResult} className={UI_BTN_SECONDARY}>
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
            onEditInEditor={() => {
              if (!coupleGroup.result) return;
              onImageSelected(dataURLtoFile(coupleGroup.result, `couple-group-${Date.now()}.png`));
            }}
          />
        ) : coupleGroup.loading ? (
          <ProgressIndicator
            progress={coupleGroup.progress}
            statusMessages={['couple_group.generating']}
            onCancel={coupleGroup.cancelGeneration}
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
