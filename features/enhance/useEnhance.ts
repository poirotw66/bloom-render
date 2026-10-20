/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useCallback, useEffect, useState, type ChangeEvent, type DragEvent } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  removeBackground,
  upscale2x,
  type LocalEnhanceProgress,
  type LocalEnhanceTask,
} from '../../services/localEnhance';
import { applyValidatedImageFile } from '../../utils/applyValidatedImageFile';
import { logger } from '../../utils/logger';

export function useEnhance() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [task, setTask] = useState<LocalEnhanceTask>('remove-bg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<LocalEnhanceProgress | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const applySelectedFile = useCallback(
    (selected: File) => {
      void applyValidatedImageFile(
        selected,
        t,
        (valid) => {
          setFile(valid);
          setResult(null);
          setError(null);
          setProgress(null);
        },
        setError,
      );
    },
    [t],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) applySelectedFile(selected);
      e.target.value = '';
    },
    [applySelectedFile],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) applySelectedFile(dropped);
    },
    [applySelectedFile],
  );

  const handleRun = useCallback(async () => {
    if (!file) {
      setError(t('enhance.error_no_image'));
      return;
    }
    setLoading(true);
    setError(null);
    setProgress({ percent: 0, statusKey: 'enhance.status_loading_model' });
    try {
      const onProgress = (p: LocalEnhanceProgress) => setProgress(p);
      const dataUrl =
        task === 'remove-bg'
          ? await removeBackground(file, onProgress)
          : await upscale2x(file, onProgress);
      setResult(dataUrl);
      setProgress({ percent: 100, statusKey: 'enhance.status_done' });
    } catch (err) {
      logger.error('Enhance page failed:', err);
      setError(t('enhance.error_failed'));
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [file, t, task]);

  const clearResult = useCallback(() => {
    setResult(null);
    setProgress(null);
    setError(null);
  }, []);

  return {
    file,
    previewUrl,
    result,
    task,
    setTask,
    loading,
    error,
    progress,
    isDraggingOver,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRun,
    clearResult,
    setResult,
  };
}
