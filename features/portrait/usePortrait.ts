/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateProfessionalPortrait } from '../../services/geminiService';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    DEFAULT_PORTRAIT_TYPE,
    DEFAULT_PORTRAIT_SPEC,
} from '../../constants/portrait';
import type { PortraitType, OutputSpec } from '../../types';

export function usePortrait() {
    const { t } = useLanguage();
    const settings = useSettings();
    const [searchParams] = useSearchParams();

    const [portraitFile, setPortraitFile] = useState<File | null>(null);
    const [portraitResult, setPortraitResult] = useState<string | null>(null);
    const [portraitLoading, setPortraitLoading] = useState(false);
    const [portraitError, setPortraitError] = useState<string | null>(null);
    const [portraitPreviewUrl, setPortraitPreviewUrl] = useState<string | null>(null);
    const [portraitType, setPortraitType] = useState<PortraitType>(DEFAULT_PORTRAIT_TYPE);
    const [portraitOutputSpec, setPortraitOutputSpec] = useState<OutputSpec>(DEFAULT_PORTRAIT_SPEC);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    useEffect(() => {
        const typeParam = searchParams.get('type');
        if (typeParam) {
            setPortraitType(typeParam as PortraitType);
        }
        const specParam = searchParams.get('spec');
        if (specParam && ['half_body', 'full_body'].includes(specParam)) {
            setPortraitOutputSpec(specParam as OutputSpec);
        }
    }, [searchParams]);

    useEffect(() => {
        if (portraitFile) {
            const u = URL.createObjectURL(portraitFile);
            setPortraitPreviewUrl(u);
            return () => URL.revokeObjectURL(u);
        } else {
            setPortraitPreviewUrl(null);
        }
    }, [portraitFile]);

    const handlePortraitFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setPortraitFile(f);
            setPortraitResult(null);
            setPortraitError(null);
        }
        e.target.value = '';
    }, []);

    const handlePortraitGenerate = useCallback(async () => {
        if (!portraitFile) {
            setPortraitError(t('portrait.error_no_image'));
            return;
        }
        setPortraitError(null);
        setPortraitLoading(true);
        try {
            // Assuming generateProfessionalPortrait will be implemented in geminiService
            const url = await generateProfessionalPortrait(portraitFile, {
                portraitType,
                outputSpec: portraitOutputSpec,
                settings: { apiKey: settings.apiKey, model: settings.model },
            });
            setPortraitResult(url);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
            setPortraitError(`Failed: ${msg}`);
        } finally {
            setPortraitLoading(false);
        }
    }, [portraitFile, portraitType, portraitOutputSpec, settings.apiKey, settings.model, t]);

    const handlePortraitDownload = useCallback(() => {
        if (!portraitResult) return;
        const a = document.createElement('a');
        a.href = portraitResult;
        a.download = `portrait-${Date.now()}.png`;
        a.click();
    }, [portraitResult]);

    const clearPortraitResult = useCallback(() => {
        setPortraitResult(null);
    }, []);

    const setFileFromDrop = useCallback((file: File) => {
        setPortraitFile(file);
        setPortraitResult(null);
        setPortraitError(null);
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
        portraitFile,
        portraitResult,
        portraitLoading,
        portraitError,
        portraitPreviewUrl,
        portraitType,
        setPortraitType,
        portraitOutputSpec,
        setPortraitOutputSpec,
        handlePortraitFileChange,
        handlePortraitGenerate,
        handlePortraitDownload,
        clearPortraitResult,
        isDraggingOver,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
}
