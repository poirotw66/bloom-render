/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook for batch processing multiple images.
 */

import { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useHistory } from './useHistory';

export interface BatchProcessingOptions<TFile = File, TOptions = unknown> {
  generateApi: (
    file: TFile,
    options: TOptions,
    settings: { apiKey?: string; model?: string },
  ) => Promise<string>;
  options: TOptions;
  settings: { apiKey?: string; model?: string };
  maxConcurrent?: number;
  onProgress?: (completed: number, total: number) => void;
  onItemComplete?: (file: TFile, result: string, index: number) => void;
  onComplete?: (results: Array<{ file: TFile; result: string; index: number }>) => void;
  onError?: (file: TFile, error: Error, index: number) => void;
  historyType?: string;
}

export function useBatchProcessing<TFile = File, TOptions = unknown>() {
  const { t } = useLanguage();
  const { addToHistory } = useHistory();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, current: 0 });
  const [results, setResults] = useState<
    Array<{ file: TFile; result: string; index: number; error?: Error }>
  >([]);
  const [errors, setErrors] = useState<Array<{ file: TFile; error: Error; index: number }>>([]);

  const processBatch = useCallback(
    async (files: TFile[], options: BatchProcessingOptions<TFile, TOptions>) => {
      const {
        generateApi,
        options: apiOptions,
        settings,
        maxConcurrent = 3,
        onProgress,
        onItemComplete,
        onComplete,
        onError,
        historyType,
      } = options;

      setIsProcessing(true);
      setProgress({ completed: 0, total: files.length, current: 0 });
      setResults([]);
      setErrors([]);

      const processQueue: Array<{ file: TFile; index: number }> = files.map((file, index) => ({
        file,
        index,
      }));

      const activePromises: Array<Promise<void>> = [];
      const allResults: Array<{ file: TFile; result: string; index: number }> = [];
      const allErrors: Array<{ file: TFile; error: Error; index: number }> = [];

      const processNext = async (): Promise<void> => {
        if (processQueue.length === 0) return;

        const { file, index } = processQueue.shift()!;
        setProgress((prev) => ({ ...prev, current: index + 1 }));

        try {
          const result = await generateApi(file, apiOptions, settings);
          const itemResult = { file, result, index };
          allResults.push(itemResult);
          setResults([...allResults]);

          // Add to history if type specified
          if (historyType) {
            addToHistory(historyType, result, { batchIndex: index });
          }

          onItemComplete?.(file, result, index);
          setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          const errorItem = { file, error: err, index };
          allErrors.push(errorItem);
          setErrors([...allErrors]);
          onError?.(file, err, index);
          setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
        }

        onProgress?.(allResults.length + allErrors.length, files.length);

        // Process next item
        await processNext();
      };

      // Start processing with concurrency limit
      for (let i = 0; i < Math.min(maxConcurrent, files.length); i++) {
        activePromises.push(processNext());
      }

      await Promise.all(activePromises);

      setIsProcessing(false);
      onComplete?.(allResults);

      return { results: allResults, errors: allErrors };
    },
    [addToHistory],
  );

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress({ completed: 0, total: 0, current: 0 });
    setResults([]);
    setErrors([]);
  }, []);

  return {
    isProcessing,
    progress,
    results,
    errors,
    processBatch,
    reset,
  };
}
