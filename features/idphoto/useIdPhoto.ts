/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateIdPhoto } from '../../services/geminiService';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatApiErrorMessage } from '../../services/gemini/shared';
import { logger } from '../../utils/logger';
import { buildHistoryOptions } from '../../utils/historyOptions';
import { useHistory } from '../../hooks/useHistory';
import { useDemoSampleInput } from '../../hooks/useDemoSampleInput';
import { fileFromSourceUrl, useHistoryReplay } from '../../hooks/useHistoryReplay';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import {
  allFailedError,
  isAbortError,
  startRandomProgressTicker,
} from '../../utils/generationHelpers';
import { useGenerationFailures } from '../../hooks/useGenerationFailures';
import { useGenerationAttempt } from '../../hooks/useGenerationAttempt';
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
import {
  DEFAULT_ID_PHOTO_SIZE_ID,
  getIdPhotoSizePreset,
  isIdPhotoSizeId,
  presetPixelSize,
  type IdPhotoSizeId,
} from '../../constants/idPhotoSizes';
import { cropIdPhotoToSize } from '../../utils/idPhotoCrop';
import {
  exportIdPhotoPrintSheetJpg,
  exportIdPhotoPrintSheetPdf,
  triggerBlobDownload,
} from '../../utils/idPhotoPrintSheet';

export function useIdPhoto() {
  const { t } = useLanguage();
  const settings = useSettings();
  const [searchParams] = useSearchParams();
  const { addToHistory } = useHistory();
  const run = useGenerationFailures();
  const attempts = useGenerationAttempt();
  const cancelRun = run.cancel;

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
  const [idPhotoSizeId, setIdPhotoSizeId] = useState<IdPhotoSizeId>(DEFAULT_ID_PHOTO_SIZE_ID);
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

  const cancelGeneration = useCallback(() => {
    attempts.cancel();
    cancelRun();
    setIdPhotoLoading(false);
    setProgress(0);
  }, [attempts, cancelRun]);

  useDemoSampleInput('idphoto', setIdPhotoFile);

  useEffect(() => {
    const levelParam = searchParams.get('level');
    if (levelParam && ['self', 'standard', 'premium'].includes(levelParam)) {
      setIdPhotoRetouchLevel(levelParam as RetouchLevel);
    }
  }, [searchParams]);

  useHistoryReplay((payload) => {
    if (payload.type !== 'idphoto') return;
    const opts = payload.options ?? {};
    if (typeof opts.idType === 'string') setIdPhotoType(opts.idType as IdPhotoType);
    if (typeof opts.retouchLevel === 'string')
      setIdPhotoRetouchLevel(opts.retouchLevel as RetouchLevel);
    if (typeof opts.outputSpec === 'string') setIdPhotoOutputSpec(opts.outputSpec as OutputSpec);
    if (typeof opts.printSize === 'string' && isIdPhotoSizeId(opts.printSize)) {
      setIdPhotoSizeId(opts.printSize);
    }
    if (typeof opts.clothingOption === 'string')
      setIdPhotoClothingOption(opts.clothingOption as ClothingOption);
    if (payload.sourceUrl) {
      void fileFromSourceUrl(payload.sourceUrl, 'idphoto-source.png').then(setIdPhotoFile);
    }
  });

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
    (file: File, variationIndex: number, signal: AbortSignal) => {
      const sizePreset = getIdPhotoSizePreset(idPhotoSizeId);
      const pixels = presetPixelSize(sizePreset);
      return generateIdPhoto(file, {
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
        settings: settings.toServiceSettings(signal),
        variationIndex,
      })
        .then(async (url) => {
          if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
          // Crop to the selected physical size at 300 DPI (demo assets included).
          const cropped = await cropIdPhotoToSize(url, pixels.width, pixels.height);
          if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
          addToHistory(
            'idphoto',
            cropped,
            buildHistoryOptions('idphoto', settings, {
              retouchLevel: idPhotoRetouchLevel,
              idType: idPhotoType,
              outputSpec: idPhotoOutputSpec,
              printSize: idPhotoSizeId,
              clothingOption: idPhotoClothingOption,
              variationIndex,
            }),
            file,
          );
          return cropped;
        })
        .catch((err) => {
          if (!isAbortError(err))
            logger.error(`ID photo generation error for item ${variationIndex + 1}:`, err);
          throw err;
        });
    },
    [
      idPhotoRetouchLevel,
      idPhotoType,
      idPhotoOutputSpec,
      idPhotoSizeId,
      idPhotoClothingOption,
      idPhotoClothingCustomText,
      idPhotoClothingReferenceFile,
      settings,
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
    const attempt = attempts.begin();
    if (!attempt.isCurrent()) return;
    setIdPhotoError(null);
    setIdPhotoLoading(true);
    setProgress(0);
    setIdPhotoResult(null);
    setIdPhotoResults([]);
    run.reset();

    const stopProgress = startRandomProgressTicker((value) => {
      if (attempt.isCurrent()) setProgress(value);
    });
    attempt.onCleanup(stopProgress);

    try {
      const { results, failures, cancelled } = await run.runBatch(quantity, (index, signal) =>
        generateOne(idPhotoFile, index, signal),
      );

      // The user asked to stop: fall back to the form, no error, no partial notice.
      if (cancelled || !attempt.isCurrent()) return;

      setProgress(100);

      if (results.length === 0) {
        throw allFailedError(failures);
      }

      // Always use the list form when some slots failed, so the partial-result
      // notice and its retry button have somewhere to live.
      if (results.length === 1 && quantity === 1) {
        setIdPhotoResult(results[0]);
      } else {
        setIdPhotoResults(results);
      }
    } catch (err) {
      if (!attempt.isCurrent()) return;
      setIdPhotoError(formatApiErrorMessage(err, t, 'idphoto'));
      logger.error('ID photo generation error:', err);
    } finally {
      if (attempt.isCurrent()) {
        setIdPhotoLoading(false);
        setProgress(0);
      }
      attempts.finish(attempt);
    }
  }, [
    attempts,
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

    const attempt = attempts.begin();
    if (!attempt.isCurrent()) return;
    try {
      const { results: recovered, cancelled } = await run.retryFailed((index, signal) =>
        generateOne(idPhotoFile, index, signal),
      );
      if (cancelled || !attempt.isCurrent() || recovered.length === 0) return;

      setIdPhotoResults((prev) => [...prev, ...recovered]);
      setIdPhotoResult(null);
    } catch (err) {
      if (!attempt.isCurrent()) return;
      setIdPhotoError(formatApiErrorMessage(err, t, 'idphoto'));
      logger.error('ID photo retry error:', err);
    } finally {
      attempts.finish(attempt);
    }
  }, [attempts, idPhotoFile, run, generateOne, t]);

  const handleIdPhotoDownload = useCallback(() => {
    if (!idPhotoResult) return;
    const a = document.createElement('a');
    a.href = idPhotoResult;
    a.download = `id-photo-${Date.now()}.png`;
    a.click();
  }, [idPhotoResult]);

  const clearIdPhotoResult = useCallback(() => {
    cancelGeneration();
    setIdPhotoResult(null);
    setIdPhotoResults([]);
    run.reset();
  }, [run, cancelGeneration]);

  const handleIdPhotoBatchDownload = useCallback(async () => {
    if (idPhotoResults.length === 0) return;

    await downloadBatchWithZipFallback({
      sources: idPhotoResults,
      itemFileName: (index) => `id-photo-${index + 1}.png`,
      zipFileName: `id-photos-${Date.now()}.zip`,
    });
  }, [idPhotoResults]);

  const handleDownloadPrintSheetJpg = useCallback(
    async (source?: string | null) => {
      const photo = source ?? idPhotoResult;
      if (!photo) return;
      const preset = getIdPhotoSizePreset(idPhotoSizeId);
      const blob = await exportIdPhotoPrintSheetJpg(photo, preset);
      triggerBlobDownload(blob, `id-photo-4x6-${idPhotoSizeId}-${Date.now()}.jpg`);
    },
    [idPhotoResult, idPhotoSizeId],
  );

  const handleDownloadPrintSheetPdf = useCallback(
    async (source?: string | null) => {
      const photo = source ?? idPhotoResult;
      if (!photo) return;
      const preset = getIdPhotoSizePreset(idPhotoSizeId);
      const blob = await exportIdPhotoPrintSheetPdf(photo, preset);
      triggerBlobDownload(blob, `id-photo-4x6-${idPhotoSizeId}-${Date.now()}.pdf`);
    },
    [idPhotoResult, idPhotoSizeId],
  );

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
    idPhotoSizeId,
    setIdPhotoSizeId,
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
    handleDownloadPrintSheetJpg,
    handleDownloadPrintSheetPdf,
    failures: run.failures,
    requestedCount: run.requestedCount,
    succeededCount: run.succeededCount,
    isRetrying: run.isRetrying,
    isRunning: run.isRunning,
    cancelGeneration,
    handleRetryFailed,
    clearIdPhotoResult,
    isDraggingOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
