/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Multi-style collage: one photo × 4–6 viral templates → tiles + composed PNG.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getViralTemplateById,
  VIRAL_TEMPLATES,
  type ViralTemplate,
} from '../../constants/viralTemplates';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useDemoSampleInput } from '../../hooks/useDemoSampleInput';
import { generateViralStyleImage } from '../../services/gemini/viralStyle';
import { formatApiErrorMessage } from '../../services/gemini/shared';
import { composeStyleCollage } from '../../utils/composeStyleCollage';
import { isAbortError, startRandomProgressTicker } from '../../utils/generationHelpers';
import { logger } from '../../utils/logger';
import {
  canStartStyleCollage,
  STYLE_COLLAGE_MAX,
  STYLE_COLLAGE_MIN,
  toggleViralSelection,
} from '../../utils/viralSelection';

export type StyleCollageSlot = {
  templateId: string;
  template: ViralTemplate;
  resultUrl: string | null;
  error: string | null;
};

export type StyleCollageLocationState = {
  selectedIds?: string[];
};

const MAX_CONCURRENT = 2;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<Array<PromiseSettledResult<R>>> {
  const results: Array<PromiseSettledResult<R>> = new Array(items.length);
  let next = 0;

  async function runOne(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      try {
        const value = await worker(items[index], index);
        results[index] = { status: 'fulfilled', value };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => runOne());
  await Promise.all(runners);
  return results;
}

export function useStyleCollage() {
  const { t } = useLanguage();
  const settings = useSettings();
  const location = useLocation();

  const initialIds = useMemo(() => {
    const state = location.state as StyleCollageLocationState | null;
    const fromState = state?.selectedIds?.filter((id) => getViralTemplateById(id)) ?? [];
    return fromState.slice(0, STYLE_COLLAGE_MAX);
  }, [location.state]);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [slots, setSlots] = useState<StyleCollageSlot[]>([]);
  const [collageUrl, setCollageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectHint, setSelectHint] = useState<string | null>(null);

  useDemoSampleInput('style-collage', setSourceFile);

  useEffect(() => {
    if (!sourceFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(sourceFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [sourceFile]);

  const selectedTemplates = useMemo(
    () =>
      selectedIds
        .map((id) => getViralTemplateById(id))
        .filter((t): t is ViralTemplate => Boolean(t)),
    [selectedIds],
  );

  const toggleId = useCallback(
    (id: string) => {
      setSelectHint(null);
      setSelectedIds((prev) => {
        const next = toggleViralSelection(prev, id, { max: STYLE_COLLAGE_MAX });
        if (next.rejectedAtMax) {
          setSelectHint(t('style_collage.error_max', { max: String(STYLE_COLLAGE_MAX) }));
        }
        return next.ids;
      });
    },
    [t],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectHint(null);
  }, []);

  const rebuildCollage = useCallback(
    async (nextSlots: StyleCollageSlot[]) => {
      const tiles = nextSlots.map((slot) => ({
        imageUrl: slot.resultUrl,
        label: t(slot.template.titleKey),
      }));
      try {
        const url = await composeStyleCollage({
          tiles,
          background:
            getComputedStyle(document.documentElement).getPropertyValue('--bg-main').trim() ||
            '#1a1216',
          labelColor:
            getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() ||
            '#f5f0f2',
        });
        setCollageUrl(url);
      } catch (err) {
        logger.error('Collage compose failed', err);
      }
    },
    [t],
  );

  const generateAll = useCallback(async () => {
    if (!sourceFile) {
      setError(t('style_collage.error_need_photo'));
      return;
    }
    if (!canStartStyleCollage(selectedTemplates.length)) {
      setError(
        t('style_collage.error_need_count', {
          min: String(STYLE_COLLAGE_MIN),
          max: String(STYLE_COLLAGE_MAX),
        }),
      );
      return;
    }
    if (!settings.isDemoMode && !settings.effectiveApiKey) {
      setError(t('style_collage.error_need_key'));
      return;
    }

    setError(null);
    setLoading(true);
    setCompleted(0);
    setCollageUrl(null);
    const stopTicker = startRandomProgressTicker(setProgress);

    const templates = selectedTemplates;
    const nextSlots: StyleCollageSlot[] = templates.map((template) => ({
      templateId: template.id,
      template,
      resultUrl: null,
      error: null,
    }));
    setSlots(nextSlots);

    const serviceSettings = {
      apiKey: settings.effectiveApiKey,
      model: settings.effectiveModel,
      provider: settings.imageProvider,
    };

    try {
      const settled = await mapPool(templates, MAX_CONCURRENT, async (template) =>
        generateViralStyleImage(sourceFile, template.prompt, serviceSettings, template.aspectRatio),
      );

      let done = 0;
      const updated = nextSlots.map((slot, index) => {
        const outcome = settled[index];
        if (outcome.status === 'fulfilled') {
          done += 1;
          return { ...slot, resultUrl: outcome.value, error: null };
        }
        const reason = outcome.reason;
        if (isAbortError(reason)) {
          return { ...slot, error: t('style_collage.cancelled') };
        }
        return {
          ...slot,
          error: formatApiErrorMessage(reason, t, 'style_collage'),
        };
      });
      setSlots(updated);
      setCompleted(done);
      await rebuildCollage(updated);
    } catch (err) {
      logger.error('Style collage batch failed', err);
      setError(formatApiErrorMessage(err, t, 'style_collage'));
    } finally {
      stopTicker();
      setProgress(100);
      setLoading(false);
    }
  }, [rebuildCollage, selectedTemplates, settings, sourceFile, t]);

  const retrySlot = useCallback(
    async (index: number) => {
      if (!sourceFile || !slots[index]) return;
      const slot = slots[index];
      setLoading(true);
      setError(null);
      try {
        const url = await generateViralStyleImage(
          sourceFile,
          slot.template.prompt,
          {
            apiKey: settings.effectiveApiKey,
            model: settings.effectiveModel,
            provider: settings.imageProvider,
          },
          slot.template.aspectRatio,
        );
        const updated = slots.map((s, i) =>
          i === index ? { ...s, resultUrl: url, error: null } : s,
        );
        setSlots(updated);
        setCompleted(updated.filter((s) => s.resultUrl).length);
        await rebuildCollage(updated);
      } catch (err) {
        if (!isAbortError(err)) {
          setSlots((prev) =>
            prev.map((s, i) =>
              i === index
                ? {
                    ...s,
                    error: formatApiErrorMessage(err, t, 'style_collage'),
                  }
                : s,
            ),
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [rebuildCollage, settings, slots, sourceFile, t],
  );

  const onFileChange = useCallback((file: File | null) => {
    setSourceFile(file);
    setSlots([]);
    setCollageUrl(null);
    setError(null);
  }, []);

  return {
    templates: VIRAL_TEMPLATES,
    sourceFile,
    previewUrl,
    selectedIds,
    selectedTemplates,
    slots,
    collageUrl,
    loading,
    progress,
    completed,
    error,
    selectHint,
    min: STYLE_COLLAGE_MIN,
    max: STYLE_COLLAGE_MAX,
    toggleId,
    clearSelection,
    generateAll,
    retrySlot,
    onFileChange,
    setSourceFile,
    canGenerate: Boolean(sourceFile) && canStartStyleCollage(selectedTemplates.length) && !loading,
  };
}
