/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook for AI virtual try-on: person + clothing images -> person wearing clothing.
 */

import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { generateVirtualTryOn } from '../../services/geminiService';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import { getFulfilledResults } from '../../utils/generationHelpers';
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

    const total = quantity;
    const generated: string[] = [];

    const backgroundOption = TRYON_BACKGROUNDS.find((b) => b.id === background);
    const styleOption = TRYON_STYLES.find((s) => s.id === style);

    try {
      // Run all generations in parallel (concurrent API calls)
      let completedCount = 0;
      const promises = Array.from({ length: total }, (_, i) =>
        generateVirtualTryOn(personFile, clothingFiles, {
          settings: { apiKey: settings.apiKey, model: settings.model },
          variationIndex: total > 1 ? i : undefined,
          backgroundHint: backgroundOption?.promptHint,
          styleHint: styleOption?.promptHint,
          outputSize,
          aspectRatio,
        }).then((dataUrl) => {
          completedCount += 1;
          setProgress(Math.round((completedCount / total) * 90));
          return dataUrl;
        }),
      );

      const settled = await Promise.allSettled(promises);
      const fulfilled = getFulfilledResults(settled);
      generated.push(...fulfilled);

      setProgress(100);
      if (generated.length === 0) {
        const firstRejection = settled.find(
          (s): s is PromiseRejectedResult => s.status === 'rejected',
        );
        const reason = firstRejection?.reason;
        const detail = reason instanceof Error ? reason.message : String(reason ?? 'Unknown error');
        console.error('Try-on generation failed (all requests failed). First reason:', reason);
        throw new Error(`${t('tryon.error_generation_failed')} ${detail}`);
      }
      if (generated.length === 1) {
        setResult(generated[0]);
      } else {
        setResults(generated);
      }
    } catch (err) {
      console.error('Try-on generation error:', err);
      const message = err instanceof Error ? err.message : t('tryon.error_generation_failed');
      setError(message);
      if (generated.length > 0) {
        setResults(generated);
        setResult(null);
      }
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [
    personFile,
    clothingFiles,
    quantity,
    background,
    style,
    outputSize,
    aspectRatio,
    settings,
    t,
  ]);

  const clearResult = useCallback(() => {
    setResult(null);
    setResults([]);
    setPersonFile(null);
    setClothingFiles([]);
    setError(null);
  }, []);

  const handleBatchDownload = useCallback(async () => {
    const list = results.length > 0 ? results : result ? [result] : [];
    if (list.length === 0) return;
    await downloadBatchWithZipFallback({
      dataUrls: list,
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
