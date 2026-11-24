/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Hook for cancellable batch processing with bounded concurrency.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ServiceSettings } from '../services/gemini/shared';
import { buildHistoryOptions } from '../utils/historyOptions';
import { useHistory } from './useHistory';

export interface BatchProcessingOptions<TFile = File, TOptions = unknown> {
  generateApi: (file: TFile, options: TOptions, settings: ServiceSettings) => Promise<string>;
  options: TOptions;
  settings: ServiceSettings;
  maxConcurrent?: number;
  onProgress?: (completed: number, total: number) => void;
  onItemComplete?: (file: TFile, result: string, index: number) => void;
  onComplete?: (results: Array<{ file: TFile; result: string; index: number }>) => void;
  onError?: (file: TFile, error: Error, index: number) => void;
  historyType?: string;
}

type BatchItem<TFile> = { file: TFile; result: string; index: number };
type BatchError<TFile> = { file: TFile; error: Error; index: number };
type BatchOutcome<TFile> = {
  results: BatchItem<TFile>[];
  errors: BatchError<TFile>[];
  cancelled: boolean;
};
type BatchRun<TFile> = {
  controller: AbortController;
  promise: Promise<BatchOutcome<TFile>> | null;
};

export function useBatchProcessing<TFile = File, TOptions = unknown>() {
  const { addToHistory } = useHistory();
  const activeRun = useRef<BatchRun<TFile> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, current: 0 });
  const [results, setResults] = useState<BatchItem<TFile>[]>([]);
  const [errors, setErrors] = useState<BatchError<TFile>[]>([]);

  useEffect(
    () => () => {
      activeRun.current?.controller.abort();
      activeRun.current = null;
    },
    [],
  );

  const cancel = useCallback(() => {
    if (!activeRun.current) return;
    activeRun.current.controller.abort();
    activeRun.current = null;
    setIsProcessing(false);
    setCancelled(true);
  }, []);

  const processBatch = useCallback(
    (files: TFile[], options: BatchProcessingOptions<TFile, TOptions>) => {
      // Share the active run rather than starting duplicate requests before React renders.
      if (activeRun.current?.promise) return activeRun.current.promise;
      const run: BatchRun<TFile> = { controller: new AbortController(), promise: null };
      activeRun.current = run;
      const isCurrent = () => activeRun.current === run && !run.controller.signal.aborted;
      const allResults: BatchItem<TFile>[] = [];
      const allErrors: BatchError<TFile>[] = [];
      let nextIndex = 0;
      let completed = 0;
      setIsProcessing(true);
      setCancelled(false);
      setProgress({ completed: 0, total: files.length, current: 0 });
      setResults([]);
      setErrors([]);

      const externalSignal = options.settings.abortSignal;
      const onAbort = () => {
        if (activeRun.current === run) cancel();
      };
      externalSignal?.addEventListener('abort', onAbort, { once: true });
      if (externalSignal?.aborted) onAbort();

      const worker = async () => {
        while (isCurrent() && nextIndex < files.length) {
          const index = nextIndex++;
          const file = files[index];
          setProgress((prev) => ({ ...prev, current: index + 1 }));
          let result: string;
          try {
            result = await options.generateApi(file, options.options, {
              ...options.settings,
              abortSignal: run.controller.signal,
            });
          } catch (error) {
            if (!isCurrent()) return;
            const err = error instanceof Error ? error : new Error(String(error));
            allErrors.push({ file, error: err, index });
            setErrors([...allErrors].sort((a, b) => a.index - b.index));
            completed++;
            setProgress((prev) => ({ ...prev, completed }));
            options.onError?.(file, err, index);
            if (!isCurrent()) return;
            options.onProgress?.(completed, files.length);
            continue;
          }
          // Providers may finish even after a client abort. Ignore stale results.
          if (!isCurrent()) return;
          allResults.push({ file, result, index });
          allResults.sort((a, b) => a.index - b.index);
          setResults([...allResults]);
          if (options.historyType) {
            void addToHistory(
              options.historyType,
              result,
              buildHistoryOptions(options.historyType, options.settings, {
                ...(typeof options.options === 'object' && options.options !== null
                  ? (options.options as Record<string, unknown>)
                  : {}),
                batchIndex: index,
              }),
            );
          }
          completed++;
          setProgress((prev) => ({ ...prev, completed }));
          options.onItemComplete?.(file, result, index);
          if (!isCurrent()) return;
          options.onProgress?.(completed, files.length);
        }
      };

      // Schedule work after assigning the promise, so re-entrant callers share this run.
      run.promise = Promise.resolve().then(async () => {
        try {
          const concurrency = Number.isFinite(options.maxConcurrent)
            ? Math.max(1, Math.floor(options.maxConcurrent!))
            : 3;
          await Promise.all(
            Array.from({ length: Math.min(concurrency, files.length) }, () => worker()),
          );
          const finished = isCurrent();
          if (finished) {
            activeRun.current = null;
            setIsProcessing(false);
            options.onComplete?.(allResults);
          }
          return { results: allResults, errors: allErrors, cancelled: !finished };
        } catch (error) {
          run.controller.abort();
          throw error;
        } finally {
          externalSignal?.removeEventListener('abort', onAbort);
          if (activeRun.current === run) {
            activeRun.current = null;
            setIsProcessing(false);
          }
        }
      });
      return run.promise;
    },
    [addToHistory, cancel],
  );

  const reset = useCallback(() => {
    activeRun.current?.controller.abort();
    activeRun.current = null;
    setIsProcessing(false);
    setCancelled(false);
    setProgress({ completed: 0, total: 0, current: 0 });
    setResults([]);
    setErrors([]);
  }, []);

  return { isProcessing, cancelled, progress, results, errors, processBatch, cancel, reset };
}
