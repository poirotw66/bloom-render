/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Export / import all saved-prompt scopes as a single JSON file.
 */

import React, { useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  applySavedPromptsImport,
  downloadSavedPromptsExport,
  parseSavedPromptsImport,
} from '../utils/savedPromptsIo';

interface SavedPromptsImportExportProps {
  className?: string;
  /** Called after a successful import so open UIs can reload from localStorage. */
  onImported?: () => void;
}

const SavedPromptsImportExport: React.FC<SavedPromptsImportExportProps> = ({
  className = '',
  onImported,
}) => {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    setError(null);
    downloadSavedPromptsExport();
    setMessage(t('prompts.export_done'));
  };

  const handleImportFile = async (file: File | undefined) => {
    setMessage(null);
    setError(null);
    if (!file) return;
    try {
      const text = await file.text();
      const data = parseSavedPromptsImport(text);
      applySavedPromptsImport(data, 'merge');
      setMessage(t('prompts.import_done'));
      onImported?.();
    } catch {
      setError(t('prompts.import_failed'));
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white/10 text-gray-200 hover:bg-white/20 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {t('prompts.export')}
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white/10 text-gray-200 hover:bg-white/20 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {t('prompts.import')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void handleImportFile(e.target.files?.[0])}
          aria-label={t('prompts.import')}
        />
      </div>
      {message && <p className="text-xs text-emerald-300">{message}</p>}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
};

export default SavedPromptsImportExport;
