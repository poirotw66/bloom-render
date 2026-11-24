/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Hook for couple/group photo state management and generation logic.
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useHistory } from '../../hooks/useHistory';
import { useDemoSampleFiles } from '../../hooks/useDemoSampleInput';
import { fileFromSourceUrl, useHistoryReplay } from '../../hooks/useHistoryReplay';
import { formatApiErrorMessage, supportsMultiResolution } from '../../services/gemini/shared';
import { runImageGeneration } from '../../services/gemini/runImageGeneration';
import { generateCoupleGroupPrompt } from '../../services/gemini/prompts';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import { logger } from '../../utils/logger';
import { buildHistoryOptions } from '../../utils/historyOptions';
import {
  allFailedError,
  isAbortError,
  startRandomProgressTicker,
} from '../../utils/generationHelpers';
import { useGenerationFailures } from '../../hooks/useGenerationFailures';
import { useGenerationAttempt } from '../../hooks/useGenerationAttempt';
import type { CoupleGroupMode, CoupleGroupStyle } from './types';
import {
  COUPLE_STYLES,
  GROUP_STYLES,
  DEFAULT_COUPLE_STYLE,
  DEFAULT_GROUP_STYLE,
} from '../../constants/coupleGroup';

export function useCoupleGroup() {
  const { t } = useLanguage();
  const settings = useSettings();
  const { addToHistory } = useHistory();
  const run = useGenerationFailures();
  const attempts = useGenerationAttempt();
  const cancelRun = run.cancel;
  const [searchParams] = useSearchParams();

  // Mode: couple (2 files) or group (3-6 files)
  const [mode, setMode] = useState<CoupleGroupMode>('couple');

  // Style: couple styles or group styles (not portrait/themed/travel)
  const [style, setStyle] = useState<CoupleGroupStyle>(DEFAULT_COUPLE_STYLE);

  // Files and previews
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Result and loading
  const [result, setResult] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [outputSize, setOutputSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');

  useDemoSampleFiles(mode === 'group' ? 'group' : 'couple', setFiles, mode === 'group' ? 3 : 2);

  const cancelGeneration = useCallback(() => {
    attempts.cancel();
    cancelRun();
    setLoading(false);
    setProgress(0);
  }, [attempts, cancelRun]);

  // Read URL parameters on mount
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const newMode: CoupleGroupMode | null =
      modeParam === 'couple' || modeParam === 'group' ? modeParam : null;

    if (newMode) {
      setMode(newMode);
    }

    const styleParam = searchParams.get('style');
    if (styleParam) {
      // Check if it's a valid couple or group style
      const isValidCoupleStyle = COUPLE_STYLES.some((s) => s.id === styleParam);
      const isValidGroupStyle = GROUP_STYLES.some((s) => s.id === styleParam);
      if (isValidCoupleStyle || isValidGroupStyle) {
        setStyle(styleParam as CoupleGroupStyle);
      } else if (newMode) {
        // If style param is invalid but mode is valid, set default style for that mode
        setStyle(newMode === 'couple' ? DEFAULT_COUPLE_STYLE : DEFAULT_GROUP_STYLE);
      }
    } else if (newMode) {
      // If no style param but mode is set, use default style for that mode
      setStyle(newMode === 'couple' ? DEFAULT_COUPLE_STYLE : DEFAULT_GROUP_STYLE);
    }
  }, [searchParams]);

  useHistoryReplay((payload) => {
    if (payload.type !== 'couple' && payload.type !== 'group') return;
    const opts = payload.options ?? {};
    setMode(payload.type);
    if (typeof opts.style === 'string') setStyle(opts.style as CoupleGroupStyle);
    if (opts.outputSize === '1K' || opts.outputSize === '2K' || opts.outputSize === '4K') {
      setOutputSize(opts.outputSize);
    }
    if (opts.aspectRatio === '1:1' || opts.aspectRatio === '16:9' || opts.aspectRatio === '9:16') {
      setAspectRatio(opts.aspectRatio);
    }
    if (payload.sourceUrl) {
      void fileFromSourceUrl(payload.sourceUrl, 'couple-group-source.png').then((file) =>
        setFiles([file]),
      );
    }
  });

  // Generate preview URLs
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  // Handle file change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);

      if (mode === 'couple') {
        if (selectedFiles.length > 2) {
          setError(t('couple_group.error_too_many_couple'));
          e.target.value = '';
          return;
        }
        // For couple mode, replace all files with the selected ones (up to 2)
        setFiles(selectedFiles.slice(0, 2));
      } else if (mode === 'group') {
        if (selectedFiles.length > 6) {
          setError(t('couple_group.error_too_many_group'));
          e.target.value = '';
          return;
        }
        // For group mode, append new files to existing ones (up to 6 total)
        setFiles((prev) => [...prev, ...selectedFiles].slice(0, 6));
      }

      setError(null);
      setResult(null);
      setResults([]);
      e.target.value = '';
    },
    [mode, t],
  );

  // Remove file
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  // Handle mode change
  const handleModeChange = useCallback((newMode: CoupleGroupMode) => {
    setMode(newMode);
    // Reset style to default for the new mode
    setStyle(newMode === 'couple' ? DEFAULT_COUPLE_STYLE : DEFAULT_GROUP_STYLE);
    // Clear files when switching modes
    setFiles([]);
    setError(null);
  }, []);

  // Handle style change
  const handleStyleChange = useCallback((newStyle: CoupleGroupStyle) => {
    setStyle(newStyle);
    // Keep files but reset error
    setError(null);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/'),
      );

      if (mode === 'couple') {
        if (droppedFiles.length > 2) {
          setError(t('couple_group.error_too_many_couple'));
          return;
        }
        setFiles(droppedFiles.slice(0, 2));
      } else if (mode === 'group') {
        if (droppedFiles.length > 6) {
          setError(t('couple_group.error_too_many_group'));
          return;
        }
        setFiles((prev) => [...prev, ...droppedFiles].slice(0, 6));
      }

      setError(null);
    },
    [mode, t],
  );

  // Generate handler
  /**
   * Resolves the model/prompt configuration once, then returns a per-slot
   * generator that receives the current run's cancellation signal.
   */
  const buildGenerator = useCallback(async (): Promise<
    (index: number, signal: AbortSignal) => Promise<string>
  > => {
    // Find the style configuration
    const styleConfig =
      mode === 'couple'
        ? COUPLE_STYLES.find((s) => s.id === style)
        : GROUP_STYLES.find((s) => s.id === style);

    if (!styleConfig) {
      throw new Error('error.invalid_style');
    }

    // Use a unified generation function for couple/group photos
    // We'll create a new service function or reuse existing ones with custom prompts
    const fileCount = files.length;

    // Create base prompt with variation support using unified prompt system
    const createPrompt = (variationIndex: number) => {
      return generateCoupleGroupPrompt({
        styleHint: styleConfig.promptHint,
        fileCount,
        mode,
        variationIndex: quantity > 1 ? variationIndex : undefined,
      });
    };

    const serviceSettings = settings.toServiceSettings();
    const model = serviceSettings.model;
    const supportsMultiRes = supportsMultiResolution(model);
    const effectiveSize: '1K' | '2K' | '4K' = supportsMultiRes ? outputSize : '1K';

    logger.debug('Starting couple/group photo generation', {
      mode,
      style,
      fileCount,
      outputSize: effectiveSize,
      aspectRatio,
      provider: serviceSettings.provider,
    });

    return async (i: number, signal: AbortSignal) => {
      const variedPrompt = createPrompt(i);

      try {
        const url = await runImageGeneration({
          prompt: variedPrompt,
          images: files,
          settings: { ...serviceSettings, abortSignal: signal },
          aspectRatio,
          imageSize: supportsMultiRes ? effectiveSize : undefined,
          includeImageConfig: true,
          context: mode === 'couple' ? 'couple' : 'group',
        });
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        addToHistory(
          mode,
          url,
          buildHistoryOptions(mode, settings, {
            style,
            fileCount,
            aspectRatio,
            outputSize: effectiveSize,
            variationIndex: i,
            prompt: variedPrompt,
          }),
          files[0] ?? null,
        );
        return url;
      } catch (err) {
        if (!isAbortError(err))
          logger.error(`Couple/group generation error for item ${i + 1}:`, err);
        throw err;
      }
    };
  }, [mode, files, style, settings, quantity, outputSize, aspectRatio, addToHistory]);

  const handleGenerate = useCallback(async () => {
    // Validation
    if (mode === 'couple' && files.length !== 2) {
      setError(t('couple_group.error_need_two_files'));
      return;
    }
    if (mode === 'group' && (files.length < 3 || files.length > 6)) {
      setError(t('couple_group.error_need_three_to_six_files'));
      return;
    }

    const attempt = attempts.begin();
    if (!attempt.isCurrent()) return;
    setLoading(true);
    setError(null);
    setProgress(0);
    setResult(null);
    setResults([]);
    run.reset();

    const stopProgress = startRandomProgressTicker((value) => {
      if (attempt.isCurrent()) setProgress(value);
    });
    attempt.onCleanup(stopProgress);

    try {
      const generateOne = await buildGenerator();
      if (!attempt.isCurrent()) return;
      const {
        results: generatedResults,
        failures,
        cancelled,
      } = await run.runBatch(quantity, generateOne);

      // The user asked to stop: fall back to the form, no error, no partial notice.
      if (cancelled || !attempt.isCurrent()) return;

      setProgress(100);

      if (generatedResults.length === 0) {
        throw allFailedError(failures);
      }

      // Always use the list form when some slots failed, so the partial-result
      // notice and its retry button have somewhere to live.
      if (generatedResults.length === 1 && quantity === 1) {
        setResult(generatedResults[0]);
      } else {
        setResults(generatedResults);
      }
    } catch (err) {
      if (!attempt.isCurrent()) return;
      setError(formatApiErrorMessage(err, t, 'couple_group'));
      logger.error('Couple/group generation error:', err);
    } finally {
      if (attempt.isCurrent()) {
        setLoading(false);
        setProgress(0);
      }
      attempts.finish(attempt);
    }
  }, [attempts, mode, files, t, quantity, run, buildGenerator]);

  const handleRetryFailed = useCallback(async () => {
    const attempt = attempts.begin();
    if (!attempt.isCurrent()) return;
    try {
      const generateOne = await buildGenerator();
      if (!attempt.isCurrent()) return;
      const { results: recovered, cancelled } = await run.retryFailed(generateOne);
      if (cancelled || !attempt.isCurrent() || recovered.length === 0) return;

      setResults((prev) => [...prev, ...recovered]);
      setResult(null);
    } catch (err) {
      if (!attempt.isCurrent()) return;
      setError(formatApiErrorMessage(err, t, 'couple_group'));
      logger.error('Couple/group retry error:', err);
    } finally {
      attempts.finish(attempt);
    }
  }, [attempts, run, buildGenerator, t]);

  // Clear result
  const clearResult = useCallback(() => {
    cancelGeneration();
    setResult(null);
    setResults([]);
    setFiles([]);
    setError(null);
    run.reset();
  }, [run, cancelGeneration]);

  const handleBatchDownload = useCallback(async () => {
    if (results.length === 0) return;

    await downloadBatchWithZipFallback({
      sources: results,
      itemFileName: (index) => `couple-group-${mode}-${index + 1}.png`,
      zipFileName: `couple-group-${Date.now()}.zip`,
    });
  }, [results, mode]);

  return {
    mode,
    setMode: handleModeChange,
    style,
    setStyle: handleStyleChange,
    files,
    previewUrls,
    result,
    results,
    loading,
    error,
    progress,
    isDraggingOver,
    quantity,
    setQuantity,
    outputSize,
    setOutputSize,
    aspectRatio,
    setAspectRatio,
    handleFileChange,
    removeFile,
    handleGenerate,
    handleBatchDownload,
    failures: run.failures,
    requestedCount: run.requestedCount,
    succeededCount: run.succeededCount,
    isRetrying: run.isRetrying,
    isRunning: run.isRunning,
    cancelGeneration,
    handleRetryFailed,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearResult,
  };
}
