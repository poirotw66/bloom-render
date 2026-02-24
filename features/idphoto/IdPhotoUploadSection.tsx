/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SingleImageUploadPanel } from '../../components/SingleImageUploadPanel';

interface IdPhotoUploadSectionProps {
  idPhotoFile: File | null;
  idPhotoPreviewUrl: string | null;
  idPhotoError: string | null;
  idPhotoLoading: boolean;
  isDraggingOver: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

const IdPhotoUploadSection: React.FC<IdPhotoUploadSectionProps> = ({
  idPhotoFile,
  idPhotoPreviewUrl,
  idPhotoError,
  idPhotoLoading,
  isDraggingOver,
  onFileChange,
  onGenerate,
  onDragOver,
  onDragLeave,
  onDrop,
}) => (
  <SingleImageUploadPanel
    file={idPhotoFile}
    previewUrl={idPhotoPreviewUrl}
    error={idPhotoError}
    loading={idPhotoLoading}
    isDraggingOver={isDraggingOver}
    onFileChange={onFileChange}
    onGenerate={onGenerate}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    titleKey="start.idphoto_title"
    generateButtonKey="start.idphoto_generate_btn"
    uploadInputId="image-upload-idphoto"
    accent="emerald"
  />
);

export default IdPhotoUploadSection;
