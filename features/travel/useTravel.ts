/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import * as React from 'react';
import { generateTravelPhoto, generateOptimizedPrompt } from '../../services/geminiService';
import { generateDynamicTravelPrompt } from '../../utils/travelPromptGenerator';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHistory } from '../../hooks/useHistory';
import { formatApiErrorMessage, supportsMultiResolution } from '../../services/gemini/shared';
import { logger } from '../../utils/logger';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import {
  allFailedError,
  isAbortError,
  startRandomProgressTicker,
} from '../../utils/generationHelpers';
import { useGenerationFailures } from '../../hooks/useGenerationFailures';
import { useGenerationAttempt } from '../../hooks/useGenerationAttempt';
import {
  TRAVEL_SCENE_ID_RANDOM,
  pickRandomTravelScene,
  loadTravelSceneCatalog,
  DEFAULT_TRAVEL_ASPECT,
  DEFAULT_TRAVEL_IMAGE_SIZE,
  TRAVEL_STYLES,
  DEFAULT_TRAVEL_STYLE,
  TRAVEL_WEATHER_OPTIONS,
  TRAVEL_TIME_OPTIONS,
  TRAVEL_VIBE_OPTIONS,
  TRAVEL_OUTFIT_OPTIONS,
  TRAVEL_POSE_OPTIONS,
  TRAVEL_RELATIONSHIP_OPTIONS,
  TRAVEL_FRAMING_OPTIONS,
  OUTFIT_COLOR_PRESETS,
} from '../../constants/travel';
import type { TravelSceneCatalog } from '../../constants/travelScenesLoader';
import type {
  TravelAspectRatio,
  TravelImageSize,
  TravelStyle,
  TravelWeather,
  TravelTimeOfDay,
  TravelVibe,
  TravelOutfit,
  TravelPose,
  TravelRelationship,
  TravelFraming,
} from '../../constants/travel';
import { mimeTypeForImagePath, referenceFileName, sceneRefPath } from '../../utils/imageAsset';
import { buildHistoryOptions } from '../../utils/historyOptions';
import { publicAssetUrl } from '../../utils/publicAsset';
import { useDemoSampleFiles } from '../../hooks/useDemoSampleInput';
import { fileFromSourceUrl, useHistoryReplay } from '../../hooks/useHistoryReplay';

export type TravelSceneIdOrCustom = string;

// Helper to load an image from a URL (e.g., from public folder) as a File object
async function urlToFile(
  path: string,
  filename: string,
  mimeType: string,
  signal?: AbortSignal,
): Promise<File> {
  const res = await fetch(publicAssetUrl(path), { signal });
  if (!res.ok) throw new Error('error.failed_fetch');

  const contentType = res.headers.get('content-type');
  if (contentType && !contentType.startsWith('image/')) {
    throw new Error('error.invalid_content_type');
  }

  const blob = await res.blob();
  if (blob.size < 100) {
    // arbitrary small size check to avoid empty/error responses
    throw new Error('error.file_too_small');
  }
  const type = blob.type && blob.type.startsWith('image/') ? blob.type : mimeType;
  return new File([blob], filename, { type });
}

export function useTravel() {
  const { t } = useLanguage();
  const settings = useSettings();
  const { addToHistory } = useHistory();
  const run = useGenerationFailures();
  const attempts = useGenerationAttempt();
  const cancelRun = run.cancel;

  // A retry must reuse the exact generator the original run resolved: the same
  // scene reference file and the same rolled values for 'random' weather/time,
  // otherwise recovered images wouldn't match the ones beside them.
  const retryGeneratorRef = useRef<
    ((index: number, signal: AbortSignal) => Promise<string>) | null
  >(null);

  const [files, setFiles] = useState<File[]>([]);
  useDemoSampleFiles('travel', setFiles, 1);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [sceneCatalog, setSceneCatalog] = useState<TravelSceneCatalog | null>(null);
  const [scenesLoading, setScenesLoading] = useState(true);
  const [selectedSceneId, setSelectedSceneId] = useState<TravelSceneIdOrCustom>('shibuya');
  const [customSceneText, setCustomSceneText] = useState('');
  const [customSceneReferenceFile, setCustomSceneReferenceFile] = useState<File | null>(null);
  const [customSceneReferenceUrl, setCustomSceneReferenceUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<TravelAspectRatio>(DEFAULT_TRAVEL_ASPECT);
  const [imageSize, setImageSize] = useState<TravelImageSize>(DEFAULT_TRAVEL_IMAGE_SIZE);
  const [style, setStyle] = useState<TravelStyle>(DEFAULT_TRAVEL_STYLE);
  // New state for controlling reference image usage
  const [useReferenceImage, setUseReferenceImage] = useState<boolean>(true);

  // New prompt injection state
  const [weather, setWeather] = useState<TravelWeather>('random');
  const [timeOfDay, setTimeOfDay] = useState<TravelTimeOfDay>('random');
  const [vibe, setVibe] = useState<TravelVibe | 'none'>('none');
  const [outfit, setOutfit] = useState<TravelOutfit>('default');
  const [outfitColor, setOutfitColor] = useState<string>('');
  const [customOutfitText, setCustomOutfitText] = useState('');
  const [pose, setPose] = useState<TravelPose>('natural');
  const [customPoseText, setCustomPoseText] = useState('');
  const [relationship, setRelationship] = useState<TravelRelationship>('default');
  const [framing, setFraming] = useState<TravelFraming>('default');
  const [clearBackground, setClearBackground] = useState<boolean>(false);

  const [resultMetadata, setResultMetadata] = useState<{
    outfit: TravelOutfit;
    outfitColor: string;
    customOutfitText?: string;
    pose: TravelPose;
    customPoseText?: string;
    relationship: TravelRelationship;
    weather: TravelWeather;
    time: TravelTimeOfDay;
    vibe: TravelVibe | 'none';
    style: TravelStyle;
    framing: TravelFraming;
    clearBackground: boolean;
  } | null>(null);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [resultSceneNameKey, setResultSceneNameKey] = useState<string | null>(null);
  const [resultSceneCustomLabel, setResultSceneCustomLabel] = useState<string | null>(null);

  // Memoised because this feeds the dependency arrays of resolveScenePrompt,
  // handleGenerate and handleSurpriseMe. As a bare `?? []` it was a fresh array
  // on every render, so those callbacks were rebuilt every render and their
  // dependency lists never actually gated anything.
  const travelScenes = useMemo(() => sceneCatalog?.all ?? [], [sceneCatalog]);

  useHistoryReplay((payload) => {
    if (payload.type !== 'travel') return;
    const opts = payload.options ?? {};
    if (typeof opts.sceneId === 'string') setSelectedSceneId(opts.sceneId);
    if (typeof opts.style === 'string') setStyle(opts.style as TravelStyle);
    if (typeof opts.aspectRatio === 'string') setAspectRatio(opts.aspectRatio as TravelAspectRatio);
    if (typeof opts.imageSize === 'string') setImageSize(opts.imageSize as TravelImageSize);
    if (typeof opts.weather === 'string') setWeather(opts.weather as TravelWeather);
    if (typeof opts.time === 'string') setTimeOfDay(opts.time as TravelTimeOfDay);
    if (payload.sourceUrl) {
      void fileFromSourceUrl(payload.sourceUrl, 'travel-source.png').then((file) =>
        setFiles([file]),
      );
    }
  });

  const cancelGeneration = useCallback(() => {
    attempts.cancel();
    cancelRun();
    setLoading(false);
    setProgress(0);
  }, [attempts, cancelRun]);

  useEffect(() => {
    let cancelled = false;
    loadTravelSceneCatalog()
      .then((catalog) => {
        if (!cancelled) {
          setSceneCatalog(catalog);
        }
      })
      .catch((err) => {
        logger.error('Failed to load travel scene catalog:', err);
        if (!cancelled) {
          setError(t('travel.error_scenes_load'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setScenesLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (files.length > 0) {
      const urls = files.map((f) => URL.createObjectURL(f));
      setPreviewUrls(urls);
      return () => urls.forEach((u) => URL.revokeObjectURL(u));
    } else {
      setPreviewUrls([]);
    }
  }, [files]);

  useEffect(() => {
    if (customSceneReferenceFile) {
      const u = URL.createObjectURL(customSceneReferenceFile);
      setCustomSceneReferenceUrl(u);
      return () => URL.revokeObjectURL(u);
    } else {
      setCustomSceneReferenceUrl(null);
    }
  }, [customSceneReferenceFile]);

  /** When switching to Flash, 2K/4K are not supported; reset to 1K. */
  useEffect(() => {
    if (!supportsMultiResolution(settings.effectiveModel) && imageSize !== '1K') {
      setImageSize('1K');
    }
  }, [settings.effectiveModel, imageSize]);

  const resolveScenePrompt = useCallback((): string => {
    if (selectedSceneId === 'custom') {
      return customSceneText.trim();
    }
    const scene = travelScenes.find((s) => s.id === selectedSceneId);
    return scene?.prompt ?? customSceneText.trim();
  }, [selectedSceneId, customSceneText, travelScenes]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        if (isGroupMode) {
          setFiles((prev) => [...prev, ...selectedFiles].slice(0, 4));
        } else {
          setFiles([selectedFiles[0]]);
        }
        setResult(null);
        setResults([]);
        setError(null);
      }
      e.target.value = '';
    },
    [isGroupMode],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (files.length === 0) {
      setError(t('travel.error_no_images'));
      return;
    }
    if (selectedSceneId === 'custom' && !customSceneText.trim() && !customSceneReferenceFile) {
      setError(t('travel.error_custom_scene_empty'));
      return;
    }
    const attempt = attempts.begin();
    if (!attempt.isCurrent()) return;
    run.reset();
    setError(null);
    setLoading(true);
    setProgress(0);
    setResult(null);
    setResults([]);
    const stopProgress = startRandomProgressTicker((value) => {
      if (attempt.isCurrent()) setProgress(value);
    });
    attempt.onCleanup(stopProgress);

    try {
      let scenePrompt: string;
      let sceneReferenceImage: File | undefined;
      let resolvedSceneNameKey: string | null = null;
      let resolvedSceneCustomLabel: string | null = null;

      if (selectedSceneId === TRAVEL_SCENE_ID_RANDOM) {
        if (travelScenes.length === 0) {
          setError(t('travel.error_scenes_load'));
          return;
        }
        const picked = pickRandomTravelScene(travelScenes);
        scenePrompt = picked.prompt;

        if (useReferenceImage && picked.referenceImagePath) {
          try {
            const refPath = sceneRefPath(picked.referenceImagePath);
            sceneReferenceImage = await urlToFile(
              refPath,
              referenceFileName(picked.id, refPath),
              mimeTypeForImagePath(refPath),
              attempt.signal,
            );
          } catch {
            sceneReferenceImage = undefined;
          }
        } else {
          sceneReferenceImage = undefined;
        }
        resolvedSceneNameKey = picked.nameKey;
      } else if (selectedSceneId === 'custom') {
        const rawPrompt = resolveScenePrompt();
        if (!rawPrompt && !customSceneReferenceFile) {
          setError(t('travel.error_no_scene'));
          return;
        }

        // Auto-optimize prompt for custom scenes using AI (Gemini-only).
        setLoading(true);
        try {
          if (!rawPrompt) {
            scenePrompt = '';
          } else if (settings.imageProvider === 'openrouter') {
            scenePrompt = rawPrompt;
          } else {
            scenePrompt = await generateOptimizedPrompt(
              rawPrompt,
              customSceneReferenceFile ?? undefined,
              settings.toServiceSettings(attempt.signal),
            );
          }
        } catch (e) {
          if (!attempt.isCurrent()) return;
          logger.warn('Prompt optimization failed, using raw prompt', e);
          scenePrompt = rawPrompt;
        }

        sceneReferenceImage = customSceneReferenceFile ?? undefined;
        resolvedSceneCustomLabel = customSceneText.trim() || null;
      } else {
        const scene = travelScenes.find((s) => s.id === selectedSceneId);
        const basePrompt = scene?.prompt ?? resolveScenePrompt();

        if (!basePrompt && !customSceneReferenceFile) {
          setError(t('travel.error_no_scene'));
          return;
        }

        scenePrompt = basePrompt;

        // Logic:
        // 1. If user uploaded a custom reference file (in custom inputs), ALWAYS use it.
        // 2. If NO custom file, AND 'useReferenceImage' is true, try to load the scene's built-in reference.
        if (customSceneReferenceFile) {
          sceneReferenceImage = customSceneReferenceFile;
        } else if (useReferenceImage && scene?.referenceImagePath) {
          const refPath = sceneRefPath(scene.referenceImagePath);
          try {
            sceneReferenceImage = await urlToFile(
              refPath,
              referenceFileName(scene.id, refPath),
              mimeTypeForImagePath(refPath),
              attempt.signal,
            );
          } catch {
            logger.debug(
              `Note: No valid reference image found at ${refPath}, falling back to text prompt.`,
            );
            sceneReferenceImage = undefined;
          }
        } else {
          sceneReferenceImage = undefined;
        }

        if (scene) resolvedSceneNameKey = scene.nameKey;
      }
      if (!attempt.isCurrent()) return;
      // Enhance the prompt with dynamic variations and selected style/weather/time/vibe
      const stylePrompt = TRAVEL_STYLES.find((s) => s.id === style)?.prompt || '';

      // Handle random weather
      let effectiveWeather = weather;
      if (weather === 'random') {
        const available = TRAVEL_WEATHER_OPTIONS.filter((w) => w.id !== 'random');
        effectiveWeather = available[Math.floor(Math.random() * available.length)].id;
      }
      const weatherPrompt =
        TRAVEL_WEATHER_OPTIONS.find((w) => w.id === effectiveWeather)?.prompt || '';

      // Handle random time
      let effectiveTime = timeOfDay;
      if (timeOfDay === 'random') {
        const available = TRAVEL_TIME_OPTIONS.filter((t) => t.id !== 'random');
        effectiveTime = available[Math.floor(Math.random() * available.length)].id;
      }
      const timePrompt = TRAVEL_TIME_OPTIONS.find((t) => t.id === effectiveTime)?.prompt || '';

      const vibePrompt =
        vibe !== 'none' ? TRAVEL_VIBE_OPTIONS.find((v) => v.id === vibe)?.prompt || '' : '';
      const outfitPrompt = TRAVEL_OUTFIT_OPTIONS.find((o) => o.id === outfit)?.prompt || '';
      const posePrompt = TRAVEL_POSE_OPTIONS.find((p) => p.id === pose)?.prompt || '';

      const generateOne = (i: number, signal: AbortSignal) => {
        // Generate a unique prompt variation for each image
        const variedPrompt = generateDynamicTravelPrompt(scenePrompt, {
          style: stylePrompt,
          weather: weatherPrompt,
          time: timePrompt,
          vibe: vibePrompt,
          outfit: outfitPrompt,
          customOutfitText: outfit === 'custom' ? customOutfitText : undefined,
          outfitColor: outfitColor,
          pose: posePrompt,
          customPoseText: pose === 'custom' ? customPoseText : undefined,
          relationship:
            TRAVEL_RELATIONSHIP_OPTIONS.find((r) => r.id === relationship)?.prompt || '',
          framing: TRAVEL_FRAMING_OPTIONS.find((f) => f.id === framing)?.prompt || '',
          clearBackground: clearBackground,
          isGroup: isGroupMode || files.length > 1,
          variationIndex: i, // Use index to create different variations
        });

        return generateTravelPhoto(isGroupMode ? files : files[0], {
          scenePrompt: variedPrompt,
          aspectRatio,
          imageSize,
          sceneReferenceImage,
          settings: settings.toServiceSettings(signal),
        })
          .then((url) => {
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
            addToHistory(
              'travel',
              url,
              buildHistoryOptions('travel', settings, {
                sceneId: selectedSceneId,
                style,
                aspectRatio,
                imageSize,
                isGroup: isGroupMode || files.length > 1,
                weather: effectiveWeather,
                time: effectiveTime,
                variationIndex: i,
                prompt: variedPrompt,
              }),
              files[0] ?? null,
            );
            return url;
          })
          .catch((err) => {
            if (!isAbortError(err)) logger.error(`Travel generation error for item ${i + 1}:`, err);
            throw err;
          });
      };

      retryGeneratorRef.current = generateOne;
      const {
        results: generatedResults,
        failures,
        cancelled,
      } = await run.runBatch(quantity, generateOne);

      // The user asked to stop: fall back to the form, no error, no partial notice.
      if (cancelled || !attempt.isCurrent()) return;

      setProgress(100);

      logger.debug(
        `Travel generation completed: requested ${quantity}, succeeded ${generatedResults.length}, failed ${quantity - generatedResults.length}`,
      );

      if (generatedResults.length === 0) {
        throw allFailedError(failures);
      }

      // Always use results array if quantity > 1, even if only one succeeded
      if (quantity > 1) {
        setResults(generatedResults);
        setResult(null); // Clear single result
      } else {
        setResult(generatedResults[0]);
        setResults([]); // Clear results array
      }
      setResultSceneNameKey(resolvedSceneNameKey);
      setResultSceneCustomLabel(resolvedSceneCustomLabel);
      setResultMetadata({
        outfit,
        outfitColor,
        customOutfitText: outfit === 'custom' ? customOutfitText : undefined,
        pose,
        customPoseText: pose === 'custom' ? customPoseText : undefined,
        relationship,
        weather: effectiveWeather,
        time: effectiveTime,
        vibe,
        style,
        framing,
        clearBackground,
      });
    } catch (err) {
      if (!attempt.isCurrent()) return;
      setError(formatApiErrorMessage(err, t, 'travel'));
      logger.error('Travel generation error:', err);
    } finally {
      if (attempt.isCurrent()) {
        setLoading(false);
        setProgress(0);
      }
      attempts.finish(attempt);
    }
  }, [
    attempts,
    run,
    files,
    isGroupMode,
    selectedSceneId,
    customSceneText,
    customSceneReferenceFile,
    resolveScenePrompt,
    aspectRatio,
    imageSize,
    style,
    weather,
    timeOfDay,
    vibe,
    outfit,
    outfitColor,
    customOutfitText,
    pose,
    customPoseText,
    relationship,
    framing,
    clearBackground,
    settings,
    travelScenes,
    t,
    useReferenceImage,
    quantity,
    addToHistory,
  ]);

  const handleSurpriseMe = useCallback(() => {
    if (travelScenes.length > 0) {
      const randomScene = pickRandomTravelScene(travelScenes);
      setSelectedSceneId(randomScene.id);
    }

    // Pick random style
    const randomStyle = TRAVEL_STYLES[Math.floor(Math.random() * TRAVEL_STYLES.length)];
    setStyle(randomStyle.id);

    // Pick random weather & time
    const availableWeather = TRAVEL_WEATHER_OPTIONS.filter((w) => w.id !== 'random');
    setWeather(availableWeather[Math.floor(Math.random() * availableWeather.length)].id);

    const availableTime = TRAVEL_TIME_OPTIONS.filter((t) => t.id !== 'random');
    setTimeOfDay(availableTime[Math.floor(Math.random() * availableTime.length)].id);

    // Random outfit & pose
    setOutfit(TRAVEL_OUTFIT_OPTIONS[Math.floor(Math.random() * TRAVEL_OUTFIT_OPTIONS.length)].id);
    setPose(TRAVEL_POSE_OPTIONS[Math.floor(Math.random() * TRAVEL_POSE_OPTIONS.length)].id);

    // Random color
    if (Math.random() > 0.5) {
      setOutfitColor(
        OUTFIT_COLOR_PRESETS[Math.floor(Math.random() * OUTFIT_COLOR_PRESETS.length)].id,
      );
    } else {
      setOutfitColor('');
    }

    // Clear result to show surprise
    setResult(null);
    setResults([]);
  }, [travelScenes]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `travel-photo-${Date.now()}.png`;
    a.click();
  }, [result]);

  const handleBatchDownload = useCallback(async () => {
    if (results.length === 0) return;

    await downloadBatchWithZipFallback({
      sources: results,
      itemFileName: (index) => `travel-photo-${index + 1}.png`,
      zipFileName: `travel-photos-${Date.now()}.zip`,
    });
  }, [results]);

  const clearResult = useCallback(() => {
    cancelGeneration();
    setResult(null);
    setResults([]);
    setResultSceneNameKey(null);
    setResultSceneCustomLabel(null);
    setResultMetadata(null);
    retryGeneratorRef.current = null;
    run.reset();
  }, [run, cancelGeneration]);

  const handleRetryFailed = useCallback(async () => {
    const generateOne = retryGeneratorRef.current;
    if (!generateOne) return;

    const attempt = attempts.begin();
    if (!attempt.isCurrent()) return;
    try {
      const { results: recovered, cancelled } = await run.retryFailed(generateOne);
      if (cancelled || !attempt.isCurrent() || recovered.length === 0) return;

      setResults((prev) => [...prev, ...recovered]);
      setResult(null);
    } catch (err) {
      if (!attempt.isCurrent()) return;
      setError(formatApiErrorMessage(err, t, 'travel'));
      logger.error('Travel retry error:', err);
    } finally {
      attempts.finish(attempt);
    }
  }, [attempts, run, t]);

  const setFilesFromDrop = useCallback(
    (incoming: File[]) => {
      if (isGroupMode) {
        setFiles((prev) => [...prev, ...incoming].slice(0, 4));
      } else {
        setFiles([incoming[0]]);
      }
      setResult(null);
      setResults([]);
      setError(null);
    },
    [isGroupMode],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDraggingOver(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const incomingFiles = Array.from(e.dataTransfer.files).filter((f) =>
        (f as File).type.startsWith('image/'),
      ) as File[];
      if (incomingFiles.length > 0) {
        setFilesFromDrop(incomingFiles);
      }
    },
    [setFilesFromDrop],
  );

  return {
    files,
    isGroupMode,
    setIsGroupMode,
    removeFile,
    result,
    results,
    resultSceneNameKey,
    resultSceneCustomLabel,
    resultMetadata,
    loading,
    error,
    progress,
    previewUrls,
    scenesLoading,
    scenesInternational: sceneCatalog?.international ?? [],
    scenesTaiwan: sceneCatalog?.taiwan ?? [],
    scenesAll: travelScenes,
    quantity,
    setQuantity,
    selectedSceneId,
    setSelectedSceneId,
    customSceneText,
    setCustomSceneText,
    customSceneReferenceFile,
    customSceneReferenceUrl,
    setCustomSceneReferenceFile,
    aspectRatio,
    setAspectRatio,
    imageSize,
    setImageSize,
    style,
    setStyle,
    weather,
    setWeather,
    timeOfDay,
    setTimeOfDay,
    vibe,
    setVibe,
    outfit,
    setOutfit,
    customOutfitText,
    setCustomOutfitText,
    pose,
    setPose,
    customPoseText,
    setCustomPoseText,
    relationship,
    setRelationship,
    framing,
    setFraming,
    outfitColor,
    setOutfitColor,
    clearBackground,
    setClearBackground,
    useReferenceImage,
    setUseReferenceImage,
    isDraggingOver,
    handleFileChange,
    handleGenerate,
    handleSurpriseMe,
    handleDownload,
    handleBatchDownload,
    failures: run.failures,
    requestedCount: run.requestedCount,
    succeededCount: run.succeededCount,
    isRetrying: run.isRetrying,
    isRunning: run.isRunning,
    cancelGeneration,
    handleRetryFailed,
    clearResult,
    setFilesFromDrop,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    resolveScenePrompt,
  };
}
