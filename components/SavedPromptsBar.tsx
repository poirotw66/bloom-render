/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reusable "saved prompts" row for text-prompt inputs (generate, retouch,
 * adjust, filter). Renders saved prompts as chips the user can re-apply or
 * delete, plus a button to save whatever is currently typed.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSavedPrompts } from '../hooks/useSavedPrompts';
import { BookmarkIcon, XMarkIcon } from './icons';

interface SavedPromptsBarProps {
  /** Which prompt surface this belongs to (generate / retouch / adjust / filter). */
  scope: string;
  /** Current text in the input this bar sits under. */
  value: string;
  /** Called with a saved prompt's text when its chip is clicked. */
  onApply: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

const CHIP_TEXT_MAX = 32;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

const SavedPromptsBar: React.FC<SavedPromptsBarProps> = ({
  scope,
  value,
  onApply,
  disabled = false,
  className = '',
}) => {
  const { t } = useLanguage();
  const { prompts, savePrompt, removePrompt, isSaved } = useSavedPrompts(scope);

  const trimmedValue = value.trim();
  const canSave = trimmedValue.length > 0 && !isSaved(trimmedValue);

  if (prompts.length === 0 && !canSave) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800/60 pl-3 pr-1 py-1"
        >
          <button
            type="button"
            onClick={() => onApply(prompt.text)}
            disabled={disabled}
            title={prompt.text}
            aria-label={t('prompts.use', { text: prompt.text })}
            className="text-xs font-medium text-gray-300 hover:text-white transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            {truncate(prompt.text, CHIP_TEXT_MAX)}
          </button>
          <button
            type="button"
            onClick={() => removePrompt(prompt.id)}
            disabled={disabled}
            aria-label={t('prompts.remove')}
            title={t('prompts.remove')}
            className="p-1 rounded-full text-gray-500 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <XMarkIcon className="w-3 h-3" />
          </button>
        </div>
      ))}

      {canSave && (
        <button
          type="button"
          onClick={() => savePrompt(trimmedValue)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gray-600 px-3 py-1 text-xs font-medium text-gray-400 hover:text-white hover:border-gray-400 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <BookmarkIcon className="w-3.5 h-3.5" />
          {t('prompts.save')}
        </button>
      )}
    </div>
  );
};

export default SavedPromptsBar;
