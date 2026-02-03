/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import * as React from 'react';
import { generateTravelPhoto, generateOptimizedPrompt } from '../../services/geminiService';
import { generateDynamicTravelPrompt } from '../../utils/travelPromptGenerator';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { TRAVEL_SCENES, TRAVEL_SCENE_ID_RANDOM, pickRandomTravelScene, DEFAULT_TRAVEL_ASPECT, DEFAULT_TRAVEL_IMAGE_SIZE, TRAVEL_STYLES, DEFAULT_TRAVEL_STYLE, TRAVEL_WEATHER_OPTIONS, TRAVEL_TIME_OPTIONS, TRAVEL_VIBE_OPTIONS, TRAVEL_OUTFIT_OPTIONS, TRAVEL_POSE_OPTIONS, TRAVEL_RELATIONSHIP_OPTIONS, TRAVEL_FRAMING_OPTIONS, OUTFIT_COLOR_PRESETS } from '../../constants/travel';
import type { TravelAspectRatio, TravelImageSize, TravelStyle, TravelWeather, TravelTimeOfDay, TravelVibe, TravelOutfit, TravelPose, TravelRelationship, TravelFraming } from '../../constants/travel';

export type TravelSceneIdOrCustom = string;

const IS_PRO = (m: string) => m === 'gemini-3-pro-image-preview';

// Helper to load an image from a URL (e.g., from public folder) as a File object
async function urlToFile(url: string, filename: string, mimeType: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);

  const contentType = res.headers.get('content-type');
  if (contentType && !contentType.startsWith('image/')) {
    throw new Error(`Invalid content type: ${contentType} for ${url}. Expected image.`);
  }

  const blob = await res.blob();
  if (blob.size < 100) { // arbitrary small size check to avoid empty/error responses
    throw new Error(`File too small: ${url}`);
  }
  return new File([blob], filename, { type: mimeType });
}

export function useTravel() {
  const { t } = useLanguage();
  const settings = useSettings();

  const [files, setFiles] = useState<File[]>([]);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<TravelSceneIdOrCustom>(TRAVEL_SCENES[0]?.id ?? 'shibuya');
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
  const [pose, setPose] = useState<TravelPose>('natural');
  const [relationship, setRelationship] = useState<TravelRelationship>('default');
  const [framing, setFraming] = useState<TravelFraming>('default');
  const [clearBackground, setClearBackground] = useState<boolean>(false);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [resultSceneNameKey, setResultSceneNameKey] = useState<string | null>(null);
  const [resultSceneCustomLabel, setResultSceneCustomLabel] = useState<string | null>(null);

  useEffect(() => {
    if (files.length > 0) {
      const urls = files.map(f => URL.createObjectURL(f));
      setPreviewUrls(urls);
      return () => urls.forEach(u => URL.revokeObjectURL(u));
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
    if (!IS_PRO(settings.model) && imageSize !== '1K') {
      setImageSize('1K');
    }
  }, [settings.model, imageSize]);

  const resolveScenePrompt = useCallback((): string => {
    if (selectedSceneId === 'custom') {
      return customSceneText.trim();
    }
    const scene = TRAVEL_SCENES.find((s) => s.id === selectedSceneId);
    return scene?.prompt ?? customSceneText.trim();
  }, [selectedSceneId, customSceneText]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      if (isGroupMode) {
        setFiles(prev => [...prev, ...selectedFiles].slice(0, 4));
      } else {
        setFiles([selectedFiles[0]]);
      }
      setResult(null);
      setError(null);
    }
    e.target.value = '';
  }, [isGroupMode]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
    let scenePrompt: string;
    let sceneReferenceImage: File | undefined;
    let resolvedSceneNameKey: string | null = null;
    let resolvedSceneCustomLabel: string | null = null;

    if (selectedSceneId === TRAVEL_SCENE_ID_RANDOM) {
      const picked = pickRandomTravelScene();
      scenePrompt = picked.prompt;

      if (useReferenceImage && picked.referenceImagePath) {
        try {
          sceneReferenceImage = await urlToFile(picked.referenceImagePath, `${picked.id}_ref.jpg`, 'image/jpeg');
        } catch (e) {
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

      // Auto-optimize prompt for custom scenes using AI
      setLoading(true);
      try {
        if (rawPrompt) {
          scenePrompt = await generateOptimizedPrompt(
            rawPrompt,
            customSceneReferenceFile ?? undefined,
            { apiKey: settings.apiKey, model: settings.model }
          );
        } else {
          scenePrompt = "";
        }
      } catch (e) {
        console.warn("Prompt optimization failed, using raw prompt", e);
        scenePrompt = rawPrompt;
      }

      sceneReferenceImage = customSceneReferenceFile ?? undefined;
      resolvedSceneCustomLabel = customSceneText.trim() || null;
    } else {
      const scene = TRAVEL_SCENES.find((s) => s.id === selectedSceneId);
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
        try {
          sceneReferenceImage = await urlToFile(scene.referenceImagePath, `${scene.id}_ref.jpg`, 'image/jpeg');
        } catch (e) {
          console.log(`Note: No valid reference image found at ${scene.referenceImagePath}, falling back to text prompt.`);
          sceneReferenceImage = undefined;
        }
      } else {
        sceneReferenceImage = undefined;
      }

      if (scene) resolvedSceneNameKey = scene.nameKey;
    }
    setError(null);
    setLoading(true);

    try {
      // Enhance the prompt with dynamic variations and selected style/weather/time/vibe
      const stylePrompt = TRAVEL_STYLES.find(s => s.id === style)?.prompt || '';

      // Handle random weather
      let effectiveWeather = weather;
      if (weather === 'random') {
        const available = TRAVEL_WEATHER_OPTIONS.filter(w => w.id !== 'random');
        effectiveWeather = available[Math.floor(Math.random() * available.length)].id;
      }
      const weatherPrompt = TRAVEL_WEATHER_OPTIONS.find(w => w.id === effectiveWeather)?.prompt || '';

      // Handle random time
      let effectiveTime = timeOfDay;
      if (timeOfDay === 'random') {
        const available = TRAVEL_TIME_OPTIONS.filter(t => t.id !== 'random');
        effectiveTime = available[Math.floor(Math.random() * available.length)].id;
      }
      const timePrompt = TRAVEL_TIME_OPTIONS.find(t => t.id === effectiveTime)?.prompt || '';

      const vibePrompt = vibe !== 'none' ? TRAVEL_VIBE_OPTIONS.find(v => v.id === vibe)?.prompt || '' : '';
      const outfitPrompt = TRAVEL_OUTFIT_OPTIONS.find(o => o.id === outfit)?.prompt || '';
      const posePrompt = TRAVEL_POSE_OPTIONS.find(p => p.id === pose)?.prompt || '';

      const finalPrompt = generateDynamicTravelPrompt(scenePrompt, {
        style: stylePrompt,
        weather: weatherPrompt,
        time: timePrompt,
        vibe: vibePrompt,
        outfit: outfitPrompt,
        outfitColor: outfitColor,
        pose: posePrompt,
        relationship: TRAVEL_RELATIONSHIP_OPTIONS.find(r => r.id === relationship)?.prompt || '',
        framing: TRAVEL_FRAMING_OPTIONS.find(f => f.id === framing)?.prompt || '',
        clearBackground: clearBackground,
        isGroup: isGroupMode || files.length > 1
      });

      const url = await generateTravelPhoto(isGroupMode ? files : files[0], {
        scenePrompt: finalPrompt,
        aspectRatio,
        imageSize,
        sceneReferenceImage,
        settings: { apiKey: settings.apiKey, model: settings.model },
      });
      setResult(url);
      setResultSceneNameKey(resolvedSceneNameKey);
      setResultSceneCustomLabel(resolvedSceneCustomLabel);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`${t('travel.error_failed')} ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [files, isGroupMode, selectedSceneId, customSceneText, customSceneReferenceFile, resolveScenePrompt, aspectRatio, imageSize, style, weather, timeOfDay, vibe, outfit, outfitColor, pose, relationship, framing, clearBackground, settings.apiKey, settings.model, t, useReferenceImage]);

  const handleSurpriseMe = useCallback(() => {
    // Pick random scene
    const randomScene = TRAVEL_SCENES[Math.floor(Math.random() * TRAVEL_SCENES.length)];
    setSelectedSceneId(randomScene.id);

    // Pick random style
    const randomStyle = TRAVEL_STYLES[Math.floor(Math.random() * TRAVEL_STYLES.length)];
    setStyle(randomStyle.id);

    // Pick random weather & time
    const availableWeather = TRAVEL_WEATHER_OPTIONS.filter(w => w.id !== 'random');
    setWeather(availableWeather[Math.floor(Math.random() * availableWeather.length)].id);

    const availableTime = TRAVEL_TIME_OPTIONS.filter(t => t.id !== 'random');
    setTimeOfDay(availableTime[Math.floor(Math.random() * availableTime.length)].id);

    // Random outfit & pose
    setOutfit(TRAVEL_OUTFIT_OPTIONS[Math.floor(Math.random() * TRAVEL_OUTFIT_OPTIONS.length)].id);
    setPose(TRAVEL_POSE_OPTIONS[Math.floor(Math.random() * TRAVEL_POSE_OPTIONS.length)].id);

    // Random color
    if (Math.random() > 0.5) {
      setOutfitColor(OUTFIT_COLOR_PRESETS[Math.floor(Math.random() * OUTFIT_COLOR_PRESETS.length)].id);
    } else {
      setOutfitColor('');
    }

    // Clear result to show surprise
    setResult(null);
  }, []);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `travel-photo-${Date.now()}.png`;
    a.click();
  }, [result]);

  const clearResult = useCallback(() => {
    setResult(null);
    setResultSceneNameKey(null);
    setResultSceneCustomLabel(null);
  }, []);

  const setFilesFromDrop = useCallback((incoming: File[]) => {
    if (isGroupMode) {
      setFiles(prev => [...prev, ...incoming].slice(0, 4));
    } else {
      setFiles([incoming[0]]);
    }
    setResult(null);
    setError(null);
  }, [isGroupMode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDraggingOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const incomingFiles = Array.from(e.dataTransfer.files).filter(f => (f as File).type.startsWith('image/')) as File[];
    if (incomingFiles.length > 0) {
      setFilesFromDrop(incomingFiles);
    }
  }, [setFilesFromDrop]);

  return {
    files,
    isGroupMode,
    setIsGroupMode,
    removeFile,
    result,
    resultSceneNameKey,
    resultSceneCustomLabel,
    loading,
    error,
    previewUrls,
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
    pose,
    setPose,
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
    clearResult,
    setFilesFromDrop,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    resolveScenePrompt,
  };
}
