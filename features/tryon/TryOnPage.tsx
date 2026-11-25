import { useToolDesign } from '../../hooks/useHomeDesign';
import React, { useEffect, useMemo, useState } from 'react';
import { dataURLtoFile } from '../../utils/fileUtils';
import { publicAssetUrl } from '../../utils/publicAsset';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import HistoryStorageNotice from '../../components/HistoryStorageNotice';
import { useToolCommands } from '../../contexts/ToolCommandsContext';
import TryOnWorkspaceDialog from './TryOnWorkspaceDialog';
import CompareSlider from '../../components/CompareSlider';
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
import '../../styles/tryon-workspace.css';

interface TryOnPageProps {
  onImageSelected: (file: File) => void;
}

export default function TryOnPage({ onImageSelected }: TryOnPageProps) {
  useToolDesign();
  const { t, language } = useLanguage();
  const { isDemoMode, effectiveApiKey, imageProvider, enableDemoMode } = useSettings();
  const { setCommands } = useToolCommands();
  const [activeDialog, setActiveDialog] = useState<'materials' | 'recipes' | 'draft' | null>(null);
  const tryOn = useTryOn();
  const zh = language === 'zh-TW';
  const [clearingDraft, setClearingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const formDisabled =
    tryOn.loading || tryOn.materialLoading || tryOn.draftStatus === 'loading' || clearingDraft;
  const backgroundOverride = Boolean(
    tryOn.referencePreviewUrls.scene || tryOn.referencePreviewUrls.lighting,
  );
  const resultList = tryOn.results.length > 0 ? tryOn.results : tryOn.result ? [tryOn.result] : [];
  const hasResults = resultList.length > 0;

  const commands = useMemo(
    () => [
      {
        id: 'tryon-materials',
        label: zh ? '參考素材庫' : 'Reference library',
        onSelect: () => setActiveDialog('materials'),
      },
      {
        id: 'tryon-recipes',
        label: zh ? '配方' : 'Recipes',
        onSelect: () => setActiveDialog('recipes'),
      },
      { id: 'tryon-draft', label: zh ? '草稿' : 'Draft', onSelect: () => setActiveDialog('draft') },
      ...(!isDemoMode && !effectiveApiKey.trim()
        ? [{ id: 'tryon-demo', label: t('demo.try_demo'), onSelect: enableDemoMode }]
        : []),
    ],
    [zh, isDemoMode, effectiveApiKey, t, enableDemoMode],
  );

  useEffect(() => {
    setCommands(commands);
    return () => setCommands([]);
  }, [commands, setCommands]);

  async function clearDraft() {
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
  }

  return (
    <section className="tryon-workspace hero" aria-labelledby="tryon-title" data-enter>
      <div className="wrap tool-shell-wrap">
        <div
          className="hero-text tryon-workspace-inner"
          data-moment="cursor-spotlight"
          data-moment-opts='{"radius":320,"grid":false}'
        >
          <header className="tryon-page-heading">
            <div>
              <h1 id="tryon-title">
                {zh ? (
                  <>
                    AI 試穿 · <span lang="en">Virtual try-on</span>
                  </>
                ) : (
                  'AI virtual try-on'
                )}
              </h1>
              <p>
                {zh
                  ? '上傳人物照，選擇服裝，預覽新的穿搭。'
                  : 'Upload your photo, choose clothing and preview a new outfit.'}
              </p>
            </div>
          </header>
          <div className="app-frame tryon-studio">
            <fieldset className="tryon-panel tryon-setup">
              <legend id="tryon-setup-title">{zh ? '照片與設定' : 'Photos and settings'}</legend>
              <div
                className="tryon-pane-scroll"
                tabIndex={0}
                role="region"
                aria-labelledby="tryon-setup-title"
              >
                <HistoryStorageNotice />
                <TryOnUploadSection
                  personPreviewUrl={tryOn.personPreviewUrl}
                  clothingPreviewUrls={tryOn.clothingPreviewUrls}
                  error={tryOn.error}
                  loading={tryOn.loading}
                  disabled={formDisabled || hasResults}
                  isDraggingOver={tryOn.isDraggingOver}
                  canGenerate={tryOn.canGenerate && !formDisabled && !hasResults}
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
                  <TryOnOptionSelectors
                    background={tryOn.background}
                    style={tryOn.style}
                    onBackgroundChange={tryOn.setBackground}
                    onStyleChange={tryOn.setStyle}
                    disabled={formDisabled || hasResults}
                    backgroundDisabled={tryOn.keepBackground || backgroundOverride}
                  />
                  <TryOnOutputOptions
                    outputSize={tryOn.outputSize}
                    aspectRatio={tryOn.aspectRatio}
                    onOutputSizeChange={tryOn.setOutputSize}
                    onAspectRatioChange={tryOn.setAspectRatio}
                    disabled={formDisabled || hasResults}
                  />
                  <TryOnReferenceControls
                    keepBackground={tryOn.keepBackground}
                    keepPose={tryOn.keepPose}
                    referencePreviewUrls={tryOn.referencePreviewUrls}
                    onKeepBackgroundChange={tryOn.setKeepBackground}
                    onKeepPoseChange={tryOn.setKeepPose}
                    onReferenceChange={tryOn.setReference}
                    disabled={formDisabled || hasResults || isDemoMode}
                  />
                </TryOnUploadSection>
              </div>
            </fieldset>
            <fieldset className="tryon-panel tryon-preview">
              <legend id="tryon-preview-title">
                {hasResults
                  ? zh
                    ? '生成結果'
                    : 'Your results'
                  : zh
                    ? '試穿範例'
                    : 'Try-on example'}
              </legend>
              <div
                className="tryon-pane-scroll"
                tabIndex={0}
                role="region"
                aria-labelledby="tryon-preview-title"
              >
                {tryOn.loading ? (
                  <ProgressIndicator
                    progress={tryOn.progress}
                    statusMessages={['tryon.generating']}
                    onCancel={tryOn.cancelGeneration}
                  />
                ) : hasResults ? (
                  <>
                    <GenerationFailureNotice
                      failures={tryOn.failures}
                      requestedCount={tryOn.requestedCount}
                      succeededCount={tryOn.succeededCount}
                      isRetrying={tryOn.isRetrying}
                      onRetry={tryOn.handleRetryFailed}
                      context="tryon"
                    />
                    <div className="tryon-results">
                      {resultList.map((dataUrl, index) => (
                        <TryOnResult
                          key={`${index}-${dataUrl}`}
                          result={dataUrl}
                          originalUrl={tryOn.personPreviewUrl}
                          label={
                            resultList.length > 1 ? `${t('tryon.style')} ${index + 1}` : undefined
                          }
                          onEditInEditor={() =>
                            onImageSelected(dataURLtoFile(dataUrl, `try-on-${index + 1}.png`))
                          }
                          hideAgain
                        />
                      ))}
                    </div>
                    <div className="tryon-action-row">
                      {resultList.length > 1 && (
                        <button
                          type="button"
                          onClick={tryOn.handleBatchDownload}
                          className="tool-button tool-button-secondary"
                        >
                          {t('tryon.batch_download')} ({resultList.length})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={tryOn.clearResult}
                        className="tool-button tool-button-secondary"
                      >
                        {t('tryon.again')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="tryon-sample-image">
                    <CompareSlider
                      originalUrl={publicAssetUrl('examples/tryon-before.webp')}
                      currentUrl={publicAssetUrl('examples/tryon-after.webp')}
                      imageClassName="tryon-comparison-image"
                    />
                  </div>
                )}
              </div>
            </fieldset>
          </div>
          <footer className="tryon-workspace-status">
            {!isDemoMode && tryOn.draftStatus === 'error' && (
              <p role="alert" className="tryon-error">
                {zh
                  ? '草稿無法儲存，請保留原始照片。'
                  : 'Draft could not be saved. Keep your original photos.'}
              </p>
            )}
            <p
              data-testid={!isDemoMode && !effectiveApiKey.trim() ? 'api-key-notice' : undefined}
              role="status"
            >
              {isDemoMode
                ? zh
                  ? '示範模式 · 使用內建照片，不會呼叫 AI。'
                  : 'Demo mode · Built-in photos, no AI requests.'
                : effectiveApiKey.trim()
                  ? zh
                    ? '供應商已就緒 · 照片將送至你選擇的服務。'
                    : 'Provider ready · Photos go to your selected service.'
                  : zh
                    ? '在設定中連接 API 金鑰，或由上方選單試用示範模式。'
                    : `Connect your ${imageProvider === 'openai' ? 'OpenAI' : imageProvider === 'openrouter' ? 'OpenRouter' : 'Gemini'} key in Settings, or choose Try demo above.`}
            </p>
            <p>
              {zh
                ? '內建素材 CC0 · 範例照片僅供示範'
                : 'Built-in materials CC0 · Example photos for demonstration'}
            </p>
          </footer>
        </div>
        <TryOnWorkspaceDialog
          open={activeDialog === 'materials'}
          onClose={() => setActiveDialog(null)}
          title={zh ? '參考素材庫' : 'Reference library'}
          id="tryon-materials-dialog"
        >
          <TryOnMaterialPicker
            selectedIds={tryOn.materialIds}
            canAddClothing={tryOn.clothingPreviewUrls.length < tryOn.maxClothing}
            disabled={formDisabled || hasResults || isDemoMode}
            onSelect={tryOn.addMaterial}
            onRemove={tryOn.removeMaterial}
          />
        </TryOnWorkspaceDialog>
        <TryOnWorkspaceDialog
          open={activeDialog === 'recipes'}
          onClose={() => setActiveDialog(null)}
          title={zh ? '配方' : 'Recipes'}
          id="tryon-recipes-dialog"
        >
          <TryOnRecipeActions recipe={tryOn.recipe} onApply={tryOn.applyRecipe} />
        </TryOnWorkspaceDialog>
        <TryOnWorkspaceDialog
          open={activeDialog === 'draft'}
          onClose={() => setActiveDialog(null)}
          title={zh ? '草稿' : 'Draft'}
          id="tryon-draft-dialog"
        >
          <p data-testid="tryon-draft-status" role="status" className="tryon-hint">
            {isDemoMode
              ? zh
                ? '示範模式不儲存草稿。'
                : 'Demo mode does not save drafts.'
              : tryOn.draftStatus === 'loading'
                ? zh
                  ? '正在還原草稿…'
                  : 'Restoring draft…'
                : tryOn.draftStatus === 'saved'
                  ? zh
                    ? '草稿已儲存在此裝置'
                    : 'Draft saved on this device'
                  : tryOn.draftStatus === 'error'
                    ? zh
                      ? '草稿無法儲存，請保留原始照片。'
                      : 'Draft could not be saved. Keep your original photos.'
                    : zh
                      ? '草稿僅儲存在此裝置'
                      : 'Drafts stay on this device'}
          </p>
          <button
            type="button"
            data-testid="tryon-clear-draft"
            onClick={() => void clearDraft()}
            disabled={formDisabled || isDemoMode}
            className="tool-button tool-button-secondary"
          >
            {zh ? '清除草稿與照片' : 'Clear draft and photos'}
          </button>
          {draftError && (
            <p role="alert" className="tryon-error">
              {draftError}
            </p>
          )}
        </TryOnWorkspaceDialog>
      </div>
    </section>
  );
}
