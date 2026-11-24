/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * AI Virtual Try-On page: upload person + clothing photos, generate catalog-style results.
 */

import React, { useState } from 'react';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import ApiKeyNotice from '../../components/ApiKeyNotice';
import DemoModeBanner from '../../components/DemoModeBanner';
import ExampleShowcase from '../../components/ExampleShowcase';
import ProgressIndicator from '../../components/ProgressIndicator';
import GenerationFailureNotice from '../../components/GenerationFailureNotice';
import TryOnOptionSelectors from './TryOnOptionSelectors';
import TryOnOutputOptions from './TryOnOutputOptions';
import TryOnUploadSection from './TryOnUploadSection';
import TryOnResult from './TryOnResult';
import TryOnMaterialPicker from './TryOnMaterialPicker';
import TryOnReferenceControls from './TryOnReferenceControls';
import TryOnRecipeActions from './TryOnRecipeActions';
import { useTryOn } from './useTryOn';
import {
  UI_BTN_SECONDARY,
  UI_BTN_SUCCESS,
  UI_PAGE,
  UI_SUBTITLE,
  UI_TITLE,
  getPageSurface,
  getTitleAccent,
} from '../../utils/uiClasses';

interface TryOnPageProps {
  onImageSelected: (file: File) => void;
}

const TryOnPage: React.FC<TryOnPageProps> = ({ onImageSelected }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { isDemoMode } = useSettings();
  const tryOn = useTryOn();
  const zh = language === 'zh-TW';
  const [clearingDraft, setClearingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const formDisabled =
    tryOn.loading || tryOn.materialLoading || tryOn.draftStatus === 'loading' || clearingDraft;
  const backgroundOverride = Boolean(
    tryOn.referencePreviewUrls.scene || tryOn.referencePreviewUrls.lighting,
  );

  const clearDraft = async () => {
    setClearingDraft(true);
    setDraftError(null);
    try {
      await tryOn.clearDraft();
    } catch {
      setDraftError(
        zh ? '草稿無法清除，請再試一次。' : 'Could not clear the draft. Please try again.',
      );
    } finally {
      setClearingDraft(false);
    }
  };

  const resultList = tryOn.results.length > 0 ? tryOn.results : tryOn.result ? [tryOn.result] : [];
  const hasMultipleResults = resultList.length > 1;

  return (
    <div className={`${UI_PAGE} ${getPageSurface(theme)}`}>
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <header className="flex flex-col items-center gap-3">
          <h1 className={UI_TITLE}>
            {t('tryon.title_part1')}{' '}
            <span className={getTitleAccent(theme)}>{t('tryon.title_part2')}</span>
          </h1>
          <p className={UI_SUBTITLE}>{t('tryon.subtitle')}</p>
        </header>

        <ApiKeyNotice />
        <DemoModeBanner />

        {resultList.length > 0 ? (
          <section className="w-full flex flex-col gap-6">
            <TryOnRecipeActions recipe={tryOn.recipe} onApply={tryOn.applyRecipe} />
            <GenerationFailureNotice
              failures={tryOn.failures}
              requestedCount={tryOn.requestedCount}
              succeededCount={tryOn.succeededCount}
              isRetrying={tryOn.isRetrying}
              onRetry={tryOn.handleRetryFailed}
              context="tryon"
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
              {hasMultipleResults && (
                <button
                  type="button"
                  onClick={tryOn.handleBatchDownload}
                  className={UI_BTN_SUCCESS}
                >
                  {t('tryon.batch_download')} ({resultList.length})
                </button>
              )}
              <button type="button" onClick={tryOn.clearResult} className={UI_BTN_SECONDARY}>
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
                  originalUrl={tryOn.personPreviewUrl}
                  label={resultList.length > 1 ? `${t('tryon.style')} ${idx + 1}` : undefined}
                  onEditInEditor={() => {
                    onImageSelected(dataURLtoFile(dataUrl, `try-on-${idx + 1}.png`));
                  }}
                  hideAgain
                />
              ))}
            </div>
          </section>
        ) : tryOn.loading ? (
          <ProgressIndicator
            progress={tryOn.progress}
            statusMessages={['tryon.generating']}
            onCancel={tryOn.cancelGeneration}
          />
        ) : (
          <div className="w-full max-w-2xl mx-auto bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
            {!isDemoMode && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b theme-border pb-4">
                <p
                  data-testid="tryon-draft-status"
                  role="status"
                  className="text-sm theme-ink-muted"
                >
                  {tryOn.draftStatus === 'loading'
                    ? zh
                      ? '正在還原草稿…'
                      : 'Restoring draft…'
                    : tryOn.draftStatus === 'saved'
                      ? zh
                        ? '草稿已儲存在此裝置'
                        : 'Draft saved on this device'
                      : tryOn.draftStatus === 'error'
                        ? zh
                          ? '草稿無法儲存，請在離開前下載結果。'
                          : 'Draft could not be saved. Download results before leaving.'
                        : zh
                          ? '照片與選項會自動儲存在此裝置。'
                          : 'Photos and settings are saved on this device.'}
                </p>
                <button
                  type="button"
                  data-testid="tryon-clear-draft"
                  onClick={() => void clearDraft()}
                  disabled={formDisabled}
                  className={`${UI_BTN_SECONDARY} min-h-11 text-sm`}
                >
                  {zh ? '清除草稿與照片' : 'Clear draft and photos'}
                </button>
                {draftError && (
                  <p role="alert" className="w-full text-sm text-red-300">
                    {draftError}
                  </p>
                )}
              </div>
            )}
            <TryOnUploadSection
              personPreviewUrl={tryOn.personPreviewUrl}
              clothingPreviewUrls={tryOn.clothingPreviewUrls}
              error={tryOn.error}
              loading={tryOn.loading}
              disabled={formDisabled}
              isDraggingOver={tryOn.isDraggingOver}
              canGenerate={tryOn.canGenerate && !formDisabled}
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
            >
              <TryOnMaterialPicker
                selectedIds={tryOn.materialIds}
                canAddClothing={tryOn.clothingPreviewUrls.length < tryOn.maxClothing}
                disabled={formDisabled || isDemoMode}
                onSelect={tryOn.addMaterial}
                onRemove={tryOn.removeMaterial}
              />
              <TryOnReferenceControls
                keepBackground={tryOn.keepBackground}
                keepPose={tryOn.keepPose}
                referencePreviewUrls={tryOn.referencePreviewUrls}
                onKeepBackgroundChange={tryOn.setKeepBackground}
                onKeepPoseChange={tryOn.setKeepPose}
                onReferenceChange={tryOn.setReference}
                disabled={formDisabled || isDemoMode}
              />
              {(tryOn.personPreviewUrl || tryOn.clothingPreviewUrls.length > 0) && (
                <p className="text-sm theme-ink-muted" aria-live="polite">
                  {zh
                    ? `目前組合：${tryOn.personPreviewUrl ? '1 張人物照' : '尚未加入人物照'}＋${tryOn.clothingPreviewUrls.length} 件服裝＋${Object.values(tryOn.referencePreviewUrls).filter(Boolean).length} 張其他參考圖`
                    : `Current inputs: ${tryOn.personPreviewUrl ? '1 person photo' : 'no person photo'} + ${tryOn.clothingPreviewUrls.length} clothing items + ${Object.values(tryOn.referencePreviewUrls).filter(Boolean).length} extra references`}
                </p>
              )}
              <TryOnOptionSelectors
                background={tryOn.background}
                style={tryOn.style}
                onBackgroundChange={tryOn.setBackground}
                onStyleChange={tryOn.setStyle}
                disabled={formDisabled}
                backgroundDisabled={tryOn.keepBackground || backgroundOverride}
              />
              <TryOnOutputOptions
                outputSize={tryOn.outputSize}
                aspectRatio={tryOn.aspectRatio}
                onOutputSizeChange={tryOn.setOutputSize}
                onAspectRatioChange={tryOn.setAspectRatio}
                disabled={formDisabled}
              />
              {!formDisabled && (
                <TryOnRecipeActions recipe={tryOn.recipe} onApply={tryOn.applyRecipe} />
              )}
            </TryOnUploadSection>
          </div>
        )}

        {resultList.length === 0 && !tryOn.loading && <ExampleShowcase feature="tryon" />}
      </div>
    </div>
  );
};

export default TryOnPage;
