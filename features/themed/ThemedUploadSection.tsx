/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SingleImageUploadPanel } from '../../components/SingleImageUploadPanel';

interface ThemedUploadSectionProps {
    themedFile: File | null;
    themedPreviewUrl: string | null;
    themedError: string | null;
    themedLoading: boolean;
    isDraggingOver: boolean;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onGenerate: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
}

const ThemedUploadSection: React.FC<ThemedUploadSectionProps> = ({
    themedFile,
    themedPreviewUrl,
    themedError,
    themedLoading,
    isDraggingOver,
    onFileChange,
    onGenerate,
    onDragOver,
    onDragLeave,
    onDrop,
}) => (
    <SingleImageUploadPanel
        file={themedFile}
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
    />
);

export default ThemedUploadSection;
