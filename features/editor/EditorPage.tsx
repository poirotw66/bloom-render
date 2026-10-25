/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import {
  generateEditedImage,
  generateFilteredImage,
  generateAdjustedImage,
} from '../../services/geminiService';
import Spinner from '../../components/Spinner';
import CostEstimateBadge from '../../components/CostEstimateBadge';
import FilterPanel from '../../components/FilterPanel';
import AdjustmentPanel from '../../components/AdjustmentPanel';
import CropPanel from '../../components/CropPanel';
import DemoModeBanner from '../../components/DemoModeBanner';
import MaskBrushCanvas from '../../components/MaskBrushCanvas';
import RetouchMaskToolbar, { type RetouchSelectMode } from '../../components/RetouchMaskToolbar';
import { UndoIcon, RedoIcon, EyeIcon, UploadIcon, XMarkIcon } from '../../components/icons';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import SavedPromptsBar from '../../components/SavedPromptsBar';
import CompareSlider from '../../components/CompareSlider';
import ViralTemplateBanner from '../../components/ViralTemplateBanner';
import { confirmDiscardUnsavedWork, useUnsavedWork } from '../../hooks/useUnsavedWork';
import { useEditorHistoryShortcuts } from '../../hooks/useEditorHistoryShortcuts';
import { useHistory as useGenerationHistory } from '../../hooks/useHistory';
import { useMaskBrush } from '../../hooks/useMaskBrush';
import { formatApiErrorMessage } from '../../services/gemini/shared';
import { applyValidatedImageFile } from '../../utils/applyValidatedImageFile';
import { dataURLtoFile } from '../../utils/fileUtils';
import { buildHistoryOptions } from '../../utils/historyOptions';
import { logger } from '../../utils/logger';
import { consumePendingRemix } from '../../utils/pendingRemix';
import { remixToEditorPreset } from '../../utils/applyViralTemplate';
import { getEditorThemeClasses } from '../../utils/themeUtils';
import { UI_BTN_PRIMARY, UI_PAGE, getPageSurface } from '../../utils/uiClasses';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';

type Tab = 'retouch' | 'adjust' | 'filters' | 'crop';

export type EditorLocationState = {
  initialFile?: File;
  /** Non-demo viral apply: show upload step for this template. */
  awaitUpload?: boolean;
  /** Seeded from the community prompt gallery (Wave J) or viral apply. */
  galleryPreset?: {
    prompt: string;
    tab?: Tab;
    /** Viral template id — demo results use that template's thumbnail. */
    viralTemplateId?: string;
  };
};

const EditorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as EditorLocationState | null;
  const initialFile = locationState?.initialFile;
  const initialGalleryPreset = locationState?.galleryPreset;
  const [awaitUpload] = useState(() => Boolean(locationState?.awaitUpload));
  const [viralTemplateId] = useState(() => initialGalleryPreset?.viralTemplateId);
  const uploadZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFile || initialGalleryPreset || awaitUpload) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- consume router state once on mount
  }, []);

  useEffect(() => {
    try {
      window.scrollTo(0, 0);
    } catch {
      /* jsdom */
    }
    if (awaitUpload) {
      uploadZoneRef.current?.focus();
    }
  }, [awaitUpload]);

  const { t } = useLanguage();
  const settings = useSettings();
  const { theme } = useTheme();
  const { addToHistory: addToGenerationHistory } = useGenerationHistory();
  const editorTheme = getEditorThemeClasses(theme);
  const [history, setHistory] = useState<File[]>(() => (initialFile ? [initialFile] : []));
  const [historyIndex, setHistoryIndex] = useState<number>(() => (initialFile ? 0 : -1));
  const [prompt, setPrompt] = useState<string>(() => initialGalleryPreset?.prompt ?? '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number; y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number; y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(() => initialGalleryPreset?.tab ?? 'retouch');
  const [retouchMode, setRetouchMode] = useState<RetouchSelectMode>('point');
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  const maskBrush = useMaskBrush({
    naturalWidth: naturalSize.width,
    naturalHeight: naturalSize.height,
    imageKey: currentImageUrl,
  });
  const {
    hasMask,
    exportMaskFile,
    clearMask,
    canUndoStroke,
    undoStroke,
    setTool,
    setBrushSize,
    tool,
    brushSize,
  } = maskBrush;

  const retouchTargetReady = retouchMode === 'brush' ? hasMask : editHotspot !== null;

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);

  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Every entry past the original cost an API call, and the stack only lives in
  // this component, so warn before anything would unmount or reload the page.
  useUnsavedWork(canUndo);

  // Crop renders its own single-image surface, and undoing back to the original
  // leaves nothing to compare against — drop out of compare mode in both cases.
  useEffect(() => {
    if (activeTab === 'crop' || !canUndo) {
      setIsComparing(false);
    }
  }, [activeTab, canUndo]);

  const addImageToHistory = useCallback(
    (newImageFile: File) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newImageFile);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      // Reset transient states after an action
      setCrop(undefined);
      setCompletedCrop(undefined);
    },
    [history, historyIndex],
  );

  const handleDownload = useCallback(() => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(currentImage);
      link.download = `edited-${currentImage.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  }, [currentImage]);

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError(t('main.error_no_image_edit'));
      return;
    }
    if (!prompt.trim()) {
      setError(t('main.error_no_prompt_edit'));
      return;
    }

    let maskFile: File | null = null;
    if (retouchMode === 'brush') {
      if (!hasMask) {
        setError(t('main.error_no_mask'));
        return;
      }
      maskFile = await exportMaskFile();
      if (!maskFile) {
        setError(t('main.error_no_mask'));
        return;
      }
    } else if (!editHotspot) {
      setError(t('main.error_no_hotspot'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const editedImageUrl = await generateEditedImage(
        currentImage,
        prompt,
        maskFile ? { mask: maskFile } : { hotspot: editHotspot },
        settings.toServiceSettings(),
        { viralTemplateId },
      );
      void addToGenerationHistory(
        'editor',
        editedImageUrl,
        buildHistoryOptions('editor', settings, {
          prompt,
          tab: 'retouch',
          ...(maskFile ? { retouchMode: 'brush' } : { hotspot: editHotspot, retouchMode: 'point' }),
        }),
        currentImage,
      );
      addImageToHistory(dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`));
      setPrompt('');
      setEditHotspot(null);
      setDisplayHotspot(null);
      clearMask();
    } catch (err) {
      setError(formatApiErrorMessage(err, t, 'edit'));
      logger.error('Generative edit failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    addImageToHistory,
    addToGenerationHistory,
    clearMask,
    currentImage,
    editHotspot,
    exportMaskFile,
    hasMask,
    prompt,
    retouchMode,
    settings,
    t,
    viralTemplateId,
  ]);

  const handleApplyFilter = useCallback(
    async (filterPrompt: string) => {
      if (!currentImage) {
        setError(t('main.error_no_image_filter'));
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const filteredImageUrl = await generateFilteredImage(
          currentImage,
          filterPrompt,
          settings.toServiceSettings(),
          { viralTemplateId },
        );
        void addToGenerationHistory(
          'editor',
          filteredImageUrl,
          buildHistoryOptions('editor', settings, {
            prompt: filterPrompt,
            tab: 'filters',
          }),
          currentImage,
        );
        addImageToHistory(dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`));
      } catch (err) {
        setError(formatApiErrorMessage(err, t, 'filter'));
        logger.error('Filter application failed:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [addImageToHistory, addToGenerationHistory, currentImage, settings, t, viralTemplateId],
  );

  const handleApplyAdjustment = useCallback(
    async (adjustmentPrompt: string) => {
      if (!currentImage) {
        setError(t('main.error_no_image_adjust'));
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const adjustedImageUrl = await generateAdjustedImage(
          currentImage,
          adjustmentPrompt,
          settings.toServiceSettings(),
          { viralTemplateId },
        );
        void addToGenerationHistory(
          'editor',
          adjustedImageUrl,
          buildHistoryOptions('editor', settings, {
            prompt: adjustmentPrompt,
            tab: 'adjust',
          }),
          currentImage,
        );
        addImageToHistory(dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`));
      } catch (err) {
        setError(formatApiErrorMessage(err, t, 'adjustment'));
        logger.error('Adjustment application failed:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [addImageToHistory, addToGenerationHistory, currentImage, settings, t, viralTemplateId],
  );

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      setError(t('main.error_no_crop'));
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!image || !ctx) {
      setError(t('main.error_failed_crop'));
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = Math.round(completedCrop.width * scaleX);
    canvas.height = Math.round(completedCrop.height * scaleY);

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    canvas.toBlob((blob) => {
      if (!blob) {
        setError(t('main.error_failed_crop'));
        return;
      }
      addImageToHistory(new File([blob], `cropped-${Date.now()}.png`, { type: 'image/png' }));
    }, 'image/png');
  }, [addImageToHistory, completedCrop, t]);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    setHistoryIndex((index) => index - 1);
    setEditHotspot(null);
    setDisplayHotspot(null);
  }, [canUndo]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    setHistoryIndex((index) => index + 1);
    setEditHotspot(null);
    setDisplayHotspot(null);
  }, [canRedo]);

  useEditorHistoryShortcuts({
    canUndo,
    canRedo,
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  const handleReset = useCallback(() => {
    if (history.length === 0) return;
    setHistoryIndex(0);
    setError(null);
    setEditHotspot(null);
    setDisplayHotspot(null);
  }, [history.length]);

  const handleUploadNew = useCallback(() => {
    if (!confirmDiscardUnsavedWork(t('main.unsaved_confirm'))) return;
    navigate(ROUTES.HOME);
  }, [navigate, t]);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (activeTab !== 'retouch' || retouchMode !== 'point') return;

      const img = e.currentTarget;
      const rect = img.getBoundingClientRect();

      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      setDisplayHotspot({ x: offsetX, y: offsetY });

      const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
      const scaleX = naturalWidth / clientWidth;
      const scaleY = naturalHeight / clientHeight;

      const originalX = Math.round(offsetX * scaleX);
      const originalY = Math.round(offsetY * scaleY);

      setEditHotspot({ x: originalX, y: originalY });
    },
    [activeTab, retouchMode],
  );

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({
      width: img.naturalWidth || 0,
      height: img.naturalHeight || 0,
    });
  }, []);

  const handleRetouchModeChange = useCallback(
    (mode: RetouchSelectMode) => {
      setRetouchMode(mode);
      if (mode === 'brush') {
        setEditHotspot(null);
        setDisplayHotspot(null);
      } else {
        clearMask();
      }
    },
    [clearMask],
  );

  const renderEditor = () => {
    // No role="alert" on the wrapper: ErrorDisplay already carries one, and
    // nesting them makes screen readers announce the message twice.
    const errorBanner = error ? (
      <div className="w-full animate-fade-in bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start justify-between gap-4">
        <div className="min-w-0 text-left">
          <p className="font-bold text-red-300">{t('main.error_title')}</p>
          <ErrorDisplay message={error} className="mt-1" />
        </div>
        <button
          type="button"
          onClick={() => setError(null)}
          aria-label={t('main.error_dismiss')}
          title={t('main.error_dismiss')}
          className="shrink-0 p-1.5 rounded-lg text-red-200 hover:text-white hover:bg-red-500/20 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    ) : null;

    const imageDisplay =
      isComparing && originalImageUrl && currentImageUrl ? (
        <CompareSlider
          originalUrl={originalImageUrl}
          currentUrl={currentImageUrl}
          imageClassName="max-w-full max-h-[60vh] w-auto h-auto rounded-xl"
        />
      ) : (
        <div className="relative">
          {/* Base image is the original, always at the bottom */}
          {originalImageUrl && (
            <img
              key={originalImageUrl}
              src={originalImageUrl}
              alt="Original image"
              className="w-full h-auto object-contain max-h-[60vh] rounded-xl pointer-events-none"
            />
          )}
          {/* The current image sits on top; the original only shows through in compare mode */}
          <img
            ref={imgRef}
            key={currentImageUrl ?? 'none'}
            src={currentImageUrl ?? undefined}
            alt="Current edited image"
            onLoad={handleImageLoad}
            onClick={handleImageClick}
            className={`absolute top-0 left-0 w-full h-auto object-contain max-h-[60vh] rounded-xl ${
              activeTab === 'retouch' && retouchMode === 'point'
                ? 'cursor-crosshair'
                : activeTab === 'retouch' && retouchMode === 'brush'
                  ? 'pointer-events-none'
                  : 'cursor-default'
            }`}
          />
          {activeTab === 'retouch' && retouchMode === 'brush' && !isLoading && (
            <MaskBrushCanvas
              brush={maskBrush}
              disabled={isLoading}
              cursor={maskBrush.tool === 'erase' ? 'cell' : 'crosshair'}
            />
          )}
        </div>
      );

    // For ReactCrop, we need a single image element. We'll use the current one.
    const cropImageElement = (
      <img
        ref={imgRef}
        key={`crop-${currentImageUrl ?? 'none'}`}
        src={currentImageUrl ?? undefined}
        alt="Image to crop"
        className="w-full h-auto object-contain max-h-[60vh] rounded-xl"
      />
    );

    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
        {settings.isDemoMode && <DemoModeBanner />}
        {viralTemplateId && (
          <ViralTemplateBanner
            templateId={viralTemplateId}
            hintKey="viral.editor_template_hint"
            testId="viral-template-banner-editor"
          />
        )}
        {errorBanner}

        <div className="relative w-full rounded-xl overflow-hidden bg-black/20">
          {settings.isDemoMode && (
            <div className="absolute top-3 left-3 z-20">
              <DemoModeBanner compact />
            </div>
          )}
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
              <Spinner />
              <p className="text-gray-300">{t('main.loading')}</p>
            </div>
          )}

          {activeTab === 'crop' ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="max-h-[60vh]"
            >
              {cropImageElement}
            </ReactCrop>
          ) : (
            imageDisplay
          )}

          {displayHotspot &&
            !isLoading &&
            !isComparing &&
            activeTab === 'retouch' &&
            retouchMode === 'point' && (
              <div
                className="absolute rounded-full w-6 h-6 brand-bg opacity-50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
              >
                <div className="absolute inset-0 rounded-full w-6 h-6 brand-bg"></div>
              </div>
            )}
        </div>

        {isComparing && <p className="text-sm text-gray-400">{t('main.compare_hint')}</p>}

        <div
          className={`w-full border rounded-lg p-2 flex items-center justify-center gap-2 transition-colors duration-300 ${editorTheme.tabContainer}`}
        >
          {(['retouch', 'crop', 'adjust', 'filters'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full capitalize font-semibold py-3 px-5 rounded-md transition-colors duration-200 text-base cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${activeTab === tab ? editorTheme.tabActive : editorTheme.tabInactive}`}
            >
              {t(`main.tab_${tab}`)}
            </button>
          ))}
        </div>

        <div className="w-full">
          {activeTab === 'retouch' && (
            <div className="flex flex-col items-center gap-4">
              <RetouchMaskToolbar
                mode={retouchMode}
                onModeChange={handleRetouchModeChange}
                tool={tool}
                onToolChange={setTool}
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                canUndoStroke={canUndoStroke}
                onUndoStroke={undoStroke}
                hasMask={hasMask}
                onClearMask={clearMask}
                disabled={isLoading}
              />
              <p className={`text-md ${editorTheme.retouchInstruction}`}>
                {retouchMode === 'brush'
                  ? hasMask
                    ? t('main.retouch_instr_brush_ready')
                    : t('main.retouch_instr_brush_initial')
                  : editHotspot
                    ? t('main.retouch_instr_ready')
                    : t('main.retouch_instr_initial')}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleGenerate();
                }}
                className="w-full flex items-center gap-2"
              >
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    retouchMode === 'brush'
                      ? hasMask
                        ? t('main.retouch_placeholder_brush_ready')
                        : t('main.retouch_placeholder_brush_initial')
                      : editHotspot
                        ? t('main.retouch_placeholder_ready')
                        : t('main.retouch_placeholder_initial')
                  }
                  className={`flex-grow border rounded-lg p-5 text-lg focus-visible:ring-2 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 ${editorTheme.input}`}
                  disabled={isLoading || !retouchTargetReady}
                />
                <div className="flex flex-col items-stretch gap-1.5">
                  <button
                    type="submit"
                    className={`text-white font-bold py-5 px-8 text-lg rounded-lg transition-colors duration-200 ease-in-out hover:-translate-y-px active:scale-95 active: disabled:cursor-not-allowed disabled:transform-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${editorTheme.submitButton}`}
                    disabled={isLoading || !prompt.trim() || !retouchTargetReady}
                  >
                    {t('main.btn_generate')}
                  </button>
                  <CostEstimateBadge />
                </div>
              </form>
              <SavedPromptsBar
                scope="retouch"
                value={prompt}
                onApply={setPrompt}
                disabled={isLoading || !retouchTargetReady}
                className="w-full"
              />
            </div>
          )}
          {activeTab === 'crop' && (
            <CropPanel
              onApplyCrop={handleApplyCrop}
              onSetAspect={setAspect}
              isLoading={isLoading}
              isCropping={!!completedCrop?.width && completedCrop.width > 0}
            />
          )}
          {activeTab === 'adjust' && (
            <AdjustmentPanel
              onApplyAdjustment={handleApplyAdjustment}
              isLoading={isLoading}
              initialPrompt={
                initialGalleryPreset?.tab === 'adjust' ? initialGalleryPreset.prompt : undefined
              }
            />
          )}
          {activeTab === 'filters' && (
            <FilterPanel
              onApplyFilter={handleApplyFilter}
              isLoading={isLoading}
              initialPrompt={
                initialGalleryPreset?.tab === 'filters' ? initialGalleryPreset.prompt : undefined
              }
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-colors duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)]"
            aria-label="Undo last action"
          >
            <UndoIcon className="w-5 h-5 mr-2" />
            {t('main.btn_undo')}
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-colors duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)]"
            aria-label="Redo last action"
          >
            <RedoIcon className="w-5 h-5 mr-2" />
            {t('main.btn_redo')}
          </button>

          <div className="h-6 w-px bg-gray-600 mx-1 hidden sm:block"></div>

          {canUndo && activeTab !== 'crop' && (
            <button
              type="button"
              onClick={() => setIsComparing((prev) => !prev)}
              aria-pressed={isComparing}
              className={`flex items-center justify-center text-center border font-semibold py-3 px-5 rounded-md transition-colors duration-200 ease-in-out active:scale-95 text-base cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)] ${
                isComparing
                  ? 'brand-bg theme-border-strong text-white hover:opacity-95'
                  : 'bg-white/10 border-white/20 text-gray-200 hover:bg-white/20 hover:border-white/30'
              }`}
            >
              <EyeIcon className="w-5 h-5 mr-2" />
              {isComparing ? t('main.compare_exit') : t('main.btn_compare')}
            </button>
          )}

          <button
            onClick={handleReset}
            disabled={!canUndo}
            className="text-center bg-transparent border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-colors duration-200 ease-in-out hover:bg-white/10 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)]"
          >
            {t('main.btn_reset')}
          </button>
          <button
            onClick={handleUploadNew}
            className="text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-colors duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)]"
          >
            {t('main.btn_start_over')}
          </button>

          <button
            onClick={handleDownload}
            className="flex-grow sm:flex-grow-0 ml-auto brand-bg text-white font-bold py-3 px-5 rounded-md transition-colors duration-200 ease-in-out hover:-translate-y-px active:scale-95 active: text-base cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
          >
            {t('main.btn_download')}
          </button>
        </div>
      </div>
    );
  };

  const acceptUploadedFile = useCallback(
    (file: File) => {
      void applyValidatedImageFile(
        file,
        t,
        (validFile) => {
          void (async () => {
            // Prefer pending remix (set by applyViralTemplate); fall back to banner id.
            const pending = consumePendingRemix();
            const fromPending = pending ? await remixToEditorPreset(pending) : null;
            if (fromPending?.prompt) setPrompt(fromPending.prompt);
            if (fromPending?.tab) setActiveTab(fromPending.tab);
            setHistory([validFile]);
            setHistoryIndex(0);
            setError(null);
            try {
              window.scrollTo(0, 0);
            } catch {
              /* jsdom */
            }
          })();
        },
        (msg) => setError(msg),
      );
    },
    [t],
  );

  if (!currentImage) {
    if (!awaitUpload && !viralTemplateId) {
      return <Navigate to={ROUTES.HOME} replace />;
    }

    return (
      <div
        className={`${UI_PAGE} ${getPageSurface(theme)} w-full max-w-2xl mx-auto flex flex-col items-center gap-5 animate-fade-in`}
        data-testid="viral-editor-upload"
      >
        {viralTemplateId && (
          <ViralTemplateBanner
            templateId={viralTemplateId}
            hintKey="viral.upload_for_template"
            testId="viral-template-banner-upload"
          />
        )}
        {error && <ErrorDisplay message={error} />}
        <div
          ref={uploadZoneRef}
          tabIndex={0}
          role="group"
          aria-label={t('viral.upload_drag')}
          data-testid="viral-editor-upload-zone"
          className="p-10 border-2 border-dashed rounded-2xl theme-border theme-raised w-full flex flex-col items-center justify-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:brand-ring"
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) acceptUploadedFile(file);
          }}
        >
          <button
            type="button"
            className={`${UI_BTN_PRIMARY} inline-flex items-center gap-2 px-8 py-4 text-lg`}
            data-testid="viral-editor-upload-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="w-5 h-5" />
            {t('viral.upload_button')}
          </button>
          <p className="text-sm theme-ink-muted">{t('viral.upload_drag')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            data-testid="viral-editor-upload-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) acceptUploadedFile(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    );
  }

  return renderEditor();
};

export default EditorPage;
