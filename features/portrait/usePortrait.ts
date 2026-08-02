/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateProfessionalPortrait } from '../../services/geminiService';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatApiErrorMessage, supportsMultiResolution } from '../../services/gemini/shared';
import { logger } from '../../utils/logger';
import { useHistory } from '../../hooks/useHistory';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import {
  allFailedError,
  isAbortError,
  startRandomProgressTicker,
} from '../../utils/generationHelpers';
import { useGenerationFailures } from '../../hooks/useGenerationFailures';
import { DEFAULT_PORTRAIT_TYPE, DEFAULT_PORTRAIT_SPEC } from '../../constants/portrait';
import type { PortraitType, OutputSpec } from '../../types';

export function usePortrait() {
  const { t } = useLanguage();
  const settings = useSettings();
  const [searchParams] = useSearchParams();
  const { addToHistory } = useHistory();
  const run = useGenerationFailures();

  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitResult, setPortraitResult] = useState<string | null>(null);
  const [portraitResults, setPortraitResults] = useState<string[]>([]);
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const [portraitPreviewUrl, setPortraitPreviewUrl] = useState<string | null>(null);
  const [portraitType, setPortraitType] = useState<PortraitType>(DEFAULT_PORTRAIT_TYPE);
  const [portraitOutputSpec, setPortraitOutputSpec] = useState<OutputSpec>(DEFAULT_PORTRAIT_SPEC);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (!supportsMultiResolution(settings.model) && imageSize !== '1K') {
      setImageSize('1K');
    }
  }, [settings.model, imageSize]);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setPortraitType(typeParam as PortraitType);
    }
    const specParam = searchParams.get('spec');
    if (specParam && ['half_body', 'full_body'].includes(specParam)) {
      setPortraitOutputSpec(specParam as OutputSpec);
    }
  }, [searchParams]);

  useEffect(() => {
    if (portraitFile) {
      const u = URL.createObjectURL(portraitFile);
      setPortraitPreviewUrl(u);
      return () => URL.revokeObjectURL(u);
    } else {
      setPortraitPreviewUrl(null);
    }
  }, [portraitFile]);

  const handlePortraitFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPortraitFile(f);
      setPortraitResult(null);
      setPortraitResults([]);
      setPortraitError(null);
    }
    e.target.value = '';
  }, []);

  const generateOne = useCallback(
    (file: File, variationIndex: number, signal: AbortSignal) =>
      generateProfessionalPortrait(file, {
        portraitType,
        outputSpec: portraitOutputSpec,
        imageSize,
        settings: { apiKey: settings.apiKey, model: settings.model, abortSignal: signal },
        variationIndex,
      })
        .then((url) => {
          addToHistory('portrait', url, {
            portraitType,
            outputSpec: portraitOutputSpec,
          });
          return url;
        })
        .catch((err) => {
          if (!isAbortError(err))
            logger.error(`Portrait generation error for item ${variationIndex + 1}:`, err);
          throw err;
        }),
    [portraitType, portraitOutputSpec, imageSize, settings.apiKey, settings.model, addToHistory],
  );

  const handlePortraitGenerate = useCallback(async () => {
    if (!portraitFile) {
      setPortraitError(t('portrait.error_no_image'));
      return;
    }
    setPortraitError(null);
    setPortraitLoading(true);
    setProgress(0);
    setPortraitResult(null);
    setPortraitResults([]);
    run.reset();

    const stopProgress = startRandomProgressTicker(setProgress);

    try {
      const { results, failures, cancelled } = await run.runBatch(quantity, (index, signal) =>
        generateOne(portraitFile, index, signal),
      );

      // The user asked to stop: fall back to the form, no error, no partial notice.
      if (cancelled) return;

      setProgress(100);

      if (results.length === 0) {
        throw allFailedError(failures);
      }

      // Always use the list form when some slots failed, so the partial-result
      // notice and its retry button have somewhere to live.
      if (results.length === 1 && quantity === 1) {
        setPortraitResult(results[0]);
      } else {
        setPortraitResults(results);
      }
    } catch (err) {
      setPortraitError(formatApiErrorMessage(err, t, 'portrait'));
      logger.error('Portrait generation error:', err);
    } finally {
      stopProgress();
      setPortraitLoading(false);
      setProgress(0);
    }
  }, [portraitFile, t, quantity, run, generateOne]);

  const handleRetryFailed = useCallback(async () => {
    if (!portraitFile) return;

    try {
      const { results: recovered } = await run.retryFailed((index, signal) =>
        generateOne(portraitFile, index, signal),
      );
      if (recovered.length === 0) return;

      setPortraitResults((prev) => [...prev, ...recovered]);
      setPortraitResult(null);
    } catch (err) {
      setPortraitError(formatApiErrorMessage(err, t, 'portrait'));
      logger.error('Portrait retry error:', err);
    }
  }, [portraitFile, run, generateOne, t]);

  const handlePortraitDownload = useCallback(() => {
    if (!portraitResult) return;
    const a = document.createElement('a');
    a.href = portraitResult;
    a.download = `portrait-${Date.now()}.png`;
    a.click();
  }, [portraitResult]);

  const clearPortraitResult = useCallback(() => {
    setPortraitResult(null);
    setPortraitResults([]);
    run.reset();
  }, [run]);

  const handlePortraitBatchDownload = useCallback(async () => {
    if (portraitResults.length === 0) return;

    await downloadBatchWithZipFallback({
      sources: portraitResults,
      itemFileName: (index) => `portrait-${index + 1}.png`,
      zipFileName: `portraits-${Date.now()}.zip`,
    });
  }, [portraitResults]);

  const setFileFromDrop = useCallback((file: File) => {
    setPortraitFile(file);
    setPortraitResult(null);
    setPortraitError(null);
  }, []);

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
      const file = e.dataTransfer.files?.[0];
      if (file) setFileFromDrop(file);
    },
    [setFileFromDrop],
  );

  return {
    portraitFile,
    portraitResult,
    portraitResults,
    portraitLoading,
    portraitError,
    portraitPreviewUrl,
    portraitType,
    setPortraitType,
    portraitOutputSpec,
    setPortraitOutputSpec,
    imageSize,
    setImageSize,
    progress,
    quantity,
    setQuantity,
    handlePortraitFileChange,
    handlePortraitGenerate,
    handlePortraitDownload,
    handlePortraitBatchDownload,
    clearPortraitResult,
    failures: run.failures,
    requestedCount: run.requestedCount,
    succeededCount: run.succeededCount,
    isRetrying: run.isRetrying,
    isRunning: run.isRunning,
    cancelGeneration: run.cancel,
    handleRetryFailed,
    isDraggingOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
