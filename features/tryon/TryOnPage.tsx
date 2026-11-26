import { useToolDesign } from '../../hooks/useHomeDesign';
import React, { useEffect, useMemo, useState } from 'react';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import HistoryStorageNotice from '../../components/HistoryStorageNotice';
import { useToolCommands } from '../../contexts/ToolCommandsContext';
import TryOnWorkspaceDialog from './TryOnWorkspaceDialog';
import TryOnPromptEditor from './TryOnPromptEditor';
import TryOnReferenceBoard from './TryOnReferenceBoard';
import { openSettingsPanel } from '../../utils/settingsPanel';
import type { TryOnReferenceRole } from '../../types/tryOnRecipe';
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
import '../../styles/tryon-workflow.css';

interface TryOnPageProps {
  onImageSelected: (file: File) => void;
}

export default function TryOnPage({ onImageSelected }: TryOnPageProps) {
  useToolDesign();
  const { t, language } = useLanguage();
  const { isDemoMode, effectiveApiKey, imageProvider, enableDemoMode } = useSettings();
  const { setCommands } = useToolCommands();
  const [activeDialog, setActiveDialog] = useState<
    'materials' | 'recipes' | 'draft' | 'prompt' | null
  >(null);
  const [materialRole, setMaterialRole] = useState<TryOnReferenceRole | 'all'>('all');
  const openMaterials = (role: TryOnReferenceRole | 'all') => {
    setMaterialRole(role);
    setActiveDialog('materials');
  };
  const tryOn = useTryOn();
  const zh = language === 'zh-TW';
  const [clearingDraft, setClearingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const formDisabled =
    tryOn.isRunning ||
    tryOn.loading ||
    tryOn.materialLoading ||
    tryOn.draftStatus === 'loading' ||
    clearingDraft;
  const backgroundOverride = Boolean(
    tryOn.referencePreviewUrls.scene || tryOn.referencePreviewUrls.lighting,
  );
  const resultList = tryOn.results.length > 0 ? tryOn.results : tryOn.result ? [tryOn.result] : [];
  const hasResults = resultList.length > 0;

  const commands = useMemo(
    () => [
      {
        id: 'tryon-prompt',
        label: zh ? '提示詞' : 'Prompt',
        onSelect: () => setActiveDialog('prompt'),
      },
      {
        id: 'tryon-materials',
        label: zh ? '參考素材庫' : 'Reference library',
        onSelect: () => {
          setMaterialRole('all');
          setActiveDialog('materials');
        },
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

  const references = (variant: 'pose' | 'extra') => (
    <TryOnReferenceControls
      variant={variant}
      keepBackground={tryOn.keepBackground}
      keepPose={tryOn.keepPose}
      referencePreviewUrls={tryOn.referencePreviewUrls}
      onKeepBackgroundChange={tryOn.setKeepBackground}
      onKeepPoseChange={tryOn.setKeepPose}
      onReferenceChange={tryOn.setReference}
      onChoosePose={() => openMaterials('pose')}
      disabled={formDisabled || isDemoMode}
    />
  );
  const board = (
    <TryOnReferenceBoard
      personPreviewUrl={tryOn.personPreviewUrl}
      clothingPreviewUrls={tryOn.clothingPreviewUrls}
      referencePreviewUrls={tryOn.referencePreviewUrls}
      keepPose={tryOn.keepPose}
      onChooseClothing={() => openMaterials('clothing')}
      onChoosePose={() => openMaterials('pose')}
      disabled={formDisabled || isDemoMode}
    />
  );
  const generate = () => {
    if (tryOn.canGenerate && !isDemoMode && !effectiveApiKey.trim()) {
      openSettingsPanel();
      return;
    }
    void tryOn.handleGenerate();
  };

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
              <h1 id="tryon-title">{zh ? 'AI 試穿 · Virtual try-on' : 'AI virtual try-on'}</h1>
              <p>
                {zh
                  ? '人物、服裝、姿勢。在同一個工作台完成試穿。'
                  : 'Person, clothing, pose. Build your next outfit in one workspace.'}
              </p>
            </div>
            <details className="tryon-local-tools">
              <summary className="tool-button tool-button-secondary">
                {zh ? '工作區工具' : 'Workspace tools'}
              </summary>
              <div
                className="tryon-local-tools-menu"
                aria-label={zh ? '試穿工作區操作' : 'Try-on workspace actions'}
              >
                {commands.map((command) => (
                  <button
                    key={command.id}
                    type="button"
                    className="tool-button tool-button-secondary"
                    onClick={(event) => {
                      const tools = event.currentTarget.closest('details');
                      tools?.removeAttribute('open');
                      tools?.querySelector('summary')?.focus();
                      command.onSelect();
                    }}
                  >
                    {command.label}
                  </button>
                ))}
              </div>
            </details>
          </header>
          <div className="app-frame tryon-studio">
            <fieldset className="tryon-panel tryon-setup">
              <legend id="tryon-setup-title">{zh ? '準備試穿' : 'Prepare your try-on'}</legend>
              <div className="tryon-pane-scroll" role="region" aria-labelledby="tryon-setup-title">
                <HistoryStorageNotice />
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
                  onGenerate={generate}
                  onChooseClothing={() => openMaterials('clothing')}
                  poseControls={references('pose')}
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
                  {references('extra')}
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
                    ? '參考畫板'
                    : 'Reference board'}
              </legend>
              <div
                className="tryon-pane-scroll"
                role="region"
                aria-labelledby="tryon-preview-title"
              >
                {tryOn.loading && (
                  <ProgressIndicator
                    progress={tryOn.progress}
                    statusMessages={['tryon.generating']}
                    onCancel={tryOn.cancelGeneration}
                  />
                )}
                {(hasResults || tryOn.failures.length > 0) && (
                  <GenerationFailureNotice
                    failures={tryOn.failures}
                    requestedCount={tryOn.requestedCount}
                    succeededCount={tryOn.succeededCount}
                    isRetrying={tryOn.isRetrying}
                    onRetry={tryOn.handleRetryFailed}
                    context="tryon"
                  />
                )}
                {hasResults ? (
                  <>
                    <p className="tryon-hint">
                      {zh
                        ? '可直接調整左側設定，再生成下一次試穿。這張結果會保留到新圖片完成。'
                        : 'Adjust your references and generate again. This result stays until the next image is ready.'}
                    </p>
                    <div className="tryon-results">
                      {resultList.map((dataUrl, index) => (
                        <TryOnResult
                          key={`${index}-${dataUrl}`}
                          result={dataUrl}
                          originalUrl={tryOn.resultPersonPreviewUrl}
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
                        disabled={formDisabled}
                        className="tool-button tool-button-secondary"
                      >
                        {zh ? '清除顯示結果' : 'Clear displayed results'}
                      </button>
                    </div>
                    <details className="tryon-disclosure tryon-result-references">
                      <summary>
                        {zh ? '檢視下一次試穿的參考圖' : 'Review references for your next try-on'}
                      </summary>
                      {board}
                    </details>
                  </>
                ) : (
                  board
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
                    ? '連接 API 金鑰後即可生成，也可先試用示範模式。'
                    : `Connect your ${imageProvider === 'openai' ? 'OpenAI' : imageProvider === 'openrouter' ? 'OpenRouter' : 'Gemini'} key in Settings, or choose Try demo.`}
            </p>
            {!isDemoMode && !effectiveApiKey.trim() && (
              <button
                type="button"
                className="tool-button tool-button-secondary"
                onClick={() => openSettingsPanel()}
              >
                {zh ? '連接模型供應商' : 'Connect image provider'}
              </button>
            )}
            <p>
              {zh
                ? '內建素材 CC0 · 草稿僅儲存在此裝置'
                : 'Built-in materials CC0 · Drafts stay on this device'}
            </p>
          </footer>
        </div>
        <TryOnWorkspaceDialog
          open={activeDialog === 'prompt'}
          onClose={() => setActiveDialog(null)}
          title={zh ? '提示詞' : 'Prompt'}
          id="tryon-prompt-dialog"
        >
          <TryOnPromptEditor
            automaticPrompt={tryOn.automaticPrompt}
            quantity={tryOn.quantity}
            promptOverride={tryOn.promptOverride}
            referenceMap={tryOn.referenceMap}
            onChange={tryOn.setPromptOverride}
            disabled={formDisabled || isDemoMode}
          />
        </TryOnWorkspaceDialog>
        <TryOnWorkspaceDialog
          open={activeDialog === 'materials'}
          onClose={() => setActiveDialog(null)}
          title={zh ? '參考素材庫' : 'Reference library'}
          id="tryon-materials-dialog"
        >
          <TryOnMaterialPicker
            key={`${activeDialog}:${materialRole}`}
            initialRole={materialRole}
            selectedIds={tryOn.materialIds}
            canAddClothing={tryOn.clothingPreviewUrls.length < tryOn.maxClothing}
            disabled={formDisabled || isDemoMode}
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
