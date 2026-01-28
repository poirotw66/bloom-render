/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { generateTravelPhoto } from '../../services/geminiService';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { TRAVEL_SCENES, TRAVEL_SCENE_ID_RANDOM, pickRandomTravelScene, DEFAULT_TRAVEL_ASPECT, DEFAULT_TRAVEL_IMAGE_SIZE } from '../../constants/travel';
import type { TravelAspectRatio, TravelImageSize } from '../../constants/travel';

export type TravelSceneIdOrCustom = string;

const IS_PRO = (m: string) => m === 'gemini-3-pro-image-preview';

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
  const [isDraggingOver, setIsDraggingOver] = useState(false);

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
    if (selectedSceneId === TRAVEL_SCENE_ID_RANDOM) {
      scenePrompt = pickRandomTravelScene().prompt;
      sceneReferenceImage = undefined;
    } else {
      scenePrompt = resolveScenePrompt();
      if (!scenePrompt && !customSceneReferenceFile) {
        setError(t('travel.error_no_scene'));
        return;
      }
      sceneReferenceImage = selectedSceneId === 'custom' && customSceneReferenceFile ? customSceneReferenceFile : undefined;
    }
    setError(null);
    setLoading(true);
    try {
      const url = await generateTravelPhoto(file, {
        scenePrompt,
        aspectRatio,
        imageSize,
        sceneReferenceImage,
        settings: { apiKey: settings.apiKey, model: settings.model },
      });
      setResult(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`${t('travel.error_failed')} ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [file, selectedSceneId, customSceneText, customSceneReferenceFile, resolveScenePrompt, aspectRatio, imageSize, settings.apiKey, settings.model, t]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `travel-photo-${Date.now()}.png`;
    a.click();
  }, [result]);

  const clearResult = useCallback(() => setResult(null), []);

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
