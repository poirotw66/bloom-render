/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useCallback, useEffect, useState } from 'react';
import { generateRestoredPhoto } from '../../services/geminiService';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatApiErrorMessage } from '../../services/gemini/shared';
import { upscale2x } from '../../services/localEnhance';
import { logger } from '../../utils/logger';
import { buildHistoryOptions } from '../../utils/historyOptions';
import { useHistory } from '../../hooks/useHistory';
import { useDemoSampleInput } from '../../hooks/useDemoSampleInput';
import { fileFromSourceUrl, useHistoryReplay } from '../../hooks/useHistoryReplay';
import { isAbortError, startRandomProgressTicker } from '../../utils/generationHelpers';
import { buildRemixUrl } from '../../utils/remixLink';

export function useRestore() {
  const { t } = useLanguage();
  const settings = useSettings();
  const { addToHistory } = useHistory();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [colorize, setColorize] = useState(true);
  const [upscaleAfter, setUpscaleAfter] = useState(false);
  const [upscaling, setUpscaling] = useState(false);

  useDemoSampleInput('restore', setFile);

  useHistoryReplay((payload) => {
    if (payload.type !== 'restore') return;
    const opts = payload.options ?? {};
    if (typeof opts.colorize === 'boolean') setColorize(opts.colorize);
    if (typeof opts.upscaleAfter === 'boolean') setUpscaleAfter(opts.upscaleAfter);
    if (payload.sourceUrl) {
      void fileFromSourceUrl(payload.sourceUrl, 'restore-source.png').then(setFile);
    }
  });

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
    }
    e.target.value = '';
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const remixUrl = buildRemixUrl({
    v: 1,
    f: 'restore',
    p: colorize ? 'colorize' : 'restore-only',
  });

  const handleGenerate = useCallback(async () => {
    if (!file) {
      setError(t('restore.error_no_photo'));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(5);
    const stopProgress = startRandomProgressTicker(setProgress);
    const controller = new AbortController();

    try {
      let url = await generateRestoredPhoto(file, {
        colorize,
        settings: settings.toServiceSettings(controller.signal),
      });

      if (upscaleAfter) {
        setUpscaling(true);
        setProgress(82);
        try {
          url = await upscale2x(url, (p) => {
            setProgress(82 + Math.round((Math.min(100, Math.max(0, p.percent)) / 100) * 15));
          });
        } catch (upErr) {
          logger.error('Restore upscale failed:', upErr);
          // Keep the restored (non-upscaled) result; surface a soft warning.
          setError(t('restore.upscale_failed'));
        } finally {
          setUpscaling(false);
        }
      }

      setResult(url);
      addToHistory(
        'restore',
        url,
        buildHistoryOptions('restore', settings, { colorize, upscaleAfter }),
        file,
      );
      setProgress(100);
    } catch (err) {
      if (isAbortError(err)) return;
      logger.error('Restore failed:', err);
      setError(formatApiErrorMessage(err, t));
    } finally {
      stopProgress();
      setLoading(false);
    }
  }, [addToHistory, colorize, file, settings, t, upscaleAfter]);

  return {
    file,
    setFile,
    previewUrl,
    result,
    loading,
    upscaling,
    error,
    progress,
    isDraggingOver,
    setIsDraggingOver,
    colorize,
    setColorize,
    upscaleAfter,
    setUpscaleAfter,
    handleFileChange,
    handleGenerate,
    clearResult,
    remixUrl,
  };
}
