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
import { TRAVEL_SCENES, TRAVEL_SCENE_ID_RANDOM, pickRandomTravelScene, DEFAULT_TRAVEL_ASPECT, DEFAULT_TRAVEL_IMAGE_SIZE, TRAVEL_STYLES, DEFAULT_TRAVEL_STYLE } from '../../constants/travel';
import type { TravelAspectRatio, TravelImageSize, TravelStyle } from '../../constants/travel';

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

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<TravelSceneIdOrCustom>(TRAVEL_SCENES[0]?.id ?? 'shibuya');
  const [customSceneText, setCustomSceneText] = useState('');
  const [customSceneReferenceFile, setCustomSceneReferenceFile] = useState<File | null>(null);
  const [customSceneReferenceUrl, setCustomSceneReferenceUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<TravelAspectRatio>(DEFAULT_TRAVEL_ASPECT);
  const [imageSize, setImageSize] = useState<TravelImageSize>(DEFAULT_TRAVEL_IMAGE_SIZE);
  const [style, setStyle] = useState<TravelStyle>(DEFAULT_TRAVEL_STYLE);
  // New state for controlling reference image usage
  const [useReferenceImage, setUseReferenceImage] = useState<boolean>(true);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [resultSceneNameKey, setResultSceneNameKey] = useState<string | null>(null);
  const [resultSceneCustomLabel, setResultSceneCustomLabel] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const u = URL.createObjectURL(file);
      setPreviewUrl(u);
      return () => URL.revokeObjectURL(u);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

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
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
    }
    e.target.value = '';
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!file) {
      setError(t('travel.error_no_image'));
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
      // Enhance the prompt with dynamic variations and selected style
      const stylePrompt = TRAVEL_STYLES.find(s => s.id === style)?.prompt || '';
      const finalPrompt = generateDynamicTravelPrompt(scenePrompt, stylePrompt);

      const url = await generateTravelPhoto(file, {
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
  }, [file, selectedSceneId, customSceneText, customSceneReferenceFile, resolveScenePrompt, aspectRatio, imageSize, style, settings.apiKey, settings.model, t, useReferenceImage]);

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

  const setFileFromDrop = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDraggingOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFileFromDrop(f);
  }, [setFileFromDrop]);

  return {
    file,
    result,
    resultSceneNameKey,
    resultSceneCustomLabel,
    loading,
    error,
    previewUrl,
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
    useReferenceImage,
    setUseReferenceImage,
    isDraggingOver,
    handleFileChange,
    handleGenerate,
    handleDownload,
    clearResult,
    setFileFromDrop,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    resolveScenePrompt,
  };
}
