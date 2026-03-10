/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateProfessionalPortrait } from '../../services/geminiService';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { normalizeApiError } from '../../services/gemini/shared';
import { useHistory } from '../../hooks/useHistory';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import { getFulfilledResults, startRandomProgressTicker } from '../../utils/generationHelpers';
import { DEFAULT_PORTRAIT_TYPE, DEFAULT_PORTRAIT_SPEC } from '../../constants/portrait';
import type { PortraitType, OutputSpec } from '../../types';

export function usePortrait() {
  const { t } = useLanguage();
  const settings = useSettings();
  const [searchParams] = useSearchParams();
  const { addToHistory } = useHistory();

  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitResult, setPortraitResult] = useState<string | null>(null);
  const [portraitResults, setPortraitResults] = useState<string[]>([]);
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const [portraitPreviewUrl, setPortraitPreviewUrl] = useState<string | null>(null);
  const [portraitType, setPortraitType] = useState<PortraitType>(DEFAULT_PORTRAIT_TYPE);
  const [portraitOutputSpec, setPortraitOutputSpec] = useState<OutputSpec>(DEFAULT_PORTRAIT_SPEC);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

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

    try {
      const stopProgress = startRandomProgressTicker(setProgress);

      // Generate all images in parallel with variations
      const generationPromises = Array.from({ length: quantity }, (_, i) =>
        generateProfessionalPortrait(portraitFile, {
          portraitType,
          outputSpec: portraitOutputSpec,
          settings: { apiKey: settings.apiKey, model: settings.model },
          variationIndex: i, // Use index to create different variations
        })
          .then((url) => {
            // Add to history
            addToHistory('portrait', url, {
              portraitType,
              outputSpec: portraitOutputSpec,
            });
            return url;
          })
          .catch((err) => {
            console.error(`Portrait generation error for item ${i + 1}:`, err);
            throw err;
          }),
      );

      const settledResults = await Promise.allSettled(generationPromises);
      const results = getFulfilledResults(settledResults);

      stopProgress();
      setProgress(100);

      if (results.length === 0) {
        throw new Error('error.all_generations_failed');
      }

      if (results.length === 1) {
        setPortraitResult(results[0]);
      } else {
        setPortraitResults(results);
      }
    } catch (err) {
      const normalizedError = normalizeApiError(err, 'portrait');
      const errorKey = normalizedError.message || 'error.unknown';
      setPortraitError(t(errorKey));
      console.error('Portrait generation error:', normalizedError.originalError || err);
    } finally {
      setPortraitLoading(false);
      setProgress(0);
    }
  }, [
    portraitFile,
    portraitType,
    portraitOutputSpec,
    settings.apiKey,
    settings.model,
    t,
    addToHistory,
    quantity,
  ]);

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
  }, []);

  const handlePortraitBatchDownload = useCallback(async () => {
    if (portraitResults.length === 0) return;

    await downloadBatchWithZipFallback({
      dataUrls: portraitResults,
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
    progress,
    quantity,
    setQuantity,
    handlePortraitFileChange,
    handlePortraitGenerate,
    handlePortraitDownload,
    handlePortraitBatchDownload,
    clearPortraitResult,
    isDraggingOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
