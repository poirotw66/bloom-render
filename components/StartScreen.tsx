/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UploadIcon, MagicWandIcon, DownloadIcon, EditIcon } from './icons';
import { generateImageFromText } from '../services/geminiService';
import { formatApiErrorMessage } from '../services/gemini/shared';
import { logger } from '../utils/logger';
import { dataURLtoFile } from '../utils/fileUtils';
import { downloadBatchWithZipFallback } from '../utils/downloadHelpers';
import { allFailedError } from '../utils/generationHelpers';
import { buildHistoryOptions } from '../utils/historyOptions';
import { useGenerationFailures } from '../hooks/useGenerationFailures';
import { useHistory } from '../hooks/useHistory';
import { fileFromSourceUrl, useHistoryReplay } from '../hooks/useHistoryReplay';
import { usePasteImage } from '../hooks/usePasteImage';
import CostEstimateBadge from './CostEstimateBadge';
import ResultActions from './ResultActions';
import ResultImage from './ResultImage';
import { SUPPORTED_MODELS, MODEL_LABEL_KEYS } from '../constants/models';
import type { ModelType } from '../constants/models';
import BloomFlowerLoader from './BloomFlowerLoader';
import { ErrorDisplay } from './ErrorDisplay';
import SavedPromptsBar from './SavedPromptsBar';
import ApiKeyNotice from './ApiKeyNotice';
import DemoModeBanner from './DemoModeBanner';
import ExampleShowcase from './ExampleShowcase';
import HomeGallery from './HomeGallery';
const ViralTemplatesSection = React.lazy(() => import('./ViralTemplatesSection'));
import GenerationFailureNotice from './GenerationFailureNotice';
import ProgressIndicator from './ProgressIndicator';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { demoAssetsForFeature, fetchPublicImageAsFile } from '../services/imageProviders';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeType } from '../contexts/ThemeContext';
import { applyValidatedImageFile } from '../utils/applyValidatedImageFile';
import type { GenerateGalleryLocationState } from '../utils/applyPromptGalleryPreset';
import {
  UI_BTN_GHOST,
  UI_BTN_PRIMARY,
  UI_BTN_SECONDARY,
  UI_BTN_SUCCESS,
  UI_FILE_PICKER,
  UI_LABEL_HINT,
  UI_PAGE,
  UI_SUBTITLE,
  UI_TITLE,
  getPageSurface,
} from '../utils/uiClasses';

/** One model's outcome in a side-by-side comparison run. */
interface CompareSlotResult {
  model: ModelType;
  url: string;
  /** Wall-clock ms around the API call only; see start.compare_timing_caveat. */
  elapsedMs: number;
  slotIndex: number;
}

type StartTab = 'upload' | 'generate';

/** Shared shape for the aspect-ratio / image-count segmented controls. */
const OPTION_BTN =
  'px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-50';

interface StartScreenProps {
  tab: StartTab;
  onImageSelected: (file: File) => void;
  navigate: (path: string) => void;
}

/** Theme-based class snippets for StartScreen (bloom / night / newyear) */
const themeStyles = {
  bloom: {
    drag: 'brand-bg-tint border-dashed brand-border',
    slogan: 'brand-text-soft',
    border: 'brand-border-soft hover:brand-border',
    borderCard: 'brand-border-soft',
    btn: 'brand-bg focus-visible:brand-ring',
    btnSecondary: 'brand-bg-strong brand-border',
    inputFocus: 'focus-visible:brand-ring focus:brand-border',
    cardIcon: 'brand-bg-tint brand-border-soft',
    cardIconText: 'brand-text',
    generateBtn: 'brand-bg-strong hover:opacity-95 focus-visible:brand-ring',
    titleAccent: 'brand-text-soft',
  },
  night: {
    drag: 'bg-blue-500/10 border-dashed border-blue-400',
    slogan: 'text-slate-300',
    border: 'border-blue-500/30 hover:border-blue-400/50',
    borderCard: 'border-slate-600/50',
    btn: 'bg-blue-600 focus-visible:ring-blue-400',
    btnSecondary: 'bg-blue-600 border-blue-500/50',
    inputFocus: 'focus-visible:ring-blue-500 focus:border-blue-500/50',
    cardIcon: 'bg-blue-500/20 border-blue-400/30',
    cardIconText: 'text-cyan-300',
    generateBtn: 'bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-500',
    titleAccent: 'text-cyan-300',
  },
  newyear: {
    drag: 'bg-red-500/10 border-dashed border-red-400',
    slogan: 'text-red-200',
    border: 'border-red-500/30 hover:border-red-400/50',
    borderCard: 'border-red-700/50',
    btn: 'bg-red-600 focus-visible:ring-red-400',
    btnSecondary: 'bg-red-600 border-red-500/50',
    inputFocus: 'focus-visible:ring-red-500 focus:border-red-500/50',
    cardIcon: 'bg-red-500/20 border-red-400/30',
    cardIconText: 'text-amber-300',
    generateBtn: 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-500',
    titleAccent: 'text-amber-300',
  },
} as const satisfies Record<ThemeType, Record<string, string>>;

const StartScreen: React.FC<StartScreenProps> = ({ tab, onImageSelected, navigate: _navigate }) => {
  const { t } = useLanguage();
  const settings = useSettings();
  const { theme } = useTheme();
  const { addToHistory } = useHistory();
  const location = useLocation();
  const routerNavigate = useNavigate();
  const s = themeStyles[theme];
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const galleryPreset = (location.state as GenerateGalleryLocationState | null)?.galleryPreset;
  const viralTemplateId = galleryPreset?.viralTemplateId;
  const [generationPrompt, setGenerationPrompt] = useState(() => galleryPreset?.prompt ?? '');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9' | '9:16'>(
    () => galleryPreset?.aspectRatio ?? '1:1',
  );
  const [numberOfImages, setNumberOfImages] = useState<number>(() => galleryPreset?.quantity ?? 1);

  useEffect(() => {
    if (!galleryPreset) return;
    routerNavigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- consume gallery state once on mount
  }, []);

  useHistoryReplay((payload) => {
    if (payload.type !== 'generate') return;
    const opts = payload.options ?? {};
    if (typeof opts.prompt === 'string') setGenerationPrompt(opts.prompt);
    if (
      opts.aspectRatio === '1:1' ||
      opts.aspectRatio === '3:4' ||
      opts.aspectRatio === '4:3' ||
      opts.aspectRatio === '16:9' ||
      opts.aspectRatio === '9:16'
    ) {
      setAspectRatio(opts.aspectRatio);
    }
    if (typeof opts.numberOfImages === 'number') setNumberOfImages(opts.numberOfImages);
    if (payload.sourceUrl) {
      void fileFromSourceUrl(payload.sourceUrl, 'generate-reference.png').then(setReferenceFile);
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!referenceFile) {
      setReferenceUrl(null);
      return;
    }
    const url = URL.createObjectURL(referenceFile);
    setReferenceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [referenceFile]);

  // Comparison is a separate, opt-in run rather than a mode baked into
  // handleGenerateClick: a visitor who never touches the toggle must keep
  // paying for exactly one API call, byte-for-byte the same as before this
  // feature existed.
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareModel, setCompareModel] = useState<ModelType | null>(null);
  const [compareResults, setCompareResults] = useState<CompareSlotResult[]>([]);
  const [compareRunModels, setCompareRunModels] = useState<ModelType[]>([]);
  const compareRun = useGenerationFailures();

  // Excludes the primary model so the two slots can never collide, which
  // would make partitionSettled's model-based bookkeeping ambiguous.
  const otherModels = SUPPORTED_MODELS.filter((m) => m !== settings.model);
  // SUPPORTED_MODELS is typed as an array, not a tuple, so `otherModels[0]` is
  // typed ModelType even when the list is empty. Cut the whole feature in that
  // case rather than let an undefined model id reach MODEL_LABEL_KEYS and
  // render a blank card with nothing to compare against.
  // Model compare is Gemini-only (compares Gemini model ids side-by-side).
  const canCompare = settings.imageProvider === 'gemini' && otherModels.length > 0;
  const effectiveCompareModel: ModelType =
    compareModel && otherModels.includes(compareModel) ? compareModel : otherModels[0];

  // Only one of the two flows can occupy the button at a time, but flipping
  // the toggle mid-request must not silently swap which flow "isGenerating"
  // is guarding — so anything that can start a new run checks both.
  const anyRunning = isGenerating || compareRun.isRunning;
  const busy = compareEnabled ? compareRun.isRunning : isGenerating;

  const pickUploadFile = useCallback(
    (file: File) => {
      void applyValidatedImageFile(file, t, onImageSelected, setError);
    },
    [onImageSelected, t],
  );

  const uploadZoneRef = useRef<HTMLDivElement>(null);
  usePasteImage(uploadZoneRef, pickUploadFile, {
    enabled: tab === 'upload' && !settings.isDemoMode,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      pickUploadFile(e.target.files[0]);
    }
  };

  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    void applyValidatedImageFile(file, t, setReferenceFile, setError);
  };

  const handleGenerateClick = async () => {
    if (!generationPrompt.trim()) {
      setError(t('start.error_no_prompt'));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const urls = await generateImageFromText(
        generationPrompt,
        aspectRatio,
        numberOfImages,
        settings.toServiceSettings(),
        referenceFile,
        { viralTemplateId },
      );
      for (const [index, url] of urls.entries()) {
        void addToHistory(
          'generate',
          url,
          buildHistoryOptions('generate', settings, {
            prompt: generationPrompt,
            aspectRatio,
            numberOfImages,
            variationIndex: index,
            hasReference: Boolean(referenceFile),
          }),
        );
      }
      if (urls.length === 1) {
        // If only one image, proceed directly to editing
        const newFile = dataURLtoFile(urls[0], `generated-${Date.now()}.png`);
        onImageSelected(newFile);
      } else {
        // If multiple images, show selection screen
        setGeneratedImages(urls);
      }
    } catch (err) {
      setError(formatApiErrorMessage(err, t, 'generation'));
      logger.error('Text-to-image generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const runCompareSlot = (model: ModelType, slotIndex: number, signal: AbortSignal) => {
    const start = performance.now();
    // Model compare is Gemini-only (compares Gemini model ids).
    return generateImageFromText(generationPrompt, aspectRatio, 1, {
      provider: 'gemini',
      apiKey: settings.apiKey,
      model,
      abortSignal: signal,
    }).then((urls): CompareSlotResult => {
      const url = urls[0];
      void addToHistory(
        'generate',
        url,
        buildHistoryOptions(
          'generate',
          { imageProvider: 'gemini', model },
          {
            prompt: generationPrompt,
            aspectRatio,
            numberOfImages: 1,
            compare: true,
            slotIndex,
          },
        ),
      );
      return {
        model,
        url,
        elapsedMs: performance.now() - start,
        slotIndex,
      };
    });
  };

  const handleCompareGenerateClick = async () => {
    if (!generationPrompt.trim()) {
      setError(t('start.error_no_prompt'));
      return;
    }

    const modelsToRun: ModelType[] = [settings.model, effectiveCompareModel];
    setCompareRunModels(modelsToRun);
    setError(null);
    setCompareResults([]);

    try {
      const { results, failures, cancelled } = await compareRun.runBatch(2, (index, signal) =>
        runCompareSlot(modelsToRun[index], index, signal),
      );
      if (cancelled) return;

      // Both models failing almost always shares one cause (bad key, blocked
      // prompt); fall back to the same single-error banner the plain flow
      // uses instead of a comparison grid with nothing successful to show.
      if (results.length === 0) {
        throw allFailedError(failures);
      }
      setCompareResults(results);
    } catch (err) {
      setError(formatApiErrorMessage(err, t, 'generation'));
      logger.error('Model comparison generation failed:', err);
    }
  };

  const handleCompareRetryFailed = async () => {
    try {
      const { results: recovered, cancelled } = await compareRun.retryFailed((index, signal) =>
        runCompareSlot(compareRunModels[index], index, signal),
      );
      if (cancelled || recovered.length === 0) return;
      setCompareResults((prev) => [...prev, ...recovered]);
    } catch (err) {
      setError(formatApiErrorMessage(err, t, 'generation'));
      logger.error('Model comparison retry failed:', err);
    }
  };

  const handleCompareReset = () => {
    setCompareResults([]);
    setCompareRunModels([]);
    compareRun.reset();
  };

  const handleCompareSelect = (url: string, slotIndex: number) => {
    const newFile = dataURLtoFile(url, `generated-compare-${Date.now()}-${slotIndex}.png`);
    onImageSelected(newFile);
  };

  const handleCompareDownload = (url: string, model: ModelType) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-${model}-${Date.now()}.png`;
    link.click();
  };

  const handleSelectGenerated = (url: string, index: number) => {
    const newFile = dataURLtoFile(url, `generated-${Date.now()}-${index}.png`);
    onImageSelected(newFile);
  };

  const handleDownloadOne = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `generated-${index + 1}.png`;
    link.click();
  };

  const handleDownloadAllZip = async () => {
    await downloadBatchWithZipFallback({
      sources: generatedImages,
      itemFileName: (i) => `generated-${i + 1}.png`,
      zipFileName: `generated-images-${Date.now()}.zip`,
    });
  };

  return (
    <div
      className={`${UI_PAGE} ${getPageSurface(theme)} ${isDraggingOver && tab === 'upload' ? s.drag : ''}`}
      onDragOver={(e) => {
        if (tab === 'upload') {
          e.preventDefault();
          setIsDraggingOver(true);
        }
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        if (tab === 'upload') {
          pickUploadFile(file);
        }
      }}
    >
      <div className="flex flex-col items-center gap-8 max-[640px]:gap-3 animate-fade-in">
        <img
          src={`${import.meta.env.BASE_URL}logo/bloomrender_bg.png`}
          alt=""
          className="w-24 h-24 max-[640px]:w-14 max-[640px]:h-14 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain drop-"
          aria-hidden="true"
        />
        <h1 className={`${UI_TITLE} max-[640px]:text-2xl`}>
          {t('start.title_part1')} <span className={s.titleAccent}>{t('start.title_part2')}</span>.
        </h1>
        <p
          className={`text-base md:text-lg ${s.slogan} font-medium italic mt-1 max-[640px]:text-sm max-[640px]:mt-0`}
        >
          {t('app.slogan')}
        </p>
        {/* On narrow phones, skip the long subtitle so the before/after can sit
            in the first viewport (Wave Q / A5). */}
        <p className={`${UI_SUBTITLE} max-[640px]:hidden`}>{t('start.subtitle')}</p>

        {/* Mobile first viewport: show a real before/after result immediately
            (≤640px). Desktop keeps the fuller showcase below the fold. */}
        {tab === 'upload' && (
          <div className="w-full max-[640px]:block min-[641px]:hidden">
            <ExampleShowcase feature="editor" variant="hero" autoPlay className="mt-0" />
          </div>
        )}

        {/* No-key visitors need the API notice in the first viewport, before the
            gallery pushes it below the fold. */}
        <ApiKeyNotice />
        <DemoModeBanner />

        {(location.state as { remixReady?: boolean } | null)?.remixReady && (
          <p
            className="w-full max-w-2xl text-sm theme-ink rounded-xl border theme-border theme-raised px-4 py-3"
            role="status"
            data-testid="remix-ready-banner"
          >
            {t('viral.remix_ready')}
          </p>
        )}

        {/* Viral one-tap 玩法 — discoverable above the fold on landing. */}
        {tab === 'upload' && (
          <Suspense fallback={null}>
            <ViralTemplatesSection className="mt-6 sm:mt-8 w-full max-w-6xl" />
          </Suspense>
        )}

        {/* Results first. Landing straight on an empty upload box asks the
            visitor to commit a photo before seeing a single thing the models
            can do; the gallery answers that question up front and doubles as
            navigation into each feature. */}
        {tab === 'upload' && <HomeGallery className="mt-8 sm:mt-10 w-full max-w-6xl" />}

        {tab === 'upload' ? (
          <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
            <h2 className="text-lg font-bold text-gray-200">{t('gallery.start_editing')}</h2>
            <div
              ref={uploadZoneRef}
              tabIndex={settings.isDemoMode ? undefined : 0}
              role="group"
              aria-label={t('start.upload_drag')}
              className={`p-12 border-2 border-dashed rounded-2xl bg-gray-800/50 w-full max-w-2xl flex flex-col items-center justify-center gap-4 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${s.border}`}
            >
              {settings.isDemoMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const before = demoAssetsForFeature('editor').before;
                      if (!before) return;
                      void fetchPublicImageAsFile(before, 'demo-editor-sample.webp').then(
                        onImageSelected,
                      );
                    }}
                    className={`relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white rounded-xl cursor-pointer group hover:opacity-95 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${s.btn}`}
                  >
                    <UploadIcon className="w-6 h-6 mr-3" />
                    {t('demo.open_editor_sample')}
                  </button>
                  <p className="text-sm text-sky-200/80 text-center max-w-sm">
                    {t('demo.sample_only_hint')}
                  </p>
                </>
              ) : (
                <>
                  <label
                    htmlFor="image-upload-start"
                    className={`relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white rounded-xl cursor-pointer group hover:opacity-95 transition-colors duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 ${s.btn}`}
                  >
                    <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-300 ease-in-out group-hover:rotate-[360deg] group-hover:scale-110" />
                    {t('start.upload_button')}
                  </label>
                  <input
                    id="image-upload-start"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    aria-label={t('start.upload_button')}
                  />
                  <p className="text-sm text-gray-300">{t('start.upload_drag')}</p>
                  {error && <ErrorDisplay message={error} className="mt-2 w-full max-w-md" />}
                </>
              )}
            </div>
          </div>
        ) : generatedImages.length > 0 ? (
          <div
            className={`flex flex-col items-center gap-6 w-full max-w-4xl animate-fade-in bg-gray-800/40 p-6 rounded-2xl border ${s.borderCard}`}
          >
            <h3 className="text-xl font-bold text-white">{t('start.select_image')}</h3>
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              {generatedImages.length > 1 && (
                <button type="button" onClick={handleDownloadAllZip} className={UI_BTN_SUCCESS}>
                  <DownloadIcon className="w-5 h-5" />
                  {t('start.download_all_zip')}
                </button>
              )}
              <button type="button" onClick={() => setGeneratedImages([])} className={UI_BTN_GHOST}>
                {t('start.generate_new')}
              </button>
            </div>
            <div
              className={`grid gap-4 w-full ${generatedImages.length >= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
            >
              {generatedImages.map((url, idx) => (
                <article
                  key={idx}
                  className={`group rounded-xl overflow-hidden border transition-colors duration-200 bg-gray-900 ${
                    theme === 'newyear'
                      ? 'border-red-900/40 hover:border-red-400'
                      : theme === 'bloom'
                        ? 'brand-border-soft hover:brand-border-soft'
                        : 'border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <div className="aspect-square flex items-center justify-center bg-gray-950 p-3">
                    <ResultImage
                      resultUrl={url}
                      originalUrl={referenceUrl}
                      alt={`${t('start.select_image')} ${idx + 1}`}
                      imageClassName="max-w-full max-h-full w-auto h-auto object-contain"
                    />
                  </div>
                  <div className="p-3 flex flex-col gap-3">
                    <span className="text-sm font-medium text-gray-300">
                      {t('start.select_image')} {idx + 1}
                    </span>
                    <ResultActions
                      result={url}
                      originalUrl={referenceUrl}
                      fileBaseName={`generated-${idx + 1}`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectGenerated(url, idx)}
                        className={UI_BTN_PRIMARY}
                        aria-label={`${t('start.edit_this')} ${idx + 1}`}
                      >
                        <EditIcon className="w-4 h-4" />
                        {t('start.edit_this')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadOne(url, idx)}
                        className={UI_BTN_SECONDARY}
                        aria-label={t('start.download_image')}
                      >
                        <DownloadIcon className="w-4 h-4" />
                        {t('start.download_image')}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : compareEnabled && (compareRun.isRunning || compareResults.length > 0) ? (
          <div
            className={`flex flex-col items-center gap-6 w-full max-w-4xl animate-fade-in bg-gray-800/40 p-6 rounded-2xl border ${s.borderCard}`}
          >
            <h3 className="text-xl font-bold text-white">{t('start.compare_results_title')}</h3>

            {compareRun.isRunning ? (
              <ProgressIndicator
                statusMessages={['start.compare_generating']}
                onCancel={compareRun.cancel}
              />
            ) : (
              <>
                <GenerationFailureNotice
                  failures={compareRun.failures}
                  requestedCount={compareRun.requestedCount}
                  succeededCount={compareRun.succeededCount}
                  isRetrying={compareRun.isRetrying}
                  onRetry={handleCompareRetryFailed}
                  context="generation"
                  className="w-full"
                />

                <p className="text-sm text-gray-300 -mt-2">{t('start.compare_timing_caveat')}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {compareRunModels.map((model, slotIndex) => {
                    const result = compareResults.find((r) => r.slotIndex === slotIndex);
                    const failure = compareRun.failures.find((f) => f.index === slotIndex);
                    return (
                      <article
                        key={slotIndex}
                        className={`flex flex-col rounded-xl overflow-hidden border transition-colors duration-200 bg-gray-900 ${
                          theme === 'newyear'
                            ? 'border-red-900/40'
                            : theme === 'bloom'
                              ? 'brand-border-soft'
                              : 'border-slate-700'
                        }`}
                      >
                        <div className="p-3 flex items-center justify-between gap-2 border-gray-700/50">
                          <span className="text-sm font-bold text-gray-100 truncate">
                            {t(MODEL_LABEL_KEYS[model])}
                          </span>
                          {result && (
                            <span className="text-sm text-gray-300 shrink-0">
                              {t('start.compare_elapsed', {
                                seconds: (result.elapsedMs / 1000).toFixed(1),
                              })}
                            </span>
                          )}
                        </div>
                        {result ? (
                          <>
                            <div className="aspect-square flex items-center justify-center bg-gray-950 p-3">
                              <img
                                src={result.url}
                                className="max-w-full max-h-full w-auto h-auto object-contain"
                                alt={t('start.compare_result_alt', {
                                  model: t(MODEL_LABEL_KEYS[model]),
                                  prompt: generationPrompt,
                                })}
                              />
                            </div>
                            <div className="p-3 flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleCompareSelect(result.url, slotIndex)}
                                className={UI_BTN_PRIMARY}
                                aria-label={`${t('start.edit_this')} — ${t(MODEL_LABEL_KEYS[model])}`}
                              >
                                <EditIcon className="w-4 h-4" />
                                {t('start.edit_this')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCompareDownload(result.url, model)}
                                className={UI_BTN_SECONDARY}
                                aria-label={`${t('start.download_image')} — ${t(MODEL_LABEL_KEYS[model])}`}
                              >
                                <DownloadIcon className="w-4 h-4" />
                                {t('start.download_image')}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center p-6 min-h-[10rem]">
                            {failure && (
                              <ErrorDisplay
                                message={formatApiErrorMessage(failure.reason, t, 'generation')}
                                className="text-center"
                              />
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>

                <button type="button" onClick={handleCompareReset} className={UI_BTN_GHOST}>
                  {t('start.generate_new')}
                </button>
              </>
            )}
          </div>
        ) : (
          <div
            className={`flex flex-col items-center gap-6 w-full max-w-4xl animate-fade-in bg-gray-800/40 p-8 md:p-10 rounded-2xl border ${s.borderCard}`}
          >
            <textarea
              id="generate-prompt"
              value={generationPrompt}
              onChange={(e) => setGenerationPrompt(e.target.value)}
              placeholder={t('start.prompt_placeholder')}
              aria-label={t('start.prompt_placeholder')}
              className={`w-full h-40 md:h-44 bg-gray-900/50 border border-gray-600 rounded-xl p-5 text-gray-100 placeholder-gray-500 focus:outline-none focus-visible:ring-2 resize-none transition-colors duration-200 text-base ${s.inputFocus}`}
              disabled={busy}
            />

            <SavedPromptsBar
              scope="generate"
              value={generationPrompt}
              onApply={setGenerationPrompt}
              disabled={busy}
              className="w-full -mt-2"
            />

            <div className="w-full text-left">
              <span className={UI_LABEL_HINT}>{t('start.reference_image_label')}</span>
              <p className="text-sm text-gray-400 mb-2">{t('start.reference_image_hint')}</p>
              {referenceFile ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-600 bg-gray-900 flex-shrink-0">
                    {referenceUrl && (
                      <img
                        src={referenceUrl}
                        alt={t('start.reference_image_label')}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setReferenceFile(null)}
                    disabled={isGenerating}
                    className="text-sm text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {t('start.reference_image_remove')}
                  </button>
                </div>
              ) : (
                <label htmlFor="generate-reference-upload" className={UI_FILE_PICKER}>
                  <input
                    id="generate-reference-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    disabled={isGenerating}
                    onChange={handleReferenceFileChange}
                  />
                  <UploadIcon className="w-4 h-4" />
                  {t('start.reference_image_btn')}
                </label>
              )}
            </div>

            <div className="w-full flex flex-col md:flex-row gap-6">
              <div className="flex-grow">
                <span
                  id="aspect-ratio-label"
                  className="block text-left text-sm font-medium text-gray-300 mb-3"
                >
                  {t('start.aspect_ratio')}
                </span>
                <div
                  className="flex flex-wrap gap-3"
                  role="group"
                  aria-labelledby="aspect-ratio-label"
                >
                  {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      disabled={busy}
                      aria-pressed={aspectRatio === ratio}
                      className={`${OPTION_BTN} ${
                        aspectRatio === ratio
                          ? `border  ${s.btnSecondary} text-white`
                          : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
              {!compareEnabled && (
                <div className="w-full md:w-auto">
                  <span
                    id="image-count-label"
                    className="block text-left text-sm font-medium text-gray-300 mb-3"
                  >
                    {t('start.image_count')}
                  </span>
                  {/* A segmented control instead of a number field: the range is 1-4,
                      so there is nothing to type and no invalid state to recover from. */}
                  <div
                    className="flex flex-wrap gap-3"
                    role="group"
                    aria-labelledby="image-count-label"
                  >
                    {[1, 2, 3, 4].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setNumberOfImages(count)}
                        disabled={busy}
                        aria-pressed={numberOfImages === count}
                        className={`${OPTION_BTN} min-w-[3rem] ${
                          numberOfImages === count
                            ? `border  ${s.btnSecondary} text-white`
                            : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Opt-in and off by default: a visitor who just wants one image
                must never silently pay for two API calls. */}
            {canCompare && (
              <div
                className={`w-full rounded-xl border bg-gray-900/30 p-4 text-left ${s.borderCard}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="compare-models-toggle"
                    checked={compareEnabled}
                    onChange={(e) => setCompareEnabled(e.target.checked)}
                    disabled={anyRunning}
                    className={`mt-1 w-4 h-4 rounded cursor-pointer bg-gray-800 border-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-50 ${s.inputFocus}`}
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="compare-models-toggle"
                      className="block text-sm font-bold text-gray-200 cursor-pointer"
                    >
                      {t('start.compare_toggle_label')}
                    </label>
                    <p className="text-sm text-gray-300 mt-1">{t('start.compare_cost_note')}</p>

                    {compareEnabled && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-gray-400">{t('start.compare_comparing_label')}</span>
                        <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-gray-200 font-medium">
                          {t(MODEL_LABEL_KEYS[settings.model])}
                        </span>
                        <span className="text-gray-500" aria-hidden="true">
                          {t('start.compare_vs')}
                        </span>
                        <label htmlFor="compare-second-model" className="sr-only">
                          {t('start.compare_second_model_label')}
                        </label>
                        <select
                          id="compare-second-model"
                          value={effectiveCompareModel}
                          onChange={(e) => setCompareModel(e.target.value as ModelType)}
                          disabled={anyRunning}
                          className={`bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-1.5 text-gray-100 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${s.inputFocus}`}
                        >
                          {otherModels.map((m) => (
                            <option key={m} value={m}>
                              {t(MODEL_LABEL_KEYS[m])}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && <ErrorDisplay message={error} className="mt-2" />}

            {(settings.model === 'gemini-nano-banana-2.1' ||
              (compareEnabled && effectiveCompareModel === 'gemini-nano-banana-2.1')) && (
              <p className="text-sm text-gray-300">{t('start.generate_pro_slow_hint')}</p>
            )}

            <button
              type="button"
              onClick={compareEnabled ? handleCompareGenerateClick : handleGenerateClick}
              disabled={anyRunning || !generationPrompt.trim()}
              aria-busy={busy}
              className={`w-full mt-2 text-white font-bold py-5 px-8 rounded-xl text-base transition-colors duration-200 ease-in-out hover:-translate-y-px active:scale-95 active: disabled:brand-bg disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${s.generateBtn}`}
            >
              {busy ? (
                <>
                  <BloomFlowerLoader size={24} className="shrink-0" />{' '}
                  {compareEnabled ? t('start.compare_generating') : t('start.generating')}
                </>
              ) : (
                <>
                  <MagicWandIcon className="w-6 h-6" />{' '}
                  {compareEnabled ? t('start.compare_generate_button') : t('start.generate_button')}
                </>
              )}
            </button>
            <CostEstimateBadge
              quantity={compareEnabled ? 2 : numberOfImages}
              imageSize="1K"
              className="mt-1"
            />
          </div>
        )}

        {tab === 'upload' && (
          <div className="max-[640px]:hidden">
            <ExampleShowcase feature="editor" />
          </div>
        )}

        {tab === 'generate' &&
          generatedImages.length === 0 &&
          !isGenerating &&
          !(compareEnabled && (compareRun.isRunning || compareResults.length > 0)) && (
            <>
              <Suspense fallback={null}>
                <ViralTemplatesSection className="mt-6" compact />
              </Suspense>
              <ExampleShowcase feature="generate" />
            </>
          )}

        {tab === 'upload' && (
          <section
            className="mt-16 w-full max-w-3xl mx-auto text-left animate-fade-in"
            aria-label={`${t('start.feature_retouch_title')}, ${t('start.feature_filter_title')}, ${t('start.feature_adjust_title')}`}
          >
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8 list-none p-0 m-0">
              <li>
                <p className={`text-base font-semibold ${s.cardIconText}`}>
                  {t('start.feature_retouch_title')}
                </p>
                <p className="mt-2 text-base text-gray-300 leading-relaxed">
                  {t('start.feature_retouch_desc')}
                </p>
              </li>
              <li>
                <p className={`text-base font-semibold ${s.cardIconText}`}>
                  {t('start.feature_filter_title')}
                </p>
                <p className="mt-2 text-base text-gray-300 leading-relaxed">
                  {t('start.feature_filter_desc')}
                </p>
              </li>
              <li>
                <p className={`text-base font-semibold ${s.cardIconText}`}>
                  {t('start.feature_adjust_title')}
                </p>
                <p className="mt-2 text-base text-gray-300 leading-relaxed">
                  {t('start.feature_adjust_desc')}
                </p>
              </li>
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default StartScreen;
