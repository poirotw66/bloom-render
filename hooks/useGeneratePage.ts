/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared hook for generate pages (portrait, themed, idphoto, etc.)
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { normalizeApiError } from '../services/gemini/shared';
import { startRandomProgressTicker } from '../utils/generationHelpers';

export interface GeneratePageOptions<TFile = File, TOptions = unknown> {
  defaultFile?: TFile | null;
  defaultOptions?: TOptions;
  readSearchParams?: (searchParams: URLSearchParams) => Partial<TOptions> | void;
  generateApi: (
    file: TFile,
    options: TOptions,
    settings: { apiKey?: string; model?: string },
  ) => Promise<string>;
  errorContext?: string;
}

export function useGeneratePage<TFile = File, TOptions = unknown>({
  defaultFile = null,
  defaultOptions,
  readSearchParams,
  generateApi,
  errorContext = 'generation',
}: GeneratePageOptions<TFile, TOptions>) {
  const { t } = useLanguage();
  const settings = useSettings();
  const [searchParams] = useSearchParams();

  const [file, setFile] = useState<TFile | null>(defaultFile);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<TOptions>(defaultOptions as TOptions);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  // Read URL parameters
  useEffect(() => {
    if (readSearchParams) {
      const params = readSearchParams(searchParams);
      if (params) {
        setOptions((prev) => ({ ...prev, ...params }) as TOptions);
      }
    }
  }, [searchParams, readSearchParams]);

  // Generate preview URL
  useEffect(() => {
    if (file && file instanceof File) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile as TFile);
      setResult(null);
      setError(null);
    }
    e.target.value = '';
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!file) {
      setError(t(`${errorContext}.error_no_image`));
      return;
    }

    setError(null);
    setLoading(true);
    setProgress(0);

    try {
      const stopProgress = startRandomProgressTicker(setProgress);

      const url = await generateApi(file, options, {
        apiKey: settings.apiKey,
        model: settings.model,
      });

      stopProgress();
      setProgress(100);
      setResult(url);
    } catch (err) {
      const normalizedError = normalizeApiError(err, errorContext);
      const errorKey = normalizedError.message || 'error.unknown';
      setError(t(errorKey));
      console.error('Generation error:', normalizedError.originalError || err);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [file, options, generateApi, settings, t, errorContext]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = `${errorContext}-${Date.now()}.png`;
    link.click();
  }, [result, errorContext]);

  const clearResult = useCallback(() => {
    setResult(null);
    setFile(null);
    setError(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile as TFile);
      setResult(null);
      setError(null);
    }
  }, []);

  return {
    file,
    setFile,
    result,
    loading,
    error,
    previewUrl,
    options,
    setOptions,
    isDraggingOver,
    progress,
    handleFileChange,
    handleGenerate,
    handleDownload,
    clearResult,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
