/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Shared history entry card: compare, share/download, edit, generate again.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import type { HistoryItem } from '../hooks/useHistory';
import { buildHistoryReplayState, routeForHistoryType } from '../utils/historyReplay';
import ResultActions from './ResultActions';
import ResultImage from './ResultImage';
import { EditIcon, XMarkIcon } from './icons';
import { UI_BTN_PRIMARY, UI_BTN_SECONDARY, UI_CARD_SOFT } from '../utils/uiClasses';

function formatRelativeTime(
  timestamp: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return t('history.just_now');
  if (diffMinutes < 60) return t('history.minutes_ago', { count: diffMinutes });
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t('history.hours_ago', { count: diffHours });
  return t('history.days_ago', { count: Math.floor(diffHours / 24) });
}

interface HistoryResultCardProps {
  item: HistoryItem;
  index: number;
  compact?: boolean;
  onEdit?: (item: HistoryItem, index: number) => void;
  onRemove: (id: string) => void;
  onAfterNavigate?: () => void;
}

const HistoryResultCard: React.FC<HistoryResultCardProps> = ({
  item,
  index,
  compact = false,
  onEdit,
  onRemove,
  onAfterNavigate,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleGenerateAgain = () => {
    const path = routeForHistoryType(item.type);
    navigate(path, {
      state: buildHistoryReplayState(item.type, item.options, item.sourceUrl),
    });
    onAfterNavigate?.();
  };

  return (
    <article className={UI_CARD_SOFT}>
      <div
        className={`${compact ? 'aspect-square' : 'min-h-[200px]'} bg-gray-950 flex items-center justify-center p-2`}
      >
        <ResultImage
          resultUrl={item.url}
          originalUrl={item.sourceUrl}
          alt={`${t(`history.type.${item.type}`)} ${index + 1}`}
          imageClassName="max-w-full max-h-full object-contain"
          preferCompare={Boolean(item.sourceUrl)}
        />
      </div>

      <div className={`${compact ? 'p-3 space-y-2' : 'p-4 space-y-4'}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className={`${compact ? 'text-xs' : 'text-lg'} font-bold text-white`}>
              {t(`history.type.${item.type}`)}
            </div>
            <div className={`${compact ? 'text-[11px]' : 'text-sm'} text-gray-400`}>
              {formatRelativeTime(item.timestamp, t)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="p-1 rounded-lg text-red-200 hover:text-red-100 hover:bg-red-500/10 transition-colors"
            aria-label={t('history.delete')}
            title={t('history.delete')}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {!compact && item.options && Object.keys(item.options).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(item.options)
              .filter(([key]) => !['prompt'].includes(key))
              .slice(0, 8)
              .map(([key, value]) => (
                <span
                  key={key}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300"
                >
                  {key}: {String(value)}
                </span>
              ))}
          </div>
        )}

        <ResultActions
          result={item.blob}
          originalUrl={item.sourceUrl}
          fileBaseName={`${item.type}-${index + 1}`}
        />

        <div className={`flex gap-2 ${compact ? '' : 'flex-wrap'}`}>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(item, index)}
              className={`flex-1 text-xs ${UI_BTN_PRIMARY}`}
            >
              <span className="inline-flex items-center justify-center gap-1">
                <EditIcon className="w-3.5 h-3.5" />
                {t('history.edit')}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerateAgain}
            className={`flex-1 text-xs ${UI_BTN_SECONDARY}`}
          >
            {t('history.generate_again')}
          </button>
        </div>
      </div>
    </article>
  );
};

export default HistoryResultCard;
