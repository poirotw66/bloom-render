/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { IdPhotoIcon } from '../../components/icons';

interface PortraitUploadSectionProps {
    portraitFile: File | null;
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
    portraitFile,
    portraitPreviewUrl,
    portraitError,
    portraitLoading,
    isDraggingOver,
    onFileChange,
    onGenerate,
    onDragOver,
    onDragLeave,
    onDrop,
}) => {
    const { t } = useLanguage();

    if (portraitFile) {
        return (
            <div className="flex flex-col items-center gap-4 w-full max-w-md animate-fade-in bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white">{t('start.tab_portrait')}</h3>
                <div className="w-40 h-40 rounded-lg overflow-hidden border border-gray-600 bg-gray-900 flex items-center justify-center">
                    {portraitPreviewUrl && <img src={portraitPreviewUrl} alt="Uploaded portrait" className="max-w-full max-h-full w-auto h-auto object-contain" />}
                </div>
                <p className="text-sm text-gray-400">{t('start.idphoto_upload_hint')}</p>
                {portraitError && <p className="text-red-400 text-sm">{portraitError}</p>}
                <div className="flex items-center gap-3">
                    <label className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <input type="file" className="hidden" accept="image/*" onChange={onFileChange} aria-label={t('start.idphoto_change_photo')} />
                        {t('start.idphoto_change_photo')}
                    </label>
                    <button
                        onClick={onGenerate}
                        disabled={portraitLoading}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white font-bold bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IdPhotoIcon className="w-5 h-5" />
                        {t('service.action.generate')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`p-12 border-2 border-dashed rounded-xl bg-gray-800/20 w-full max-w-2xl flex flex-col items-center justify-center gap-4 transition-colors duration-200 ${isDraggingOver ? 'border-blue-400 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'
                }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <label
                htmlFor="image-upload-portrait"
                className="relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-blue-600 rounded-full cursor-pointer group hover:bg-blue-500 transition-colors duration-200 shadow-lg shadow-blue-600/20 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-800"
            >
                <IdPhotoIcon className="w-6 h-6 mr-3" />
                {t('start.upload_button')}
            </label>
            <input
                id="image-upload-portrait"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={onFileChange}
                aria-label={t('start.upload_button')}
            />
            <p className="text-sm text-gray-400">{t('start.idphoto_upload_hint')}</p>
        </div>
    );
};

export default PortraitUploadSection;
