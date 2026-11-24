/** @license SPDX-License-Identifier: MIT */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { applyValidatedImageFile } from '../utils/applyValidatedImageFile';
import { fetchPublicImageAsFile } from '../services/imageProviders/demoProvider';

/** Share the real file-picker/demo behavior between the hero and closing action. */
export function useHomeUpload(onImageSelected: (file: File) => void) {
  const { t } = useLanguage();
  const { isDemoMode } = useSettings();
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openingSample, setOpeningSample] = useState(false);
  useEffect(() => () => pending.current?.abort(), []);
  const pickFile = useCallback(
    (file: File) => {
      void applyValidatedImageFile(file, t, onImageSelected, setError);
    },
    [t, onImageSelected],
  );
  const startEditing = async () => {
    if (!isDemoMode) {
      input.current?.click();
      return;
    }
    if (pending.current) return;
    const request = new AbortController();
    pending.current = request;
    setOpeningSample(true);
    setError(null);
    try {
      const file = await fetchPublicImageAsFile(
        'examples/editor-before.webp',
        'demo-editor-sample.webp',
        request.signal,
      );
      if (!request.signal.aborted) onImageSelected(file);
    } catch {
      if (!request.signal.aborted) setError(t('home.sample_error'));
    } finally {
      if (!request.signal.aborted) setOpeningSample(false);
      if (pending.current === request) pending.current = null;
    }
  };
  return { input, error, openingSample, pickFile, startEditing };
}
