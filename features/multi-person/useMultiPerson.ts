/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * 2–4 portraits + a multi-person viral template → one composed photo.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getMultiPersonViralTemplates,
  getViralTemplateById,
  type ViralTemplate,
} from '../../constants/viralTemplates';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useDemoSampleFiles } from '../../hooks/useDemoSampleInput';
import { runImageGeneration } from '../../services/gemini/runImageGeneration';
import { formatApiErrorMessage } from '../../services/gemini/shared';
import {
  multiReferenceLimit,
  providerSupportsMultiReference,
} from '../../services/imageProviders/capabilities';
import {
  buildMultiPersonPromptFromTemplate,
  MULTI_PERSON_MAX,
  MULTI_PERSON_MIN,
} from '../../utils/multiPersonPrompt';
import { isAbortError, startRandomProgressTicker } from '../../utils/generationHelpers';
import { logger } from '../../utils/logger';

export function useMultiPerson() {
  const { t } = useLanguage();
  const settings = useSettings();
  const templates = useMemo(() => getMultiPersonViralTemplates(), []);

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string>(
    () => templates.find((x) => x.id === 'couple-portrait')?.id ?? templates[0]?.id ?? '',
  );
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useDemoSampleFiles('multi-person', setFiles, 2);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const selectedTemplate: ViralTemplate | undefined = getViralTemplateById(templateId);

  const providerOk = providerSupportsMultiReference(settings.imageProvider);
  const providerMax = multiReferenceLimit(settings.imageProvider);

  const addFiles = useCallback((incoming: File[]) => {
    setError(null);
    setResultUrl(null);
    setFiles((prev) => [...prev, ...incoming].slice(0, MULTI_PERSON_MAX));
  }, []);

  const removeAt = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResultUrl(null);
  }, []);

  const move = useCallback((index: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  }, []);

  const generate = useCallback(async () => {
    if (!providerOk) {
      setError(t('multi_person.error_provider'));
      return;
    }
    if (files.length < MULTI_PERSON_MIN || files.length > MULTI_PERSON_MAX) {
      setError(
        t('multi_person.error_count', {
          min: String(MULTI_PERSON_MIN),
          max: String(MULTI_PERSON_MAX),
        }),
      );
      return;
    }
    if (!selectedTemplate) {
      setError(t('multi_person.error_need_template'));
      return;
    }
    if (!settings.isDemoMode && !settings.effectiveApiKey) {
      setError(t('multi_person.error_need_key'));
      return;
    }
    if (providerMax != null && files.length > providerMax) {
      setError(t('multi_person.error_provider_limit', { max: String(providerMax) }));
      return;
    }

    setLoading(true);
    setError(null);
    setResultUrl(null);
    const stop = startRandomProgressTicker(setProgress);

    try {
      const prompt = buildMultiPersonPromptFromTemplate(selectedTemplate, files.length);
      const url = await runImageGeneration({
        prompt,
        images: files,
        settings: {
          apiKey: settings.effectiveApiKey,
          model: settings.effectiveModel,
          provider: settings.imageProvider,
        },
        aspectRatio: selectedTemplate.aspectRatio,
        includeImageConfig: true,
        context: 'multi-person',
      });
      setResultUrl(url);
    } catch (err) {
      if (!isAbortError(err)) {
        logger.error('Multi-person generation failed', err);
        setError(formatApiErrorMessage(err, t, 'multi_person'));
      }
    } finally {
      stop();
      setProgress(100);
      setLoading(false);
    }
  }, [files, providerMax, providerOk, selectedTemplate, settings, t]);

  return {
    templates,
    files,
    previewUrls,
    templateId,
    setTemplateId,
    selectedTemplate,
    resultUrl,
    loading,
    progress,
    error,
    providerOk,
    min: MULTI_PERSON_MIN,
    max: MULTI_PERSON_MAX,
    addFiles,
    removeAt,
    move,
    generate,
    canGenerate:
      providerOk &&
      files.length >= MULTI_PERSON_MIN &&
      files.length <= MULTI_PERSON_MAX &&
      Boolean(selectedTemplate) &&
      !loading,
  };
}
