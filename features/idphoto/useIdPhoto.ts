/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateIdPhoto } from '../../services/geminiService';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  DEFAULT_ID_TYPE,
  DEFAULT_RETOUCH_LEVEL,
  DEFAULT_OUTPUT_SPEC,
  DEFAULT_CLOTHING_OPTION,
} from '../../constants/idPhoto';
import type { IdPhotoType, RetouchLevel, OutputSpec, ClothingOption } from '../../constants/idPhoto';

export function useIdPhoto() {
  const { t } = useLanguage();
  const settings = useSettings();
  const [searchParams] = useSearchParams();

  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [idPhotoResult, setIdPhotoResult] = useState<string | null>(null);
  const [idPhotoLoading, setIdPhotoLoading] = useState(false);
  const [idPhotoError, setIdPhotoError] = useState<string | null>(null);
  const [idPhotoPreviewUrl, setIdPhotoPreviewUrl] = useState<string | null>(null);
  const [idPhotoType, setIdPhotoType] = useState<IdPhotoType>(DEFAULT_ID_TYPE);
  const [idPhotoRetouchLevel, setIdPhotoRetouchLevel] = useState<RetouchLevel>(DEFAULT_RETOUCH_LEVEL);
  const [idPhotoOutputSpec, setIdPhotoOutputSpec] = useState<OutputSpec>(DEFAULT_OUTPUT_SPEC);
  const [idPhotoClothingOption, setIdPhotoClothingOption] = useState<ClothingOption>(DEFAULT_CLOTHING_OPTION);
  const [idPhotoClothingCustomText, setIdPhotoClothingCustomText] = useState('');
  const [idPhotoClothingReferenceFile, setIdPhotoClothingReferenceFile] = useState<File | null>(null);
  const [idPhotoClothingReferenceUrl, setIdPhotoClothingReferenceUrl] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    const levelParam = searchParams.get('level');
    if (levelParam && ['self', 'standard', 'premium'].includes(levelParam)) {
      setIdPhotoRetouchLevel(levelParam as RetouchLevel);
    }
  }, [searchParams]);

  useEffect(() => {
    if (idPhotoFile) {
      const u = URL.createObjectURL(idPhotoFile);
      setIdPhotoPreviewUrl(u);
      return () => URL.revokeObjectURL(u);
    } else {
      setIdPhotoPreviewUrl(null);
    }
  }, [idPhotoFile]);

  useEffect(() => {
    if (idPhotoClothingReferenceFile) {
      const u = URL.createObjectURL(idPhotoClothingReferenceFile);
      setIdPhotoClothingReferenceUrl(u);
      return () => URL.revokeObjectURL(u);
    } else {
      setIdPhotoClothingReferenceUrl(null);
    }
  }, [idPhotoClothingReferenceFile]);

  const handleIdPhotoFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setIdPhotoFile(f);
      setIdPhotoResult(null);
      setIdPhotoError(null);
    }
    e.target.value = '';
  }, []);

  const handleIdPhotoGenerate = useCallback(async () => {
    if (!idPhotoFile) {
      setIdPhotoError(t('start.error_no_image_idphoto'));
      return;
    }
    if (idPhotoClothingOption === 'custom' && !idPhotoClothingCustomText.trim() && !idPhotoClothingReferenceFile) {
      setIdPhotoError(t('idphoto.error_custom_clothing_empty'));
      return;
    }
    setIdPhotoError(null);
    setIdPhotoLoading(true);
    try {
      const url = await generateIdPhoto(idPhotoFile, {
        retouchLevel: idPhotoRetouchLevel,
        idType: idPhotoType,
        outputSpec: idPhotoOutputSpec,
        clothingOption: idPhotoClothingOption,
        clothingCustomText: idPhotoClothingOption === 'custom' ? idPhotoClothingCustomText.trim() || undefined : undefined,
        clothingReferenceImage: idPhotoClothingOption === 'custom' && idPhotoClothingReferenceFile ? idPhotoClothingReferenceFile : undefined,
        settings: { apiKey: settings.apiKey, model: settings.model },
      });
      setIdPhotoResult(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setIdPhotoError(`${t('start.error_idphoto_failed')} ${msg}`);
    } finally {
      setIdPhotoLoading(false);
    }
  }, [idPhotoFile, idPhotoRetouchLevel, idPhotoType, idPhotoOutputSpec, idPhotoClothingOption, idPhotoClothingCustomText, idPhotoClothingReferenceFile, settings.apiKey, settings.model, t]);

  const handleIdPhotoDownload = useCallback(() => {
    if (!idPhotoResult) return;
    const a = document.createElement('a');
    a.href = idPhotoResult;
    a.download = `id-photo-${Date.now()}.png`;
    a.click();
  }, [idPhotoResult]);

  const clearIdPhotoResult = useCallback(() => {
    setIdPhotoResult(null);
  }, []);

  const setFileFromDrop = useCallback((file: File) => {
    setIdPhotoFile(file);
    setIdPhotoResult(null);
    setIdPhotoError(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setFileFromDrop(file);
  }, [setFileFromDrop]);

  return {
    idPhotoFile,
    idPhotoResult,
    idPhotoLoading,
    idPhotoError,
    idPhotoPreviewUrl,
    idPhotoType,
    setIdPhotoType,
    idPhotoRetouchLevel,
    setIdPhotoRetouchLevel,
    idPhotoOutputSpec,
    setIdPhotoOutputSpec,
    idPhotoClothingOption,
    setIdPhotoClothingOption,
    idPhotoClothingCustomText,
    setIdPhotoClothingCustomText,
    idPhotoClothingReferenceFile,
    setIdPhotoClothingReferenceFile,
    idPhotoClothingReferenceUrl,
    handleIdPhotoFileChange,
    handleIdPhotoGenerate,
    handleIdPhotoDownload,
    clearIdPhotoResult,
    isDraggingOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
