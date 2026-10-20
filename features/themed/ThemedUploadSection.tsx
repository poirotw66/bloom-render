/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { SingleImageUploadPanel } from '../../components/SingleImageUploadPanel';

interface ThemedUploadSectionProps {
  themedPreviewUrl: string | null;
  themedError: string | null;
  themedLoading: boolean;
  isDraggingOver: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  quantity?: number;
  imageSize?: string | null;
}

const ThemedUploadSection: React.FC<ThemedUploadSectionProps> = ({
  themedPreviewUrl,
  themedError,
  themedLoading,
  isDraggingOver,
  onFileChange,
  onGenerate,
  onDragOver,
  onDragLeave,
  onDrop,
  quantity,
  imageSize,
}) => (
  <SingleImageUploadPanel
    previewUrl={themedPreviewUrl}
    error={themedError}
    loading={themedLoading}
    isDraggingOver={isDraggingOver}
    onFileChange={onFileChange}
    onGenerate={onGenerate}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    titleKey="start.tab_themed"
    generateButtonKey="service.action.generate"
    uploadInputId="image-upload-themed"
    accent="purple"
    quantity={quantity}
    imageSize={imageSize}
  />
);

export default ThemedUploadSection;
