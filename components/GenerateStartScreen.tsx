/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UploadIcon, MagicWandIcon, DownloadIcon, EditIcon } from './icons';
import { generateImageFromText } from '../services/geminiService';
import { formatApiErrorMessage } from '../services/gemini/shared';
import { logger } from '../utils/logger';
import { dataURLtoFile } from '../utils/fileUtils';
import { downloadBatchWithZipFallback } from '../utils/downloadHelpers';
import { allFailedError } from '../utils/generationHelpers';
import { buildHistoryOptions } from '../utils/historyOptions';
import { useGenerationFailures, type IndexedGenerationTask } from '../hooks/useGenerationFailures';
import { useGenerationAttempt } from '../hooks/useGenerationAttempt';
import { useHistory } from '../hooks/useHistory';
import { fileFromSourceUrl, useHistoryReplay } from '../hooks/useHistoryReplay';
import CostEstimateBadge from './CostEstimateBadge';
import ResultActions from './ResultActions';
import ResultImage from './ResultImage';
import { SUPPORTED_MODELS, MODEL_LABEL_KEYS } from '../constants/models';
import type { ModelType } from '../constants/models';
import BloomFlowerLoader from './BloomFlowerLoader';
import { ErrorDisplay } from './ErrorDisplay';
import SavedPromptsBar from './SavedPromptsBar';
import ExampleShowcase from './ExampleShowcase';
import ViralTemplateBanner from './ViralTemplateBanner';
const ViralTemplatesSection = React.lazy(() => import('./ViralTemplatesSection'));
import GenerationFailureNotice from './GenerationFailureNotice';
import ProgressIndicator from './ProgressIndicator';
import StartScreenIntro from './StartScreenIntro';
import { themeStyles } from './startScreenStyles';
import type { StartScreenProps } from './StartScreen';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
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

/** Shared shape for the aspect-ratio / image-count segmented controls. */
const OPTION_BTN =
  'px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-50';

const GenerateStartScreen: React.FC<Omit<StartScreenProps, 'tab'> & { active?: boolean }> = ({
  onImageSelected,
  active = true,
}) => {
  const { t } = useLanguage();
  const settings = useSettings();
  const { theme } = useTheme();
  const { addToHistory } = useHistory();
  const location = useLocation();
  const routerNavigate = useNavigate();
  const s = themeStyles[theme];
  const galleryPreset = (location.state as GenerateGalleryLocationState | null)?.galleryPreset;
  const [viralTemplateId] = useState(() => galleryPreset?.viralTemplateId);
  const [generationPrompt, setGenerationPrompt] = useState(() => galleryPreset?.prompt ?? '');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9' | '9:16'>(
    () => galleryPreset?.aspectRatio ?? '1:1',
  );
  const [numberOfImages, setNumberOfImages] = useState<number>(() => galleryPreset?.quantity ?? 1);

  useEffect(() => {
    if (!galleryPreset) return;
    routerNavigate(location.pathname, { replace: true, state: null });
    try {
      window.scrollTo(0, 0);
    } catch {
      /* jsdom */
    }
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
  const generationRun = useGenerationFailures();
  const generationAttempts = useGenerationAttempt();
  const generationTaskRef = useRef<IndexedGenerationTask<{ index: number; url: string }> | null>(
    null,
  );
  const generatedSlotsRef = useRef<Array<{ index: number; url: string }>>([]);
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
  const compareAttempts = useGenerationAttempt();
  const cancelGenerationRun = generationRun.cancel;
  const cancelComparisonRun = compareRun.cancel;

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
  const anyRunning = isGenerating || generationRun.isRunning || compareRun.isRunning;
  const busy = compareEnabled ? compareRun.isRunning : isGenerating || generationRun.isRunning;

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

    const attempt = generationAttempts.begin();
    if (!attempt.isCurrent()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    generatedSlotsRef.current = [];
    generationRun.reset();

    // Capture this run's inputs so retrying a failed slot uses the same prompt,
    // reference and provider even if settings change while results are visible.
    const serviceSettings = settings.toServiceSettings();
    const historyOptions = buildHistoryOptions('generate', serviceSettings, {
      prompt: generationPrompt,
      aspectRatio,
      numberOfImages,
      hasReference: Boolean(referenceFile),
    });
    const task: IndexedGenerationTask<{ index: number; url: string }> = async (index, signal) => {
      const [url] = await generateImageFromText(
        generationPrompt,
        aspectRatio,
        1,
        { ...serviceSettings, abortSignal: signal },
        referenceFile,
        { viralTemplateId },
      );
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      void addToHistory('generate', url, { ...historyOptions, variationIndex: index });
      return { index, url };
    };
    generationTaskRef.current = task;

    try {
      const { results, failures, cancelled } = await generationRun.runBatch(numberOfImages, task);
      if (cancelled || !attempt.isCurrent()) return;
      if (results.length === 0) throw allFailedError(failures);

      generatedSlotsRef.current = results;
      if (numberOfImages === 1) {
        const newFile = dataURLtoFile(results[0].url, `generated-${Date.now()}.png`);
        onImageSelected(newFile);
      } else {
        // Keep partial batches here, including one success, so missing slots can be retried.
        setGeneratedImages(results.map(({ url }) => url));
      }
    } catch (err) {
      if (!attempt.isCurrent()) return;
      setError(formatApiErrorMessage(err, t, 'generation'));
      logger.error('Text-to-image generation failed:', err);
    } finally {
      if (attempt.isCurrent()) setIsGenerating(false);
      generationAttempts.finish(attempt);
    }
  };

  const handleGenerationRetryFailed = async () => {
    if (!generationTaskRef.current || generationRun.isRunning) return;
    const attempt = generationAttempts.begin();
    if (!attempt.isCurrent()) return;
    try {
      const { results, cancelled } = await generationRun.retryFailed(generationTaskRef.current);
      if (cancelled || !attempt.isCurrent() || results.length === 0) return;
      const slots = [...generatedSlotsRef.current, ...results].sort((a, b) => a.index - b.index);
      generatedSlotsRef.current = slots;
      setGeneratedImages(slots.map(({ url }) => url));
    } catch (err) {
      if (!attempt.isCurrent()) return;
      setError(formatApiErrorMessage(err, t, 'generation'));
      logger.error('Text-to-image retry failed:', err);
    } finally {
      generationAttempts.finish(attempt);
    }
  };

  const handleGenerationReset = () => {
    generationAttempts.cancel();
    setIsGenerating(false);
    setGeneratedImages([]);
    generatedSlotsRef.current = [];
    generationTaskRef.current = null;
    generationRun.reset();
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
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
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

    const attempt = compareAttempts.begin();
    if (!attempt.isCurrent()) return;
    const modelsToRun: ModelType[] = [settings.model, effectiveCompareModel];
    setCompareRunModels(modelsToRun);
    setError(null);
    setCompareResults([]);

    try {
      const { results, failures, cancelled } = await compareRun.runBatch(2, (index, signal) =>
        runCompareSlot(modelsToRun[index], index, signal),
      );
      if (cancelled || !attempt.isCurrent()) return;

      // Both models failing almost always shares one cause (bad key, blocked
      // prompt); fall back to the same single-error banner the plain flow
      // uses instead of a comparison grid with nothing successful to show.
      if (results.length === 0) {
        throw allFailedError(failures);
      }
      setCompareResults(results);
    } catch (err) {
      if (!attempt.isCurrent()) return;
      setError(formatApiErrorMessage(err, t, 'generation'));
      logger.error('Model comparison generation failed:', err);
    } finally {
      compareAttempts.finish(attempt);
    }
  };

  const handleCompareRetryFailed = async () => {
    const attempt = compareAttempts.begin();
    if (!attempt.isCurrent()) return;
    try {
      const { results: recovered, cancelled } = await compareRun.retryFailed((index, signal) =>
        runCompareSlot(compareRunModels[index], index, signal),
      );
      if (cancelled || !attempt.isCurrent() || recovered.length === 0) return;
      setCompareResults((prev) => [...prev, ...recovered]);
    } catch (err) {
      if (!attempt.isCurrent()) return;
      setError(formatApiErrorMessage(err, t, 'generation'));
      logger.error('Model comparison retry failed:', err);
    } finally {
      compareAttempts.finish(attempt);
    }
  };

  const handleCompareCancel = () => {
    compareAttempts.cancel();
    compareRun.cancel();
  };

  const handleCompareReset = () => {
    compareAttempts.cancel();
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

  useEffect(() => {
    if (active) return;
    generationAttempts.cancel();
    cancelGenerationRun();
    compareAttempts.cancel();
    cancelComparisonRun();
    setIsGenerating(false);
  }, [active, generationAttempts, cancelGenerationRun, compareAttempts, cancelComparisonRun]);

  if (!active) return null;
  return (
    <div className={`${UI_PAGE} ${getPageSurface(theme)}`}>
      <div className="flex flex-col items-center gap-8 max-[640px]:gap-3 animate-fade-in">
        <StartScreenIntro />
        {generatedImages.length > 0 ? (
          <div
            className={`flex flex-col items-center gap-6 w-full max-w-4xl animate-fade-in bg-gray-800/40 p-6 rounded-2xl border ${s.borderCard}`}
          >
            <h3 className="text-xl font-bold text-white">{t('start.select_image')}</h3>
            <GenerationFailureNotice
              failures={generationRun.failures}
              requestedCount={generationRun.requestedCount}
              succeededCount={generationRun.succeededCount}
              isRetrying={generationRun.isRetrying}
              onRetry={handleGenerationRetryFailed}
              context="generation"
            />
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              {generatedImages.length > 1 && (
                <button type="button" onClick={handleDownloadAllZip} className={UI_BTN_SUCCESS}>
                  <DownloadIcon className="w-5 h-5" />
                  {t('start.download_all_zip')}
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerationReset}
                disabled={generationRun.isRunning}
                className={UI_BTN_GHOST}
              >
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
                        disabled={generationRun.isRunning}
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
                onCancel={handleCompareCancel}
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
            {viralTemplateId && (
              <ViralTemplateBanner
                templateId={viralTemplateId}
                hintKey="viral.generate_for_template"
                testId="viral-template-banner-generate"
              />
            )}
            <textarea
              id="generate-prompt"
              value={generationPrompt}
              onChange={(e) => setGenerationPrompt(e.target.value)}
              placeholder={t('start.prompt_placeholder')}
              aria-label={t('start.prompt_placeholder')}
              className={`w-full h-40 md:h-44 bg-gray-900/50 border border-gray-600 rounded-xl p-5 text-gray-100 placeholder-gray-500 focus:outline-none focus-visible:ring-2 resize-none transition-colors duration-200 text-base ${s.inputFocus}`}
              disabled={busy}
              data-testid="generate-prompt"
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

        {generatedImages.length === 0 &&
          !isGenerating &&
          !(compareEnabled && (compareRun.isRunning || compareResults.length > 0)) && (
            <>
              <Suspense fallback={null}>
                <ViralTemplatesSection className="mt-6" compact />
              </Suspense>
              <ExampleShowcase feature="generate" />
            </>
          )}
      </div>
    </div>
  );
};

export default GenerateStartScreen;
