/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import StartTabNav from '../../components/StartTabNav';
import ProgressIndicator from '../../components/ProgressIndicator';
import { usePortrait } from './usePortrait';
import PortraitForm from './PortraitForm';
import PortraitUploadSection from './PortraitUploadSection';
import PortraitResult from './PortraitResult';
import QuantitySelector from '../../components/QuantitySelector';

interface PortraitPageProps {
    onImageSelected: (file: File) => void;
}

const PortraitPage: React.FC<PortraitPageProps> = ({ onImageSelected }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const portrait = usePortrait();

    const handleEditInEditor = (result: string, index?: number) => {
        if (!result) return;
        onImageSelected(dataURLtoFile(result, `portrait-${index !== undefined ? index + 1 : Date.now()}.png`));
    };

    return (
        <div className="w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 border-transparent">
            <div className="flex flex-col items-center gap-6 animate-fade-in">
                <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
                    {t('start.title_part1')} <span className="text-blue-400">{t('start.title_part2')}</span>.
                </h1>
                <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
                    {t('start.subtitle')}
                </p>

                <StartTabNav currentTab="portrait" navigate={navigate} />

                {portrait.portraitResults && portrait.portraitResults.length > 0 ? (
                    <div className="w-full flex flex-col gap-6">
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={portrait.handlePortraitBatchDownload}
                                className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                            >
                                💾 {t('history.batch_download')} ({portrait.portraitResults.length})
                            </button>
                            <button
                                onClick={portrait.clearPortraitResult}
                                className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
                            >
                                {t('portrait.generate_again')}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                            {portrait.portraitResults.map((result, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-900 flex items-center justify-center">
                                        <img
                                            src={result}
                                            alt={`Portrait ${idx + 1}`}
                                            className="max-w-full max-h-full w-auto h-auto object-contain"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleEditInEditor(result, idx)}
                                        className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                        <span className="text-white font-bold">{t('history.edit')}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = result;
                                            link.download = `portrait-${idx + 1}.png`;
                                            link.click();
                                        }}
                                        className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        title={t('start.idphoto_download')}
                                    >
                                        ⬇️
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : portrait.portraitLoading ? (
                    <ProgressIndicator
                        progress={portrait.progress}
                        statusMessages={['portrait.generating']}
                    />
                ) : (
                    <>
                        <PortraitForm
                            portraitType={portrait.portraitType}
                            setPortraitType={portrait.setPortraitType}
                            portraitOutputSpec={portrait.portraitOutputSpec}
                            setPortraitOutputSpec={portrait.setPortraitOutputSpec}
                            disabled={portrait.portraitLoading}
                        />
                        <div className="w-full max-w-md mx-auto">
                            <QuantitySelector
                                quantity={portrait.quantity}
                                onChange={portrait.setQuantity}
                                disabled={portrait.portraitLoading}
                            />
                        </div>
                        <PortraitUploadSection
                            portraitFile={portrait.portraitFile}
                            portraitPreviewUrl={portrait.portraitPreviewUrl}
                            portraitError={portrait.portraitError}
                            portraitLoading={portrait.portraitLoading}
                            isDraggingOver={portrait.isDraggingOver}
                            onFileChange={portrait.handlePortraitFileChange}
                            onGenerate={portrait.handlePortraitGenerate}
                            onDragOver={portrait.handleDragOver}
                            onDragLeave={portrait.handleDragLeave}
                            onDrop={portrait.handleDrop}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default PortraitPage;
