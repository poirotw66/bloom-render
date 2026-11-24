/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Multi-style collage: one photo × 4–6 viral templates → tiles + composed image.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { isAbortError } from '../../utils/generationHelpers';
import { logger } from '../../utils/logger';
import type { StyleCollageLayoutMode } from '../../utils/styleCollageLayout';
import {
  canStartStyleCollage,
  STYLE_COLLAGE_MAX,
  STYLE_COLLAGE_MIN,
  toggleViralSelection,
} from '../../utils/viralSelection';
import { pushViralRecent } from '../../utils/viralFavorites';

export type StyleCollageSlot = {
  templateId: string;
  template: ViralTemplate;
  resultUrl: string | null;
  error: string | null;
};

export type StyleCollageLocationState = { selectedIds?: string[] };
export type StyleCollageVersion = {
  id: string;
  collageUrl: string;
  slots: StyleCollageSlot[];
};

type ActiveRun = { controller: AbortController };
const MAX_CONCURRENT = 2;
const MAX_VERSIONS = 4;

/** Settle promptly on cancel even when a provider does not honor its signal. */
function abortable<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
    operation.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}

function variationPrompt(base: string, versionIndex: number): string {
  if (versionIndex <= 0) return base;
  return `${base}\nVariation ${versionIndex + 1}: change lighting angle and micro-composition slightly while keeping the same identity and style.`;
}

export function useStyleCollage() {
  const { t } = useLanguage();
  const settings = useSettings();
  const location = useLocation();
  const initialIds = useMemo(() => {
    const state = location.state as StyleCollageLocationState | null;
    return (state?.selectedIds?.filter((id) => getViralTemplateById(id)) ?? []).slice(
      0,
      STYLE_COLLAGE_MAX,
    );
  }, [location.state]);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [slots, setSlots] = useState<StyleCollageSlot[]>([]);
  const [collageUrl, setCollageUrl] = useState<string | null>(null);
  const [versions, setVersions] = useState<StyleCollageVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectHint, setSelectHint] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<StyleCollageLayoutMode>('grid');
  const [showLabels, setShowLabels] = useState(true);
  const [showBorder, setShowBorder] = useState(false);
  const [gap, setGap] = useState(16);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const mountedRef = useRef(true);
  const runRef = useRef<ActiveRun | null>(null);
  const slotsRef = useRef<StyleCollageSlot[]>([]);
  const compositionIdRef = useRef(0);
  const compositionPromiseRef = useRef<Promise<string | null>>(Promise.resolve(null));
  const compositionSettingsRef = useRef({
    exportFormat,
    gap,
    layoutMode,
    showBorder,
    showLabels,
    t,
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runRef.current?.controller.abort();
      runRef.current = null;
      compositionIdRef.current += 1;
    };
  }, []);

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
        .filter((tmpl): tmpl is ViralTemplate => Boolean(tmpl)),
    [selectedIds],
  );

  const publishSlots = useCallback((nextSlots: StyleCollageSlot[]) => {
    slotsRef.current = nextSlots;
    setSlots(nextSlots);
    setCompleted(nextSlots.filter((slot) => slot.resultUrl).length);
  }, []);

  const rebuildCollage = useCallback((nextSlots: StyleCollageSlot[]) => {
    const compositionId = ++compositionIdRef.current;
    const compose = async () => {
      if (!nextSlots.some((slot) => slot.resultUrl)) return null;
      const options = compositionSettingsRef.current;
      try {
        const url = await composeStyleCollage({
          tiles: nextSlots.map((slot) => ({
            imageUrl: slot.resultUrl,
            label: options.t(slot.template.titleKey),
          })),
          mode: options.layoutMode,
          showLabels: options.showLabels,
          showBorder: options.showBorder,
          gap: options.gap,
          format: options.exportFormat,
          background:
            getComputedStyle(document.documentElement).getPropertyValue('--bg-main').trim() ||
            '#1a1216',
          labelColor:
            getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() ||
            '#f5f0f2',
        });
        if (!mountedRef.current || compositionId !== compositionIdRef.current) return null;
        setCollageUrl(url);
        return url;
      } catch (err) {
        if (mountedRef.current && compositionId === compositionIdRef.current) {
          logger.error('Collage compose failed', err);
        }
        return null;
      }
    };
    const pending = compose();
    compositionPromiseRef.current = pending;
    return pending;
  }, []);

  useEffect(() => {
    compositionSettingsRef.current = { exportFormat, gap, layoutMode, showBorder, showLabels, t };
    void rebuildCollage(slotsRef.current);
  }, [exportFormat, gap, layoutMode, showBorder, showLabels, t, rebuildCollage]);

  const cancel = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    runRef.current = null;
    run.controller.abort();
    const nextSlots = slotsRef.current.map((slot) =>
      slot.resultUrl || slot.error ? slot : { ...slot, error: t('style_collage.cancelled') },
    );
    publishSlots(nextSlots);
    setLoading(false);
    setError(t('style_collage.cancelled'));
    void rebuildCollage(nextSlots);
  }, [publishSlots, rebuildCollage, t]);

  const toggleId = useCallback(
    (id: string) => {
      if (runRef.current) return;
      setSelectHint(null);
      setSelectedIds((prev) => {
        const next = toggleViralSelection(prev, id, { max: STYLE_COLLAGE_MAX });
        if (next.rejectedAtMax)
          setSelectHint(t('style_collage.error_max', { max: String(STYLE_COLLAGE_MAX) }));
        return next.ids;
      });
    },
    [t],
  );

  const clearSelection = useCallback(() => {
    if (runRef.current) return;
    setSelectedIds([]);
    setSelectHint(null);
  }, []);

  const runGeneration = useCallback(
    async (versionIndex: number) => {
      if (runRef.current) return;
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

      const run: ActiveRun = { controller: new AbortController() };
      runRef.current = run;
      const isCurrent = () => mountedRef.current && runRef.current === run;
      const templates = selectedTemplates;
      let next = 0;
      let settledCount = 0;
      setError(null);
      setLoading(true);
      setProgress(0);
      setCollageUrl(null);
      compositionIdRef.current += 1;
      publishSlots(
        templates.map((template) => ({
          templateId: template.id,
          template,
          resultUrl: null,
          error: null,
        })),
      );
      for (const template of templates) pushViralRecent(template.id);
      const serviceSettings = {
        apiKey: settings.effectiveApiKey,
        model: settings.effectiveModel,
        provider: settings.imageProvider,
        abortSignal: run.controller.signal,
      };

      async function worker() {
        while (isCurrent() && !run.controller.signal.aborted && next < templates.length) {
          const index = next++;
          const template = templates[index];
          try {
            const url = await abortable(
              generateViralStyleImage(
                sourceFile!,
                variationPrompt(template.prompt, versionIndex),
                serviceSettings,
                template.aspectRatio,
                { viralTemplateId: template.id },
              ),
              run.controller.signal,
            );
            if (!isCurrent()) return;
            publishSlots(
              slotsRef.current.map((slot, i) =>
                i === index ? { ...slot, resultUrl: url, error: null } : slot,
              ),
            );
          } catch (reason) {
            if (!isCurrent()) return;
            publishSlots(
              slotsRef.current.map((slot, i) =>
                i === index
                  ? {
                      ...slot,
                      error: isAbortError(reason)
                        ? t('style_collage.cancelled')
                        : formatApiErrorMessage(reason, t, 'style_collage'),
                    }
                  : slot,
              ),
            );
          }
          settledCount += 1;
          setProgress((settledCount / templates.length) * 100);
          void rebuildCollage(slotsRef.current);
        }
      }

      try {
        await Promise.all(
          Array.from({ length: Math.min(MAX_CONCURRENT, templates.length) }, worker),
        );
        if (!isCurrent()) return;
        const finalSlots = slotsRef.current;
        let pending = rebuildCollage(finalSlots);
        let url = await pending;
        // A layout/language change may supersede the final render. Save the version
        // with that latest composition rather than dropping the version or using stale art.
        while (isCurrent() && pending !== compositionPromiseRef.current) {
          pending = compositionPromiseRef.current;
          url = await pending;
        }
        if (!isCurrent() || !url) return;
        setVersions((prev) => {
          const entry = {
            id: `v-${Date.now()}-${versionIndex}`,
            collageUrl: url,
            slots: finalSlots,
          };
          const nextVersions = [...prev, entry].slice(-MAX_VERSIONS);
          setActiveVersion(nextVersions.length - 1);
          return nextVersions;
        });
      } finally {
        if (isCurrent()) {
          runRef.current = null;
          setLoading(false);
        }
      }
    },
    [publishSlots, rebuildCollage, selectedTemplates, settings, sourceFile, t],
  );

  const generateAll = useCallback(() => runGeneration(0), [runGeneration]);
  const regenerate = useCallback(() => {
    if (versions.length >= MAX_VERSIONS || runRef.current) return;
    void runGeneration(versions.length);
  }, [runGeneration, versions.length]);

  const selectVersion = useCallback(
    (index: number) => {
      if (runRef.current) return;
      const version = versions[index];
      if (!version) return;
      compositionIdRef.current += 1;
      setActiveVersion(index);
      publishSlots(version.slots);
      setCollageUrl(version.collageUrl);
    },
    [publishSlots, versions],
  );

  const retrySlot = useCallback(
    async (index: number) => {
      if (runRef.current || !sourceFile || !slotsRef.current[index]) return;
      const slot = slotsRef.current[index];
      const run: ActiveRun = { controller: new AbortController() };
      runRef.current = run;
      const isCurrent = () => mountedRef.current && runRef.current === run;
      setLoading(true);
      setError(null);
      setProgress(0);
      try {
        const url = await abortable(
          generateViralStyleImage(
            sourceFile,
            variationPrompt(slot.template.prompt, versions.length),
            {
              apiKey: settings.effectiveApiKey,
              model: settings.effectiveModel,
              provider: settings.imageProvider,
              abortSignal: run.controller.signal,
            },
            slot.template.aspectRatio,
            { viralTemplateId: slot.template.id },
          ),
          run.controller.signal,
        );
        if (!isCurrent()) return;
        publishSlots(
          slotsRef.current.map((entry, i) =>
            i === index ? { ...entry, resultUrl: url, error: null } : entry,
          ),
        );
        setProgress(100);
        await rebuildCollage(slotsRef.current);
      } catch (err) {
        if (!isCurrent()) return;
        publishSlots(
          slotsRef.current.map((entry, i) =>
            i === index
              ? {
                  ...entry,
                  error: isAbortError(err)
                    ? t('style_collage.cancelled')
                    : formatApiErrorMessage(err, t, 'style_collage'),
                }
              : entry,
          ),
        );
      } finally {
        if (isCurrent()) {
          runRef.current = null;
          setLoading(false);
        }
      }
    },
    [publishSlots, rebuildCollage, settings, sourceFile, t, versions.length],
  );

  const onFileChange = useCallback(
    (file: File | null) => {
      runRef.current?.controller.abort();
      runRef.current = null;
      compositionIdRef.current += 1;
      setSourceFile(file);
      publishSlots([]);
      setCollageUrl(null);
      setVersions([]);
      setActiveVersion(0);
      setError(null);
      setLoading(false);
      setProgress(0);
    },
    [publishSlots],
  );

  useDemoSampleInput('style-collage', onFileChange);

  return {
    templates: VIRAL_TEMPLATES,
    sourceFile,
    previewUrl,
    selectedIds,
    selectedTemplates,
    slots,
    collageUrl,
    versions,
    activeVersion,
    loading,
    progress,
    completed,
    error,
    selectHint,
    min: STYLE_COLLAGE_MIN,
    max: STYLE_COLLAGE_MAX,
    layoutMode,
    setLayoutMode,
    showLabels,
    setShowLabels,
    showBorder,
    setShowBorder,
    gap,
    setGap,
    exportFormat,
    setExportFormat,
    toggleId,
    clearSelection,
    generateAll,
    regenerate,
    selectVersion,
    retrySlot,
    onFileChange,
    setSourceFile: onFileChange,
    cancel,
    canGenerate: Boolean(sourceFile) && canStartStyleCollage(selectedTemplates.length) && !loading,
    canRegenerate:
      Boolean(sourceFile) && slots.length > 0 && versions.length < MAX_VERSIONS && !loading,
  };
}
