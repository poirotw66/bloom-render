/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateIdPhoto } from '../../services/geminiService';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatApiErrorMessage } from '../../services/gemini/shared';
import { logger } from '../../utils/logger';
import { useHistory } from '../../hooks/useHistory';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import { startRandomProgressTicker } from '../../utils/generationHelpers';
import { useGenerationFailures } from '../../hooks/useGenerationFailures';
import {
  DEFAULT_ID_TYPE,
  DEFAULT_RETOUCH_LEVEL,
  DEFAULT_OUTPUT_SPEC,
  DEFAULT_CLOTHING_OPTION,
} from '../../constants/idPhoto';
import type {
  IdPhotoType,
  RetouchLevel,
  OutputSpec,
  ClothingOption,
} from '../../constants/idPhoto';

export function useIdPhoto() {
  const { t } = useLanguage();
  const settings = useSettings();
  const [searchParams] = useSearchParams();
  const { addToHistory } = useHistory();
  const run = useGenerationFailures();

  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [idPhotoResult, setIdPhotoResult] = useState<string | null>(null);
  const [idPhotoResults, setIdPhotoResults] = useState<string[]>([]);
  const [idPhotoLoading, setIdPhotoLoading] = useState(false);
  const [idPhotoError, setIdPhotoError] = useState<string | null>(null);
  const [idPhotoPreviewUrl, setIdPhotoPreviewUrl] = useState<string | null>(null);
  const [idPhotoType, setIdPhotoType] = useState<IdPhotoType>(DEFAULT_ID_TYPE);
  const [idPhotoRetouchLevel, setIdPhotoRetouchLevel] =
    useState<RetouchLevel>(DEFAULT_RETOUCH_LEVEL);
  const [idPhotoOutputSpec, setIdPhotoOutputSpec] = useState<OutputSpec>(DEFAULT_OUTPUT_SPEC);
  const [idPhotoClothingOption, setIdPhotoClothingOption] =
    useState<ClothingOption>(DEFAULT_CLOTHING_OPTION);
  const [idPhotoClothingCustomText, setIdPhotoClothingCustomText] = useState('');
  const [idPhotoClothingReferenceFile, setIdPhotoClothingReferenceFile] = useState<File | null>(
    null,
  );
  const [idPhotoClothingReferenceUrl, setIdPhotoClothingReferenceUrl] = useState<string | null>(
    null,
  );
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

  const generateOne = useCallback(
    (file: File, variationIndex: number) =>
      generateIdPhoto(file, {
        retouchLevel: idPhotoRetouchLevel,
        idType: idPhotoType,
        outputSpec: idPhotoOutputSpec,
        clothingOption: idPhotoClothingOption,
        clothingCustomText:
          idPhotoClothingOption === 'custom'
            ? idPhotoClothingCustomText.trim() || undefined
            : undefined,
        clothingReferenceImage:
          idPhotoClothingOption === 'custom' && idPhotoClothingReferenceFile
            ? idPhotoClothingReferenceFile
            : undefined,
        settings: { apiKey: settings.apiKey, model: settings.model },
        variationIndex,
      })
        .then((url) => {
          addToHistory('idphoto', url, {
            retouchLevel: idPhotoRetouchLevel,
            idType: idPhotoType,
            outputSpec: idPhotoOutputSpec,
            clothingOption: idPhotoClothingOption,
          });
          return url;
        })
        .catch((err) => {
          logger.error(`ID photo generation error for item ${variationIndex + 1}:`, err);
          throw err;
        }),
    [
      idPhotoRetouchLevel,
      idPhotoType,
      idPhotoOutputSpec,
      idPhotoClothingOption,
      idPhotoClothingCustomText,
      idPhotoClothingReferenceFile,
      settings.apiKey,
      settings.model,
      addToHistory,
    ],
  );

  const handleIdPhotoGenerate = useCallback(async () => {
    if (!idPhotoFile) {
      setIdPhotoError(t('start.error_no_image_idphoto'));
      return;
    }
    if (
      idPhotoClothingOption === 'custom' &&
      !idPhotoClothingCustomText.trim() &&
      !idPhotoClothingReferenceFile
    ) {
      setIdPhotoError(t('idphoto.error_custom_clothing_empty'));
      return;
    }
    setIdPhotoError(null);
    setIdPhotoLoading(true);
    setProgress(0);
    setIdPhotoResult(null);
    setIdPhotoResults([]);
    run.reset();

    const stopProgress = startRandomProgressTicker(setProgress);

    try {
      const { results } = await run.runBatch(quantity, (index) => generateOne(idPhotoFile, index));

      setProgress(100);

      if (results.length === 0) {
        throw new Error('error.all_generations_failed');
      }

      // Always use the list form when some slots failed, so the partial-result
      // notice and its retry button have somewhere to live.
      if (results.length === 1 && quantity === 1) {
        setIdPhotoResult(results[0]);
      } else {
        setIdPhotoResults(results);
      }
    } catch (err) {
      setIdPhotoError(formatApiErrorMessage(err, t, 'idphoto'));
      logger.error('ID photo generation error:', err);
    } finally {
      stopProgress();
      setIdPhotoLoading(false);
      setProgress(0);
    }
  }, [
    idPhotoFile,
    idPhotoClothingOption,
    idPhotoClothingCustomText,
    idPhotoClothingReferenceFile,
    t,
    quantity,
    run,
    generateOne,
  ]);

  const handleRetryFailed = useCallback(async () => {
    if (!idPhotoFile) return;

    try {
      const { results: recovered } = await run.retryFailed((index) =>
        generateOne(idPhotoFile, index),
      );
      if (recovered.length === 0) return;

      setIdPhotoResults((prev) => [...prev, ...recovered]);
      setIdPhotoResult(null);
    } catch (err) {
      setIdPhotoError(formatApiErrorMessage(err, t, 'idphoto'));
      logger.error('ID photo retry error:', err);
    }
  }, [idPhotoFile, run, generateOne, t]);

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
    run.reset();
  }, [run]);

  const handleIdPhotoBatchDownload = useCallback(async () => {
    if (idPhotoResults.length === 0) return;

    await downloadBatchWithZipFallback({
      sources: idPhotoResults,
      itemFileName: (index) => `id-photo-${index + 1}.png`,
      zipFileName: `id-photos-${Date.now()}.zip`,
    });
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) setFileFromDrop(file);
    },
    [setFileFromDrop],
  );

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
    failures: run.failures,
    requestedCount: run.requestedCount,
    succeededCount: run.succeededCount,
    isRetrying: run.isRetrying,
    handleRetryFailed,
    clearIdPhotoResult,
    isDraggingOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
