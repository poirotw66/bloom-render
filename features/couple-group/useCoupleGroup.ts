/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook for couple/group photo state management and generation logic.
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { fileToPartAuto, getClient, getModel, handleApiResponse } from '../../services/gemini/shared';
import type { CoupleGroupMode, CoupleGroupStyle } from './types';
import type { CoupleStyle, GroupStyle } from '../../types';
import {
  COUPLE_STYLES,
  GROUP_STYLES,
  DEFAULT_COUPLE_STYLE,
  DEFAULT_GROUP_STYLE,
} from '../../constants/coupleGroup';

export function useCoupleGroup() {
  const { t } = useLanguage();
  const settings = useSettings();
  const [searchParams] = useSearchParams();

  // Mode: couple (2 files) or group (3-6 files)
  const [mode, setMode] = useState<CoupleGroupMode>('couple');
  
  // Style: couple styles or group styles (not portrait/themed/travel)
  const [style, setStyle] = useState<CoupleGroupStyle>(DEFAULT_COUPLE_STYLE);
  
  // Files and previews
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // Result and loading
  const [result, setResult] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);

  // Read URL parameters on mount
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const newMode: CoupleGroupMode | null = modeParam === 'couple' || modeParam === 'group' ? modeParam : null;
    
    if (newMode) {
      setMode(newMode);
    }

    const styleParam = searchParams.get('style');
    if (styleParam) {
      // Check if it's a valid couple or group style
      const isValidCoupleStyle = COUPLE_STYLES.some((s) => s.id === styleParam);
      const isValidGroupStyle = GROUP_STYLES.some((s) => s.id === styleParam);
      if (isValidCoupleStyle || isValidGroupStyle) {
        setStyle(styleParam as CoupleGroupStyle);
      } else if (newMode) {
        // If style param is invalid but mode is valid, set default style for that mode
        setStyle(newMode === 'couple' ? DEFAULT_COUPLE_STYLE : DEFAULT_GROUP_STYLE);
      }
    } else if (newMode) {
      // If no style param but mode is set, use default style for that mode
      setStyle(newMode === 'couple' ? DEFAULT_COUPLE_STYLE : DEFAULT_GROUP_STYLE);
    }
  }, [searchParams]);

  // Generate preview URLs
  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  // Handle file change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (mode === 'couple') {
      if (selectedFiles.length > 2) {
        setError(t('couple_group.error_too_many_couple'));
        e.target.value = '';
        return;
      }
      // For couple mode, replace all files with the selected ones (up to 2)
      setFiles(selectedFiles.slice(0, 2));
    } else if (mode === 'group') {
      if (selectedFiles.length > 6) {
        setError(t('couple_group.error_too_many_group'));
        e.target.value = '';
        return;
      }
      // For group mode, append new files to existing ones (up to 6 total)
      setFiles(prev => [...prev, ...selectedFiles].slice(0, 6));
    }
    
    setError(null);
    setResult(null);
    setResults([]);
    e.target.value = '';
  }, [mode, t]);

  // Remove file
  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  // Handle mode change
  const handleModeChange = useCallback((newMode: CoupleGroupMode) => {
    setMode(newMode);
    // Reset style to default for the new mode
    setStyle(newMode === 'couple' ? DEFAULT_COUPLE_STYLE : DEFAULT_GROUP_STYLE);
    // Clear files when switching modes
    setFiles([]);
    setError(null);
  }, []);

  // Handle style change
  const handleStyleChange = useCallback((newStyle: CoupleGroupStyle) => {
    setStyle(newStyle);
    // Keep files but reset error
    setError(null);
  }, []);

  // Drag and drop handlers
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
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    if (mode === 'couple') {
      if (droppedFiles.length > 2) {
        setError(t('couple_group.error_too_many_couple'));
        return;
      }
      setFiles(droppedFiles.slice(0, 2));
    } else if (mode === 'group') {
      if (droppedFiles.length > 6) {
        setError(t('couple_group.error_too_many_group'));
        return;
      }
      setFiles(prev => [...prev, ...droppedFiles].slice(0, 6));
    }
    
    setError(null);
  }, [mode, t]);

  // Generate handler
  const handleGenerate = useCallback(async () => {
    // Validation
    if (mode === 'couple' && files.length !== 2) {
      setError(t('couple_group.error_need_two_files'));
      return;
    }
    if (mode === 'group' && (files.length < 3 || files.length > 6)) {
      setError(t('couple_group.error_need_three_to_six_files'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setResults([]);

    try {
      // Find the style configuration
      const styleConfig =
        mode === 'couple'
          ? COUPLE_STYLES.find((s) => s.id === style)
          : GROUP_STYLES.find((s) => s.id === style);

      if (!styleConfig) {
        throw new Error('Invalid style');
      }

      // Use a unified generation function for couple/group photos
      // We'll create a new service function or reuse existing ones with custom prompts
      const fileCount = files.length;
      const isGroup = fileCount > 1;

      // Create base prompt with variation support
      const createPrompt = (variationIndex: number) => {
        const lightingVariations = [
          'soft natural lighting',
          'dramatic side lighting',
          'warm golden hour lighting',
          'even studio lighting',
          'cinematic lighting',
        ];
        const compositionVariations = [
          'unique composition and arrangement',
          'distinctive framing and positioning',
          'varied spatial arrangement',
          'different pose configuration',
          'alternative layout',
        ];
        const expressionVariations = [
          'natural expressions',
          'genuine interactions',
          'authentic moments',
          'spontaneous poses',
          'candid expressions',
        ];
        const seed = variationIndex;
        const lightingVar = lightingVariations[seed % lightingVariations.length];
        const compositionVar = compositionVariations[seed % compositionVariations.length];
        const expressionVar = expressionVariations[seed % expressionVariations.length];

        const variationNote = quantity > 1 
          ? `\nVariation Requirements:\n- Apply ${lightingVar}.\n- Use ${compositionVar}.\n- Capture ${expressionVar}.\n- Create a unique interpretation while maintaining the core style.\n`
          : '';

        return `You are a world-class ${mode === 'couple' ? 'couple' : 'group'} portrait photographer and retouching AI.
Transform the provided ${fileCount === 2 ? 'couple' : `group of ${fileCount} people`} portrait${isGroup ? 's' : ''} into a high-end, professional style image.

Style Requirements:
${styleConfig.promptHint}${variationNote}

Guidelines:
- Maintain strict identity consistency: ${fileCount === 2 ? 'both people' : `all ${fileCount} people`} must look the same as in the ${isGroup ? 'source images' : 'original image'}.
- Do NOT change facial structure or age.
- Arrange ${fileCount === 2 ? 'the couple' : `the group`} naturally and harmoniously in the composition.
- Only enhance lighting, skin texture, and apply the requested photography style.
- Output should be photorealistic and high quality.

Output: Return ONLY the final ${mode === 'couple' ? 'couple' : 'group'} portrait image. Do not return any text.`;
      };

      // Prepare file parts (same for all variations)
      const fileParts: Array<{ inlineData?: { mimeType: string; data: string } }> = [];
      for (const file of files) {
        fileParts.push(await fileToPartAuto(file));
      }

      console.log('Starting couple/group photo generation', { mode, style, fileCount });
      const ai = getClient(settings);
      const model = getModel(settings);

      // Generate all images in parallel with variations
      const generationPromises = Array.from({ length: quantity }, async (_, i) => {
        // Create unique prompt for each variation
        const variedPrompt = createPrompt(i);
        const parts: Array<
          { inlineData?: { mimeType: string; data: string } } | { text: string }
        > = [...fileParts, { text: variedPrompt }];

        try {
          const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          });
          return handleApiResponse(response, mode === 'couple' ? 'couple' : 'group');
        } catch (err) {
          console.error(`Couple/group generation error for item ${i + 1}:`, err);
          throw err;
        }
      });

      const settledResults = await Promise.allSettled(generationPromises);
      const generatedResults = settledResults
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map((result) => result.value);

      if (generatedResults.length === 0) {
        throw new Error('All generations failed');
      }

      if (generatedResults.length === 1) {
        setResult(generatedResults[0]);
      } else {
        setResults(generatedResults);
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : t('couple_group.error_generation_failed'));
    } finally {
      setLoading(false);
    }
  }, [mode, files, style, settings, t, quantity]);

  // Clear result
  const clearResult = useCallback(() => {
    setResult(null);
    setResults([]);
    setFiles([]);
    setError(null);
  }, []);

  const handleBatchDownload = useCallback(async () => {
    if (results.length === 0) return;

    try {
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
      results.forEach((result, index) => {
        const base64 = result.split(',')[1];
        zip.file(`couple-group-${mode}-${index + 1}.png`, base64, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `couple-group-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      results.forEach((result, index) => {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = result;
          link.download = `couple-group-${mode}-${index + 1}.png`;
          link.click();
        }, index * 100);
      });
    }
  }, [results, mode]);

  return {
    mode,
    setMode: handleModeChange,
    style,
    setStyle: handleStyleChange,
    files,
    previewUrls,
    result,
    results,
    loading,
    error,
    isDraggingOver,
    quantity,
    setQuantity,
    handleFileChange,
    removeFile,
    handleGenerate,
    handleBatchDownload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearResult,
  };
}
