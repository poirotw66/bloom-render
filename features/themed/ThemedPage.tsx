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
import { useThemed } from './useThemed';
import ThemedForm from './ThemedForm';
import ThemedUploadSection from './ThemedUploadSection';
import ThemedResult from './ThemedResult';
import QuantitySelector from '../../components/QuantitySelector';

interface ThemedPageProps {
    onImageSelected: (file: File) => void;
}

const ThemedPage: React.FC<ThemedPageProps> = ({ onImageSelected }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const themed = useThemed();

    const handleEditInEditor = (result: string, index?: number) => {
        if (!result) return;
        onImageSelected(dataURLtoFile(result, `themed-${index !== undefined ? index + 1 : Date.now()}.png`));
    };

    return (
        <div className="w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 border-transparent">
            <div className="flex flex-col items-center gap-6 animate-fade-in">
                <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
                    {t('start.title_part1')} <span className="text-purple-400">{t('start.title_part2')}</span>.
                </h1>
                <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
                    {t('start.subtitle')}
                </p>

                <StartTabNav currentTab="themed" navigate={navigate} />

                {themed.themedResults && themed.themedResults.length > 0 ? (
                    <div className="w-full flex flex-col gap-6">
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={themed.handleThemedBatchDownload}
                                className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                            >
                                💾 {t('history.batch_download')} ({themed.themedResults.length})
                            </button>
                            <button
                                onClick={themed.clearThemedResult}
                                className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
                            >
                                {t('start.idphoto_again')}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                            {themed.themedResults.map((result, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-900 flex items-center justify-center">
                                        <img
                                            src={result}
                                            alt={`Themed ${idx + 1}`}
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
                                            link.download = `themed-${idx + 1}.png`;
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
                ) : themed.themedLoading ? (
                    <ProgressIndicator
                        progress={themed.progress}
                        statusMessages={['themed.generating']}
                    />
                ) : (
                    <>
                        <ThemedForm
                            themeType={themed.themeType}
                            setThemeType={themed.setThemeType}
                            disabled={themed.themedLoading}
                        />
                        <div className="w-full max-w-md mx-auto">
                            <QuantitySelector
                                quantity={themed.quantity}
                                onChange={themed.setQuantity}
                                disabled={themed.themedLoading}
                            />
                        </div>
                        <ThemedUploadSection
                            themedFile={themed.themedFile}
                            themedPreviewUrl={themed.themedPreviewUrl}
                            themedError={themed.themedError}
                            themedLoading={themed.themedLoading}
                            isDraggingOver={themed.isDraggingOver}
                            onFileChange={themed.handleThemedFileChange}
                            onGenerate={themed.handleThemedGenerate}
                            onDragOver={themed.handleDragOver}
                            onDragLeave={themed.handleDragLeave}
                            onDrop={themed.handleDrop}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default ThemedPage;
