import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useHistory } from '../../hooks/useHistory';
import { useDemoTryOnSamples } from '../../hooks/useDemoSampleInput';
import { fileFromSourceUrl, useHistoryReplay } from '../../hooks/useHistoryReplay';
import { generateVirtualTryOn } from '../../services/geminiService';
import { generateTryOnPrompt } from '../../services/gemini/prompts/tryOn';
import { prepareTryOnRequest } from '../../services/gemini/tryOn';
import { formatApiErrorMessage, type ServiceSettings } from '../../services/gemini/shared';
import { logger } from '../../utils/logger';
import { buildHistoryOptions } from '../../utils/historyOptions';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import { allFailedError } from '../../utils/generationHelpers';
import { useGenerationFailures } from '../../hooks/useGenerationFailures';
import { useGenerationAttempt } from '../../hooks/useGenerationAttempt';
import { materialFile } from '../../utils/materialFile';
import {
  loadTryOnDraft,
  saveTryOnDraft,
  deleteTryOnDraft,
  type TryOnDraft,
} from '../../utils/tryOnDraftDb';
import { TRYON_MATERIALS, type TryOnMaterial } from '../../constants/tryOnMaterials';
import {
  TRYON_OPTIONAL_REFERENCE_ROLES,
  parseTryOnRecipe,
  MAX_TRYON_PROMPT_LENGTH,
  type HistoryReference,
  type TryOnOptionalReferenceRole,
  type TryOnRecipe,
} from '../../types/tryOnRecipe';
import {
  TRYON_BACKGROUNDS,
  TRYON_STYLES,
  DEFAULT_TRYON_BACKGROUND,
  DEFAULT_TRYON_STYLE,
} from '../../constants/tryOn';
import {
  MIN_CLOTHING_IMAGES,
  MAX_CLOTHING_IMAGES,
  DEFAULT_TRYON_OUTPUT_SIZE,
  DEFAULT_TRYON_ASPECT_RATIO,
} from './types';

type ReferenceFile = { file: File; materialId?: string };
type TryOnInputs = {
  person: File | null;
  clothing: ReferenceFile[];
  references: Partial<Record<TryOnOptionalReferenceRole, ReferenceFile>>;
  settings: TryOnRecipe['settings'];
  promptOverride?: string;
};

function emptyInputs(): TryOnInputs {
  return {
    person: null,
    clothing: [],
    references: {},
    settings: {
      background: DEFAULT_TRYON_BACKGROUND,
      style: DEFAULT_TRYON_STYLE,
      outputSize: DEFAULT_TRYON_OUTPUT_SIZE,
      aspectRatio: DEFAULT_TRYON_ASPECT_RATIO,
      quantity: 1,
      keepBackground: false,
      keepPose: true,
    },
  };
}

function recipeFor(inputs: TryOnInputs): TryOnRecipe {
  return {
    v: 1,
    kind: 'tryon',
    materialIds: [
      ...inputs.clothing,
      ...TRYON_OPTIONAL_REFERENCE_ROLES.flatMap((role) => inputs.references[role] ?? []),
    ].flatMap((ref) => (ref.materialId ? [ref.materialId] : [])),
    settings: { ...inputs.settings },
    ...(inputs.promptOverride !== undefined ? { promptOverride: inputs.promptOverride } : {}),
  };
}

function storedReferences(inputs: TryOnInputs): HistoryReference[] {
  return [
    ...inputs.clothing.map((ref) => ({
      role: 'clothing' as const,
      blob: ref.file,
      name: ref.file.name,
      materialId: ref.materialId,
    })),
    ...TRYON_OPTIONAL_REFERENCE_ROLES.flatMap((role) => {
      const ref = inputs.references[role];
      return ref ? [{ role, blob: ref.file, name: ref.file.name, materialId: ref.materialId }] : [];
    }),
  ];
}

function restoreInputs(
  recipe: TryOnRecipe,
  person: File | null,
  references: HistoryReference[],
): TryOnInputs {
  const restored: TryOnInputs = {
    ...emptyInputs(),
    person,
    settings: recipe.settings,
    promptOverride: recipe.promptOverride,
  };
  for (const ref of references) {
    const value = {
      file: new File([ref.blob], ref.name, { type: ref.blob.type }),
      materialId: ref.materialId,
    };
    if (ref.role === 'clothing') {
      if (restored.clothing.length < MAX_CLOTHING_IMAGES) restored.clothing.push(value);
    } else if (TRYON_OPTIONAL_REFERENCE_ROLES.includes(ref.role))
      restored.references[ref.role] = value;
  }
  return restored;
}

function requestOptions(current: TryOnInputs, settings?: ServiceSettings, variationIndex?: number) {
  return {
    settings,
    variationIndex,
    promptOverride: current.promptOverride,
    backgroundHint: TRYON_BACKGROUNDS.find((item) => item.id === current.settings.background)
      ?.promptHint,
    styleHint: TRYON_STYLES.find((item) => item.id === current.settings.style)?.promptHint,
    outputSize: current.settings.outputSize,
    aspectRatio: current.settings.aspectRatio,
    keepBackground: current.settings.keepBackground,
    keepPose: current.settings.keepPose,
    referenceFiles: Object.fromEntries(
      Object.entries(current.references).map(([role, ref]) => [role, ref.file]),
    ),
    referenceHints: Object.fromEntries(
      Object.entries(current.references).flatMap(([role, ref]) => {
        const material = TRYON_MATERIALS.find((item) => item.id === ref.materialId);
        return material ? [[role, material.prompt]] : [];
      }),
    ),
  };
}

export function useTryOn() {
  const { t } = useLanguage();
  const settings = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const latestLocation = useRef(location);
  latestLocation.current = location;
  const { addToHistory } = useHistory();
  const run = useGenerationFailures();
  const resetRun = run.reset;
  const cancelRun = run.cancel;
  const attempts = useGenerationAttempt();
  const [inputs, setInputs] = useState<TryOnInputs>(emptyInputs);
  const [draftStatus, setDraftStatus] = useState<'loading' | 'saved' | 'error' | 'empty'>(
    'loading',
  );
  const [draftReady, setDraftReady] = useState(false);
  const [materialLoading, setMaterialLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const revision = useRef(0);
  const explicitInput = useRef(false);
  const pendingRecipe = useRef<TryOnRecipe | null>(null);
  const persistedInputs = useRef(inputs);
  const mounted = useRef(true);
  const materialRequests = useRef(new Map<string, AbortController>());
  const recipeRequest = useRef<AbortController | null>(null);
  const previousDemo = useRef(settings.isDemoMode);
  const batch = useRef<{
    inputs: TryOnInputs;
    serviceSettings: ReturnType<typeof settings.toServiceSettings>;
    metadata: { imageProvider: string; model: string };
  } | null>(null);

  useEffect(() => {
    mounted.current = true;
    const requests = materialRequests.current;
    return () => {
      mounted.current = false;
      recipeRequest.current?.abort();
      for (const controller of requests.values()) controller.abort();
    };
  }, []);

  const updateInputs = useCallback((change: (current: TryOnInputs) => TryOnInputs) => {
    revision.current += 1;
    setInputs(change);
    setError(null);
  }, []);
  const updateSettings = useCallback(
    <K extends keyof TryOnRecipe['settings']>(key: K, value: TryOnRecipe['settings'][K]) => {
      updateInputs((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
    },
    [updateInputs],
  );
  const setPerson = useCallback(
    (file: File | null) => {
      updateInputs((current) => ({ ...current, person: file }));
      setResult(null);
      setResults([]);
    },
    [updateInputs],
  );
  const addClothing = useCallback(
    (files: File[]) => {
      updateInputs((current) => ({
        ...current,
        clothing: [...current.clothing, ...files.map((file) => ({ file }))].slice(
          0,
          MAX_CLOTHING_IMAGES,
        ),
      }));
      setResult(null);
      setResults([]);
    },
    [updateInputs],
  );
  const demoPerson = useCallback(
    (file: File | null) => setInputs((current) => ({ ...current, person: file })),
    [],
  );
  const demoClothing = useCallback(
    (files: File[]) =>
      setInputs((current) => ({ ...current, clothing: files.map((file) => ({ file })) })),
    [],
  );
  useDemoTryOnSamples(demoPerson, demoClothing);

  const applyRecipe = useCallback(
    (value: TryOnRecipe, merge = false, onApplied?: () => void) => {
      const recipe = parseTryOnRecipe(value);
      if (!recipe) {
        setError(t('tryon.recipe_invalid'));
        return;
      }
      const materials = recipe.materialIds.map((id) =>
        TRYON_MATERIALS.find((material) => material.id === id),
      );
      if (
        materials.some((material) => !material) ||
        materials.filter((material) => material?.role === 'clothing').length >
          MAX_CLOTHING_IMAGES ||
        TRYON_OPTIONAL_REFERENCE_ROLES.some(
          (role) => materials.filter((material) => material?.role === role).length > 1,
        )
      ) {
        setError(t('tryon.recipe_material_missing'));
        return;
      }
      if (merge) {
        const newClothing = materials.filter(
          (material) =>
            material?.role === 'clothing' &&
            !inputs.clothing.some((ref) => ref.materialId === material?.id),
        );
        if (inputs.clothing.length + newClothing.length > MAX_CLOTHING_IMAGES) {
          setError(t('tryon.error_too_many_clothing'));
          return;
        }
        const replacesReference = materials.some(
          (material) =>
            material &&
            material.role !== 'clothing' &&
            inputs.references[material.role] &&
            inputs.references[material.role]?.materialId !== material.id,
        );
        if (replacesReference && !window.confirm(t('main.unsaved_confirm'))) return;
      }
      if (settings.isDemoMode) {
        pendingRecipe.current = recipe;
        setInputs((current) => ({ ...current, settings: recipe.settings }));
        return;
      }
      explicitInput.current = true;
      revision.current += 1;
      const currentRevision = revision.current;
      for (const request of materialRequests.current.values()) request.abort();
      recipeRequest.current?.abort();
      const controller = new AbortController();
      recipeRequest.current = controller;
      setMaterialLoading(true);
      void Promise.all(
        materials.map(async (material) => ({
          material: material!,
          file: await materialFile(material!, controller.signal),
        })),
      )
        .then((files) => {
          if (!mounted.current || controller.signal.aborted || revision.current !== currentRevision)
            return;
          attempts.cancel();
          resetRun();
          batch.current = null;
          setResult(null);
          setResults([]);
          setLoading(false);
          setProgress(0);
          setInputs((current) => {
            const next: TryOnInputs = {
              ...current,
              clothing: merge ? [...current.clothing] : [],
              references: merge ? { ...current.references } : {},
              settings: merge ? current.settings : recipe.settings,
              promptOverride: merge ? current.promptOverride : recipe.promptOverride,
            };
            for (const { material, file } of files) {
              const ref = { file, materialId: material.id };
              if (material.role === 'clothing') {
                if (!next.clothing.some((item) => item.materialId === material.id))
                  next.clothing.push(ref);
              } else next.references[material.role] = ref;
            }
            return next;
          });
          setDraftReady(true);
          setError(null);
          onApplied?.();
        })
        .catch(async (err) => {
          if (!mounted.current || controller.signal.aborted || revision.current !== currentRevision)
            return;
          setError(formatApiErrorMessage(err, t, 'tryon'));
          if (draftStatus !== 'loading') return;
          try {
            const draft = await loadTryOnDraft();
            if (
              !mounted.current ||
              controller.signal.aborted ||
              revision.current !== currentRevision
            )
              return;
            if (draft) {
              const restored = restoreInputs(
                draft.recipe,
                draft.person
                  ? new File([draft.person.blob], draft.person.name, {
                      type: draft.person.blob.type,
                    })
                  : null,
                draft.references,
              );
              persistedInputs.current = restored;
              setInputs(restored);
            }
            setDraftReady(true);
            setDraftStatus(draft ? 'saved' : 'empty');
          } catch {
            if (
              mounted.current &&
              !controller.signal.aborted &&
              revision.current === currentRevision
            ) {
              setDraftReady(true);
              setDraftStatus('error');
            }
          }
        })
        .finally(() => {
          if (mounted.current && recipeRequest.current === controller) setMaterialLoading(false);
        });
    },
    [t, attempts, resetRun, settings.isDemoMode, draftStatus, inputs],
  );
  const applyRecipeRef = useRef(applyRecipe);
  applyRecipeRef.current = applyRecipe;

  useHistoryReplay((payload) => {
    if (payload.type !== 'tryon' || settings.isDemoMode) return;
    recipeRequest.current?.abort();
    for (const request of materialRequests.current.values()) request.abort();
    explicitInput.current = true;
    revision.current += 1;
    const currentRevision = revision.current;
    setDraftReady(true);
    const opts = payload.options ?? {};
    const fallback = { ...emptyInputs().settings, ...opts };
    const recipe =
      parseTryOnRecipe(opts.recipe) ??
      parseTryOnRecipe({
        v: 1,
        kind: 'tryon',
        materialIds: [],
        settings: {
          background: fallback.background,
          style: fallback.style,
          outputSize: fallback.outputSize,
          aspectRatio: fallback.aspectRatio,
          quantity: fallback.quantity,
          keepBackground: fallback.keepBackground,
          keepPose: fallback.keepPose,
        },
      }) ??
      recipeFor(emptyInputs());
    setInputs(restoreInputs(recipe, null, payload.references ?? []));
    if (!payload.references?.some((ref) => ref.role === 'clothing'))
      setError(t('tryon.replay_clothing_missing'));
    const restore = payload.sourceBlob
      ? Promise.resolve(
          new File([payload.sourceBlob], 'tryon-person.png', { type: payload.sourceBlob.type }),
        )
      : payload.sourceUrl
        ? fileFromSourceUrl(payload.sourceUrl, 'tryon-person.png')
        : Promise.resolve(null);
    void restore
      .then((person) => {
        if (!mounted.current || currentRevision !== revision.current) return;
        setInputs((current) => ({ ...current, person }));
      })
      .catch(() => {
        if (mounted.current && currentRevision === revision.current)
          setError(t('tryon.replay_person_missing'));
      });
  });

  const routeState = location.state as {
    tryOnRecipe?: unknown;
    fromMaterialBasket?: boolean;
  } | null;
  const sharedRecipe = routeState?.tryOnRecipe;
  const fromBasket = routeState?.fromMaterialBasket === true;
  const appliedSharedRecipe = useRef<{ value: unknown; key: string } | null>(null);
  useEffect(() => {
    if (
      !sharedRecipe ||
      (fromBasket && (!draftReady || settings.isDemoMode)) ||
      (appliedSharedRecipe.current?.value === sharedRecipe &&
        (!fromBasket || appliedSharedRecipe.current.key === location.key) &&
        !recipeRequest.current?.signal.aborted)
    )
      return;
    appliedSharedRecipe.current = { value: sharedRecipe, key: location.key };
    const parsed = parseTryOnRecipe(sharedRecipe);
    if (parsed) {
      const transferKey = location.key;
      applyRecipe(
        parsed,
        fromBasket,
        fromBasket
          ? () => {
              const current = latestLocation.current;
              if (current.key !== transferKey || current.state?.tryOnRecipe !== sharedRecipe)
                return;
              const remainingState = { ...current.state };
              delete remainingState.tryOnRecipe;
              delete remainingState.fromMaterialBasket;
              navigate(current.pathname + current.search + current.hash, {
                replace: true,
                state: Object.keys(remainingState).length ? remainingState : null,
              });
            }
          : undefined,
      );
    } else {
      explicitInput.current = true;
      setError(t('tryon.recipe_invalid'));
    }
  }, [
    sharedRecipe,
    applyRecipe,
    t,
    fromBasket,
    draftReady,
    settings.isDemoMode,
    location.key,
    navigate,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    if (previousDemo.current !== settings.isDemoMode) {
      previousDemo.current = settings.isDemoMode;
      attempts.cancel();
      cancelRun();
      resetRun();
      batch.current = null;
      setLoading(false);
      setProgress(0);
      setMaterialLoading(false);
      revision.current += 1;
      recipeRequest.current?.abort();
      for (const request of materialRequests.current.values()) request.abort();
      setInputs(emptyInputs());
      setResult(null);
      setResults([]);
      setError(null);
      explicitInput.current = false;
    }
    if (settings.isDemoMode) {
      setDraftReady(false);
      setDraftStatus('empty');
      return;
    }
    if (pendingRecipe.current) {
      const recipe = pendingRecipe.current;
      pendingRecipe.current = null;
      applyRecipeRef.current(recipe);
      return;
    }
    if (explicitInput.current) {
      setDraftReady(true);
      return;
    }
    setDraftReady(false);
    setDraftStatus('loading');
    const restoreRevision = revision.current;
    void loadTryOnDraft()
      .then((draft) => {
        if (!mounted.current || controller.signal.aborted) return;
        if (!explicitInput.current && revision.current === restoreRevision) {
          if (draft) {
            const restored = restoreInputs(
              draft.recipe,
              draft.person
                ? new File([draft.person.blob], draft.person.name, { type: draft.person.blob.type })
                : null,
              draft.references,
            );
            persistedInputs.current = restored;
            setInputs(restored);
          }
          setDraftStatus(draft ? 'saved' : 'empty');
        }
        setDraftReady(true);
      })
      .catch(() => {
        if (!mounted.current || controller.signal.aborted) return;
        setDraftStatus('error');
        setDraftReady(true);
      });
    return () => controller.abort();
  }, [settings.isDemoMode, attempts, cancelRun, resetRun]);

  useEffect(() => {
    if (!draftReady || settings.isDemoMode || materialLoading) return;
    if (persistedInputs.current === inputs) return;
    const currentRevision = revision.current;
    const hasInput = Boolean(
      inputs.person || inputs.clothing.length || Object.keys(inputs.references).length,
    );
    if (!hasInput && currentRevision === 0) return;
    persistedInputs.current = inputs;
    const draft: TryOnDraft = {
      person: inputs.person ? { blob: inputs.person, name: inputs.person.name } : null,
      references: storedReferences(inputs),
      recipe: recipeFor(inputs),
    };
    void saveTryOnDraft(draft)
      .then(() => {
        if (mounted.current && revision.current === currentRevision)
          setDraftStatus(hasInput ? 'saved' : 'empty');
      })
      .catch(() => {
        if (mounted.current && revision.current === currentRevision) setDraftStatus('error');
      });
  }, [inputs, draftReady, settings.isDemoMode, materialLoading]);

  const [personPreviewUrl, setPersonPreviewUrl] = useState<string | null>(null);
  const [clothingPreviewUrls, setClothingPreviewUrls] = useState<string[]>([]);
  const [referencePreviewUrls, setReferencePreviewUrls] = useState<
    Partial<Record<TryOnOptionalReferenceRole, string>>
  >({});
  useEffect(() => {
    const url = inputs.person ? URL.createObjectURL(inputs.person) : null;
    setPersonPreviewUrl(url);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [inputs.person]);
  useEffect(() => {
    const urls = inputs.clothing.map(({ file }) => URL.createObjectURL(file));
    setClothingPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [inputs.clothing]);
  useEffect(() => {
    const urls: Partial<Record<TryOnOptionalReferenceRole, string>> = {};
    for (const role of TRYON_OPTIONAL_REFERENCE_ROLES)
      if (inputs.references[role]) urls[role] = URL.createObjectURL(inputs.references[role]!.file);
    setReferencePreviewUrls(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [inputs.references]);

  const addMaterial = useCallback(
    async (material: TryOnMaterial) => {
      if (
        settings.isDemoMode ||
        materialRequests.current.has(material.id) ||
        recipeFor(inputs).materialIds.includes(material.id)
      )
        return;
      if (material.role === 'clothing' && inputs.clothing.length >= MAX_CLOTHING_IMAGES) return;
      revision.current += 1;
      const controller = new AbortController();
      materialRequests.current.set(material.id, controller);
      try {
        const file = await materialFile(material, controller.signal);
        if (!mounted.current || controller.signal.aborted) return;
        setInputs((current) => {
          if (recipeFor(current).materialIds.includes(material.id)) return current;
          const ref = { file, materialId: material.id };
          return material.role === 'clothing'
            ? { ...current, clothing: [...current.clothing, ref].slice(0, MAX_CLOTHING_IMAGES) }
            : { ...current, references: { ...current.references, [material.role]: ref } };
        });
        setError(null);
      } catch (err) {
        if (mounted.current && !controller.signal.aborted)
          setError(formatApiErrorMessage(err, t, 'tryon'));
      } finally {
        materialRequests.current.delete(material.id);
      }
    },
    [inputs, settings.isDemoMode, t],
  );
  const removeMaterial = useCallback(
    (id: string) => {
      materialRequests.current.get(id)?.abort();
      updateInputs((current) => ({
        ...current,
        clothing: current.clothing.filter((ref) => ref.materialId !== id),
        references: Object.fromEntries(
          Object.entries(current.references).filter(([, ref]) => ref.materialId !== id),
        ),
      }));
    },
    [updateInputs],
  );
  const setReference = useCallback(
    (role: TryOnOptionalReferenceRole, file: File | null) => {
      updateInputs((current) => {
        const references = { ...current.references };
        if (file) references[role] = { file };
        else delete references[role];
        return { ...current, references };
      });
    },
    [updateInputs],
  );
  const removeClothing = useCallback(
    (index: number) =>
      updateInputs((current) => ({
        ...current,
        clothing: current.clothing.filter((_, i) => i !== index),
      })),
    [updateInputs],
  );
  const clearClothing = useCallback(
    () => updateInputs((current) => ({ ...current, clothing: [] })),
    [updateInputs],
  );
  const clearDraft = useCallback(async () => {
    revision.current += 1;
    const clearRevision = revision.current;
    recipeRequest.current?.abort();
    for (const controller of materialRequests.current.values()) controller.abort();
    try {
      await deleteTryOnDraft();
      if (mounted.current && revision.current === clearRevision) {
        const cleared = emptyInputs();
        persistedInputs.current = cleared;
        setInputs(cleared);
        setResult(null);
        setResults([]);
        setError(null);
        setDraftStatus('empty');
      }
    } catch (error) {
      if (mounted.current && revision.current === clearRevision) setDraftStatus('error');
      throw error;
    }
  }, []);

  const cancelGeneration = useCallback(() => {
    attempts.cancel();
    cancelRun();
    setLoading(false);
    setProgress(0);
  }, [attempts, cancelRun]);
  const generateOne = useCallback(
    (
      snapshot: NonNullable<typeof batch.current>,
      index: number,
      total: number,
      signal: AbortSignal,
    ) => {
      const current = snapshot.inputs;
      const options = requestOptions(
        current,
        { ...snapshot.serviceSettings, abortSignal: signal },
        total > 1 ? index : undefined,
      );
      const clothing = current.clothing.map((ref) => ref.file);
      const prepared = prepareTryOnRequest(current.person!, clothing, options);
      return generateVirtualTryOn(current.person!, clothing, options).then((dataUrl) => {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        void addToHistory(
          'tryon',
          dataUrl,
          buildHistoryOptions('tryon', snapshot.metadata, {
            ...current.settings,
            clothingCount: clothing.length,
            variationIndex: index,
            prompt: prepared.prompt,
            effectiveOutputSize: prepared.effectiveSize,
            recipe: recipeFor(current),
          }),
          current.person,
          storedReferences(current),
        );
        return dataUrl;
      });
    },
    [addToHistory],
  );

  const handleGenerate = useCallback(async () => {
    if (!inputs.person) {
      setError(t('tryon.error_no_person'));
      return;
    }
    if (inputs.clothing.length < MIN_CLOTHING_IMAGES) {
      setError(t('tryon.error_no_clothing'));
      return;
    }
    if (inputs.clothing.length > MAX_CLOTHING_IMAGES) {
      setError(t('tryon.error_too_many_clothing'));
      return;
    }
    if (materialLoading) return;
    if (
      inputs.promptOverride !== undefined &&
      (!inputs.promptOverride.trim() || inputs.promptOverride.length > MAX_TRYON_PROMPT_LENGTH)
    ) {
      setError(t('error.invalid_request'));
      return;
    }
    const serviceSettings = settings.toServiceSettings();
    const snapshot = {
      inputs,
      serviceSettings,
      metadata: {
        imageProvider: settings.imageProvider,
        model: serviceSettings.model ?? settings.model,
      },
    };
    batch.current = snapshot;
    const attempt = attempts.begin();
    if (!attempt.isCurrent()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setResults([]);
    setProgress(0);
    resetRun();
    const total = inputs.settings.quantity;
    try {
      let completed = 0;
      const outcome = await run.runBatch(total, (index, signal) =>
        generateOne(snapshot, index, total, signal).then((dataUrl) => {
          if (signal.aborted || !attempt.isCurrent())
            throw new DOMException('Aborted', 'AbortError');
          completed += 1;
          setProgress(Math.round((completed / total) * 90));
          return dataUrl;
        }),
      );
      if (outcome.cancelled || !attempt.isCurrent()) return;
      if (!outcome.results.length) throw allFailedError(outcome.failures);
      if (outcome.results.length === 1 && total === 1) setResult(outcome.results[0]);
      else setResults(outcome.results);
    } catch (err) {
      if (attempt.isCurrent()) {
        setError(formatApiErrorMessage(err, t, 'tryon'));
        logger.error('Try-on generation error:', err);
      }
    } finally {
      if (attempt.isCurrent()) {
        setLoading(false);
        setProgress(0);
      }
      attempts.finish(attempt);
    }
  }, [inputs, materialLoading, settings, attempts, run, resetRun, generateOne, t]);
  const handleRetryFailed = useCallback(async () => {
    const snapshot = batch.current;
    if (!snapshot) return;
    const attempt = attempts.begin();
    try {
      const outcome = await run.retryFailed((index, signal) =>
        generateOne(snapshot, index, snapshot.inputs.settings.quantity, signal),
      );
      if (outcome.cancelled || !attempt.isCurrent() || !outcome.results.length) return;
      setResults((previous) => [...previous, ...outcome.results]);
      setResult(null);
    } catch (err) {
      if (attempt.isCurrent()) setError(formatApiErrorMessage(err, t, 'tryon'));
    } finally {
      attempts.finish(attempt);
    }
  }, [attempts, run, generateOne, t]);
  const clearResult = useCallback(() => {
    cancelGeneration();
    setResult(null);
    setResults([]);
    setError(null);
    resetRun();
  }, [cancelGeneration, resetRun]);
  const handleBatchDownload = useCallback(async () => {
    const list = results.length ? results : result ? [result] : [];
    await downloadBatchWithZipFallback({
      sources: list,
      itemFileName: (index) => `try-on-${index + 1}.png`,
      zipFileName: `try-on-${Date.now()}.zip`,
    });
  }, [result, results]);
  const handlePersonFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPerson(event.target.files?.[0] ?? null);
      event.target.value = '';
    },
    [setPerson],
  );
  const handleClothingFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      addClothing(
        Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/')),
      );
      event.target.value = '';
    },
    [addClothing],
  );
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDraggingOver(false), []);
  const handleDropPerson = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDraggingOver(false);
      const file = Array.from(event.dataTransfer.files).find((file) =>
        file.type.startsWith('image/'),
      );
      if (file) setPerson(file);
    },
    [setPerson],
  );
  const handleDropClothing = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDraggingOver(false);
      addClothing(
        Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith('image/')),
      );
    },
    [addClothing],
  );
  const recipe = useMemo(() => recipeFor(inputs), [inputs]);
  const automaticPrompt = useMemo(
    () =>
      generateTryOnPrompt({
        ...requestOptions(inputs, undefined, inputs.settings.quantity > 1 ? 0 : undefined),
        clothingCount: inputs.clothing.length,
        referenceRoles: TRYON_OPTIONAL_REFERENCE_ROLES.filter((role) => inputs.references[role]),
      }),
    [inputs],
  );
  const resolvedPrompt = inputs.promptOverride ?? automaticPrompt;
  const referenceMap = [
    { role: 'person', name: inputs.person?.name ?? '' },
    ...inputs.clothing.map((ref) => ({ role: 'clothing', name: ref.file.name })),
    ...TRYON_OPTIONAL_REFERENCE_ROLES.flatMap((role) =>
      inputs.references[role] ? [{ role, name: inputs.references[role]!.file.name }] : [],
    ),
  ];
  return {
    automaticPrompt,
    resolvedPrompt,
    promptOverride: inputs.promptOverride,
    referenceMap,
    setPromptOverride: useCallback(
      (value: string | undefined) => {
        if (value !== undefined && value.length > MAX_TRYON_PROMPT_LENGTH) return;
        updateInputs((current) => ({ ...current, promptOverride: value }));
      },
      [updateInputs],
    ),
    personFile: inputs.person,
    personPreviewUrl,
    setPerson,
    clothingFiles: inputs.clothing.map((ref) => ref.file),
    clothingPreviewUrls,
    addClothing,
    removeClothing,
    clearClothing,
    referenceFiles: Object.fromEntries(
      Object.entries(inputs.references).map(([role, ref]) => [role, ref.file]),
    ) as Partial<Record<TryOnOptionalReferenceRole, File>>,
    referencePreviewUrls,
    setReference,
    materialIds: recipe.materialIds,
    addMaterial,
    removeMaterial,
    recipe,
    applyRecipe,
    clearDraft,
    draftStatus,
    materialLoading,
    result,
    results,
    loading,
    error,
    progress,
    isDraggingOver,
    ...inputs.settings,
    setQuantity: useCallback(
      (value: number) => updateSettings('quantity', Math.max(1, Math.min(4, Math.round(value)))),
      [updateSettings],
    ),
    setBackground: useCallback(
      (value: TryOnRecipe['settings']['background']) => updateSettings('background', value),
      [updateSettings],
    ),
    setStyle: useCallback(
      (value: TryOnRecipe['settings']['style']) => updateSettings('style', value),
      [updateSettings],
    ),
    setOutputSize: useCallback(
      (value: TryOnRecipe['settings']['outputSize']) => updateSettings('outputSize', value),
      [updateSettings],
    ),
    setAspectRatio: useCallback(
      (value: TryOnRecipe['settings']['aspectRatio']) => updateSettings('aspectRatio', value),
      [updateSettings],
    ),
    setKeepBackground: useCallback(
      (value: boolean) => updateSettings('keepBackground', value),
      [updateSettings],
    ),
    setKeepPose: useCallback(
      (value: boolean) => updateSettings('keepPose', value),
      [updateSettings],
    ),
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
    cancelGeneration,
    handleRetryFailed,
    canGenerate: Boolean(
      inputs.person &&
      inputs.clothing.length >= MIN_CLOTHING_IMAGES &&
      inputs.clothing.length <= MAX_CLOTHING_IMAGES &&
      !materialLoading &&
      resolvedPrompt.trim(),
    ),
    hasResults: results.length > 0 || result !== null,
    minClothing: MIN_CLOTHING_IMAGES,
    maxClothing: MAX_CLOTHING_IMAGES,
  };
}
