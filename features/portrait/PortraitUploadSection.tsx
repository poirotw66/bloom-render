/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SingleImageUploadPanel } from '../../components/SingleImageUploadPanel';

interface PortraitUploadSectionProps {
  portraitPreviewUrl: string | null;
  portraitError: string | null;
  portraitLoading: boolean;
  isDraggingOver: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

const PortraitUploadSection: React.FC<PortraitUploadSectionProps> = ({
  portraitPreviewUrl,
  portraitError,
  portraitLoading,
  isDraggingOver,
  onFileChange,
  onGenerate,
  onDragOver,
  onDragLeave,
  onDrop,
}) => (
  <SingleImageUploadPanel
    previewUrl={portraitPreviewUrl}
    error={portraitError}
    loading={portraitLoading}
    isDraggingOver={isDraggingOver}
    onFileChange={onFileChange}
    onGenerate={onGenerate}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    titleKey="start.tab_portrait"
    generateButtonKey="service.action.generate"
    uploadInputId="image-upload-portrait"
    accent="blue"
  />
);

export default PortraitUploadSection;
