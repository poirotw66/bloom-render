/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared single-image upload panel for portrait/themed/id-photo flows.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import GenericUploadSection from './GenericUploadSection';

type Accent = 'blue' | 'purple' | 'emerald';

interface SingleImageUploadPanelProps {
  previewUrl: string | null;
  error: string | null;
  loading: boolean;
  isDraggingOver: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  titleKey: string;
  generateButtonKey: string;
  uploadInputId: string;
  accent: Accent;
}

const accentIcon: Record<Accent, string> = {
  blue: '📘',
  purple: '🎨',
  emerald: '🪪',
};

export function SingleImageUploadPanel({
  previewUrl,
  error,
  loading,
  isDraggingOver,
  onFileChange,
  onGenerate,
  onDragOver,
  onDragLeave,
  onDrop,
  titleKey,
  generateButtonKey,
  uploadInputId,
  accent,
}: SingleImageUploadPanelProps): React.ReactElement {
  const { t } = useLanguage();
  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-3">
      <h3 className="text-lg font-bold text-white">{t(titleKey)}</h3>
      <GenericUploadSection
        previewUrl={previewUrl}
        error={error}
        loading={loading}
        isDraggingOver={isDraggingOver}
        onFileChange={onFileChange}
        onGenerate={onGenerate}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        uploadHintKey="start.idphoto_upload_hint"
        generateButtonKey={generateButtonKey}
        changePhotoKey="start.idphoto_change_photo"
        icon={accentIcon[accent]}
        uploadInputId={uploadInputId}
      />
    </div>
  );
}
