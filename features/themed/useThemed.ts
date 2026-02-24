/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateThemedPhoto } from '../../services/geminiService';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { normalizeApiError } from '../../services/gemini/shared';
import { useHistory } from '../../hooks/useHistory';
import { downloadBatchWithZipFallback } from '../../utils/downloadHelpers';
import { getFulfilledResults, startRandomProgressTicker } from '../../utils/generationHelpers';
import { DEFAULT_THEMED_TYPE } from '../../constants/themed';
import type { ThemedType } from '../../types';

export function useThemed() {
    const { t } = useLanguage();
    const settings = useSettings();
    const [searchParams] = useSearchParams();
    const { addToHistory } = useHistory();

    const [themedFile, setThemedFile] = useState<File | null>(null);
    const [themedResult, setThemedResult] = useState<string | null>(null);
    const [themedResults, setThemedResults] = useState<string[]>([]);
    const [themedLoading, setThemedLoading] = useState(false);
    const [themedError, setThemedError] = useState<string | null>(null);
    const [themedPreviewUrl, setThemedPreviewUrl] = useState<string | null>(null);
    const [themeType, setThemeType] = useState<ThemedType>(DEFAULT_THEMED_TYPE);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [progress, setProgress] = useState<number>(0);
    const [quantity, setQuantity] = useState<number>(1);
    const [outputSize, setOutputSize] = useState<'1K' | '2K' | '4K'>('1K');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');

    useEffect(() => {
        const typeParam = searchParams.get('type');
        if (typeParam) {
            setThemeType(typeParam as ThemedType);
        }
    }, [searchParams]);

    useEffect(() => {
        if (themedFile) {
            const u = URL.createObjectURL(themedFile);
            setThemedPreviewUrl(u);
            return () => URL.revokeObjectURL(u);
        } else {
            setThemedPreviewUrl(null);
        }
    }, [themedFile]);

    const handleThemedFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setThemedFile(f);
            setThemedResult(null);
            setThemedResults([]);
            setThemedError(null);
        }
        e.target.value = '';
    }, []);

    const handleThemedGenerate = useCallback(async () => {
        if (!themedFile) {
            setThemedError(t('themed.error_no_image'));
            return;
        }
        setThemedError(null);
        setThemedLoading(true);
        setProgress(0);
        setThemedResult(null);
        setThemedResults([]);

        try {
            const stopProgress = startRandomProgressTicker(setProgress);

            // Generate all images in parallel with variations
            const generationPromises = Array.from({ length: quantity }, (_, i) =>
                generateThemedPhoto(themedFile, {
                    themeType,
                    settings: { apiKey: settings.apiKey, model: settings.model },
                    variationIndex: i,
                    outputSize,
                    aspectRatio,
                })
                    .then((url) => {
                        // Add to history
                        addToHistory('themed', url, { themeType });
                        return url;
                    })
                    .catch((err) => {
                        console.error(`Themed generation error for item ${i + 1}:`, err);
                        throw err;
                    })
            );

            const settledResults = await Promise.allSettled(generationPromises);
            const results = getFulfilledResults(settledResults);

            stopProgress();
            setProgress(100);

            if (results.length === 0) {
                throw new Error('error.all_generations_failed');
            }

            if (results.length === 1) {
                setThemedResult(results[0]);
            } else {
                setThemedResults(results);
            }
        } catch (err) {
            const normalizedError = normalizeApiError(err, 'themed');
            const errorKey = normalizedError.message || 'error.unknown';
            setThemedError(t(errorKey));
            console.error('Themed generation error:', normalizedError.originalError || err);
        } finally {
            setThemedLoading(false);
            setProgress(0);
        }
    }, [themedFile, themeType, settings.apiKey, settings.model, t, addToHistory, quantity, outputSize, aspectRatio]);

    const handleThemedDownload = useCallback(() => {
        if (!themedResult) return;
        const a = document.createElement('a');
        a.href = themedResult;
        a.download = `themed-${Date.now()}.png`;
        a.click();
    }, [themedResult]);

    const clearThemedResult = useCallback(() => {
        setThemedResult(null);
        setThemedResults([]);
    }, []);

    const handleThemedBatchDownload = useCallback(async () => {
        if (themedResults.length === 0) return;

        await downloadBatchWithZipFallback({
            dataUrls: themedResults,
            itemFileName: (index) => `themed-${index + 1}.png`,
            zipFileName: `themed-${Date.now()}.zip`,
        });
    }, [themedResults]);

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
        if (file) {
            setThemedFile(file);
            setThemedResult(null);
            setThemedError(null);
        }
    }, []);

    return {
        themedFile,
        themedResult,
        themedResults,
        themedLoading,
        themedError,
        themedPreviewUrl,
        themeType,
        setThemeType,
        progress,
        quantity,
        setQuantity,
        outputSize,
        setOutputSize,
        aspectRatio,
        setAspectRatio,
        handleThemedFileChange,
        handleThemedGenerate,
        handleThemedDownload,
        handleThemedBatchDownload,
        clearThemedResult,
        isDraggingOver,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
}
