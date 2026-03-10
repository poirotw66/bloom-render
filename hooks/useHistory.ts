/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook for managing generation history.
 */

import { useState, useCallback, useEffect } from 'react';

export interface HistoryItem {
  id: string;
  type: string;
  result: string;
  timestamp: number;
  options?: Record<string, unknown>;
}

const HISTORY_STORAGE_KEY = 'pixshop_generation_history';
const MAX_HISTORY_ITEMS = 50;

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryItem[];
        setHistory(parsed);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save history:', err);
    }
  }, [history]);

  const addToHistory = useCallback(
    (type: string, result: string, options?: Record<string, unknown>) => {
      const item: HistoryItem = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        result,
        timestamp: Date.now(),
        options,
      };

      setHistory((prev) => {
        const updated = [item, ...prev].slice(0, MAX_HISTORY_ITEMS);
        return updated;
      });

      return item.id;
    },
    [],
  );

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getHistoryByType = useCallback(
    (type: string) => {
      return history.filter((item) => item.type === type);
    },
    [history],
  );

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryByType,
  };
}
