import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import type { HistoryItem } from '../utils/historyDb';
import { adjacentHistoryId } from '../utils/posewearHistorySelection';
import HistoryResultViewer from './HistoryResultViewer';

interface Props {
  items: HistoryItem[];
  initialId: string;
  onClose: () => void;
  onAfterNavigate?: () => void;
}

export default function HistoryResultBrowser({
  items,
  initialId,
  onClose,
  onAfterNavigate,
}: Props) {
  const [currentId, setCurrentId] = useState(initialId);
  const index = items.findIndex((item) => item.id === currentId);
  const item = items[index];
  useEffect(() => {
    if (!item) onClose();
  }, [item, onClose]);
  if (!item) return null;
  const move = (delta: -1 | 1) => {
    const next = adjacentHistoryId(
      items.map((entry) => entry.id),
      currentId,
      delta,
    );
    if (next) setCurrentId(next);
  };
  return (
    <HistoryResultViewer
      item={item}
      onClose={onClose}
      onReferenceNavigate={() => {
        flushSync(onClose);
        onAfterNavigate?.();
      }}
      navigation={{ index, total: items.length, onPrevious: () => move(-1), onNext: () => move(1) }}
    />
  );
}
