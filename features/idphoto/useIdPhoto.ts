/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateIdPhoto } from '../../services/geminiService';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { normalizeApiError } from '../../services/gemini/shared';
import { useHistory } from '../../hooks/useHistory';
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
  const { addToHistory } = useHistory();

  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [idPhotoResult, setIdPhotoResult] = useState<string | null>(null);
  const [idPhotoResults, setIdPhotoResults] = useState<string[]>([]);
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
  const [progress, setProgress] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

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
      setIdPhotoResults([]);
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
    setProgress(0);
    setIdPhotoResult(null);
    setIdPhotoResults([]);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      // Generate all images in parallel
      const generationPromises = Array.from({ length: quantity }, (_, i) =>
        generateIdPhoto(idPhotoFile, {
          retouchLevel: idPhotoRetouchLevel,
          idType: idPhotoType,
          outputSpec: idPhotoOutputSpec,
          clothingOption: idPhotoClothingOption,
          clothingCustomText: idPhotoClothingOption === 'custom' ? idPhotoClothingCustomText.trim() || undefined : undefined,
          clothingReferenceImage: idPhotoClothingOption === 'custom' && idPhotoClothingReferenceFile ? idPhotoClothingReferenceFile : undefined,
          settings: { apiKey: settings.apiKey, model: settings.model },
        })
          .then((url) => {
            // Add to history
            addToHistory('idphoto', url, {
              retouchLevel: idPhotoRetouchLevel,
              idType: idPhotoType,
              outputSpec: idPhotoOutputSpec,
              clothingOption: idPhotoClothingOption,
            });
            return url;
          })
          .catch((err) => {
            console.error(`ID photo generation error for item ${i + 1}:`, err);
            throw err;
          })
      );

      const settledResults = await Promise.allSettled(generationPromises);
      const results = settledResults
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map((result) => result.value);

      clearInterval(progressInterval);
      setProgress(100);

      if (results.length === 0) {
        throw new Error('All generations failed');
      }

      if (results.length === 1) {
        setIdPhotoResult(results[0]);
      } else {
        setIdPhotoResults(results);
      }
    } catch (err) {
      const normalizedError = normalizeApiError(err, 'idphoto');
      const errorKey = normalizedError.message || 'error.unknown';
      setIdPhotoError(t(errorKey));
      console.error('ID photo generation error:', normalizedError.originalError || err);
    } finally {
      setIdPhotoLoading(false);
      setProgress(0);
    }
  }, [idPhotoFile, idPhotoRetouchLevel, idPhotoType, idPhotoOutputSpec, idPhotoClothingOption, idPhotoClothingCustomText, idPhotoClothingReferenceFile, settings.apiKey, settings.model, t, addToHistory, quantity]);

  const handleIdPhotoDownload = useCallback(() => {
    if (!idPhotoResult) return;
    const a = document.createElement('a');
    a.href = idPhotoResult;
    a.download = `id-photo-${Date.now()}.png`;
    a.click();
  }, [idPhotoResult]);

  const clearIdPhotoResult = useCallback(() => {
    setIdPhotoResult(null);
    setIdPhotoResults([]);
  }, []);

  const handleIdPhotoBatchDownload = useCallback(async () => {
    if (idPhotoResults.length === 0) return;

    try {
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
      idPhotoResults.forEach((result, index) => {
        const base64 = result.split(',')[1];
        zip.file(`id-photo-${index + 1}.png`, base64, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `id-photos-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      idPhotoResults.forEach((result, index) => {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = result;
          link.download = `id-photo-${index + 1}.png`;
          link.click();
        }, index * 100);
      });
    }
  }, [idPhotoResults]);

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
    idPhotoResults,
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
    progress,
    quantity,
    setQuantity,
    handleIdPhotoFileChange,
    handleIdPhotoGenerate,
    handleIdPhotoDownload,
    handleIdPhotoBatchDownload,
    clearIdPhotoResult,
    isDraggingOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
