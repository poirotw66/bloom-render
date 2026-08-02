/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook for AI virtual try-on: person + clothing images -> person wearing clothing.
 */

import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useHistory } from '../../hooks/useHistory';
import { generateVirtualTryOn } from '../../services/geminiService';
import { formatApiErrorMessage } from '../../services/gemini/shared';
import { logger } from '../../utils/logger';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import { allFailedError } from '../../utils/generationHelpers';
import { useGenerationFailures } from '../../hooks/useGenerationFailures';
import {
  TRYON_BACKGROUNDS,
  TRYON_STYLES,
  DEFAULT_TRYON_BACKGROUND,
  DEFAULT_TRYON_STYLE,
  type TryOnBackgroundId,
  type TryOnStyleId,
} from '../../constants/tryOn';
import {
  MIN_CLOTHING_IMAGES,
  MAX_CLOTHING_IMAGES,
  DEFAULT_TRYON_OUTPUT_SIZE,
  DEFAULT_TRYON_ASPECT_RATIO,
  type TryOnOutputSize,
  type TryOnAspectRatio,
} from './types';

export function useTryOn() {
  const { t } = useLanguage();
  const settings = useSettings();
  const { addToHistory } = useHistory();
  const run = useGenerationFailures();

  const [personFile, setPersonFile] = useState<File | null>(null);
  const [personPreviewUrl, setPersonPreviewUrl] = useState<string | null>(null);
  const [clothingFiles, setClothingFiles] = useState<File[]>([]);
  const [clothingPreviewUrls, setClothingPreviewUrls] = useState<string[]>([]);

  const [result, setResult] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [progress, setProgress] = useState(0);
  const [background, setBackground] = useState<TryOnBackgroundId>(DEFAULT_TRYON_BACKGROUND);
  const [style, setStyle] = useState<TryOnStyleId>(DEFAULT_TRYON_STYLE);
  const [outputSize, setOutputSize] = useState<TryOnOutputSize>(DEFAULT_TRYON_OUTPUT_SIZE);
  const [aspectRatio, setAspectRatio] = useState<TryOnAspectRatio>(DEFAULT_TRYON_ASPECT_RATIO);

  // Person preview URL
  useEffect(() => {
    if (personFile) {
      const url = URL.createObjectURL(personFile);
      setPersonPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPersonPreviewUrl(null);
  }, [personFile]);

  // Clothing preview URLs
  useEffect(() => {
    const urls = clothingFiles.map((f) => URL.createObjectURL(f));
    setClothingPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [clothingFiles]);

  const setPerson = useCallback((file: File | null) => {
    setPersonFile(file);
    setError(null);
    setResult(null);
    setResults([]);
  }, []);

  const addClothing = useCallback((files: File[]) => {
    setClothingFiles((prev) => [...prev, ...files].slice(0, MAX_CLOTHING_IMAGES));
    setError(null);
    setResult(null);
    setResults([]);
  }, []);

  const removeClothing = useCallback((index: number) => {
    setClothingFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const clearClothing = useCallback(() => {
    setClothingFiles([]);
    setError(null);
  }, []);

  const handlePersonFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = (e.target.files || [])[0];
      setPerson(file || null);
      e.target.value = '';
    },
    [setPerson],
  );

  const handleClothingFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
      addClothing(files);
      e.target.value = '';
    },
    [addClothing],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDropPerson = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
      if (file) setPerson(file);
    },
    [setPerson],
  );

  const handleDropClothing = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      addClothing(files);
    },
    [addClothing],
  );

  const generateOne = useCallback(
    (
      person: File,
      clothing: File[],
      variationIndex: number,
      total: number,
      signal: AbortSignal,
    ) => {
      const backgroundOption = TRYON_BACKGROUNDS.find((b) => b.id === background);
      const styleOption = TRYON_STYLES.find((s) => s.id === style);

      return generateVirtualTryOn(person, clothing, {
        settings: { apiKey: settings.apiKey, model: settings.model, abortSignal: signal },
        variationIndex: total > 1 ? variationIndex : undefined,
        backgroundHint: backgroundOption?.promptHint,
        styleHint: styleOption?.promptHint,
        outputSize,
        aspectRatio,
      }).then((dataUrl) => {
        addToHistory('tryon', dataUrl, {
          background,
          style,
          clothingCount: clothing.length,
          outputSize,
          aspectRatio,
          variationIndex,
        });
        return dataUrl;
      });
    },
    [background, style, outputSize, aspectRatio, settings.apiKey, settings.model, addToHistory],
  );

  const handleGenerate = useCallback(async () => {
    if (!personFile) {
      setError(t('tryon.error_no_person'));
      return;
    }
    if (clothingFiles.length < MIN_CLOTHING_IMAGES) {
      setError(t('tryon.error_no_clothing'));
      return;
    }
    if (clothingFiles.length > MAX_CLOTHING_IMAGES) {
      setError(t('tryon.error_too_many_clothing'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setResults([]);
    setProgress(0);
    run.reset();

    const total = quantity;
    const generated: string[] = [];

    try {
      let completedCount = 0;
      const { results, failures, cancelled } = await run.runBatch(total, (i, signal) =>
        generateOne(personFile, clothingFiles, i, total, signal).then((dataUrl) => {
          completedCount += 1;
          setProgress(Math.round((completedCount / total) * 90));
          return dataUrl;
        }),
      );
      if (cancelled) return;
      generated.push(...results);

      setProgress(100);
      if (generated.length === 0) {
        throw allFailedError(failures);
      }
      // Always use the list form when some slots failed, so the partial-result
      // notice and its retry button have somewhere to live.
      if (generated.length === 1 && total === 1) {
        setResult(generated[0]);
      } else {
        setResults(generated);
      }
    } catch (err) {
      setError(formatApiErrorMessage(err, t, 'tryon'));
      logger.error('Try-on generation error:', err);
      if (generated.length > 0) {
        setResults(generated);
        setResult(null);
      }
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [personFile, clothingFiles, quantity, t, run, generateOne]);

  const handleRetryFailed = useCallback(async () => {
    if (!personFile) return;

    try {
      const { results: recovered } = await run.retryFailed((i, signal) =>
        generateOne(personFile, clothingFiles, i, quantity, signal),
      );
      if (recovered.length === 0) return;

      setResults((prev) => [...prev, ...recovered]);
      setResult(null);
    } catch (err) {
      setError(formatApiErrorMessage(err, t, 'tryon'));
      logger.error('Try-on retry error:', err);
    }
  }, [personFile, clothingFiles, quantity, run, generateOne, t]);

  const clearResult = useCallback(() => {
    setResult(null);
    setResults([]);
    setPersonFile(null);
    setClothingFiles([]);
    setError(null);
    run.reset();
  }, [run]);

  const handleBatchDownload = useCallback(async () => {
    const list = results.length > 0 ? results : result ? [result] : [];
    if (list.length === 0) return;
    await downloadBatchWithZipFallback({
      sources: list,
      itemFileName: (index) => `try-on-${index + 1}.png`,
      zipFileName: `try-on-${Date.now()}.zip`,
    });
  }, [results, result]);

  const canGenerate =
    personFile !== null &&
    clothingFiles.length >= MIN_CLOTHING_IMAGES &&
    clothingFiles.length <= MAX_CLOTHING_IMAGES;

  const hasResults = results.length > 0 || result !== null;

  return {
    personFile,
    personPreviewUrl,
    setPerson,
    clothingFiles,
    clothingPreviewUrls,
    addClothing,
    removeClothing,
    clearClothing,
    result,
    results,
    loading,
    error,
    progress,
    quantity,
    setQuantity,
    isDraggingOver,
    handlePersonFileChange,
    handleClothingFileChange,
    handleDragOver,
    handleDragLeave,
    handleDropPerson,
    handleDropClothing,
    handleGenerate,
    clearResult,
    handleBatchDownload,
    failures: run.failures,
    requestedCount: run.requestedCount,
    succeededCount: run.succeededCount,
    isRetrying: run.isRetrying,
    isRunning: run.isRunning,
    cancelGeneration: run.cancel,
    handleRetryFailed,
    canGenerate,
    hasResults,
    minClothing: MIN_CLOTHING_IMAGES,
    maxClothing: MAX_CLOTHING_IMAGES,
    background,
    setBackground,
    style,
    setStyle,
    outputSize,
    setOutputSize,
    aspectRatio,
    setAspectRatio,
  };
}
