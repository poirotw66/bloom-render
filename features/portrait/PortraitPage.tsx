/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import StartTabNav from '../../components/StartTabNav';
import Spinner from '../../components/Spinner';
import { usePortrait } from './usePortrait';
import PortraitForm from './PortraitForm';
import PortraitUploadSection from './PortraitUploadSection';
import PortraitResult from './PortraitResult';

interface PortraitPageProps {
    onImageSelected: (file: File) => void;
}

const PortraitPage: React.FC<PortraitPageProps> = ({ onImageSelected }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const portrait = usePortrait();

    const handleEditInEditor = () => {
        if (!portrait.portraitResult) return;
        onImageSelected(dataURLtoFile(portrait.portraitResult, `portrait-${Date.now()}.png`));
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

                {portrait.portraitResult ? (
                    <PortraitResult
                        portraitResult={portrait.portraitResult}
                        portraitType={portrait.portraitType}
                        portraitOutputSpec={portrait.portraitOutputSpec}
                        onDownload={portrait.handlePortraitDownload}
                        onAgain={portrait.clearPortraitResult}
                        onEditInEditor={handleEditInEditor}
                    />
                ) : portrait.portraitLoading ? (
                    <div className="flex flex-col items-center gap-4 w-full max-w-md animate-fade-in bg-gray-800/40 p-8 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                        <Spinner />
                        <p className="text-gray-300">{t('portrait.generating')}</p>
                    </div>
                ) : (
                    <>
                        <PortraitForm
                            portraitType={portrait.portraitType}
                            setPortraitType={portrait.setPortraitType}
                            portraitOutputSpec={portrait.portraitOutputSpec}
                            setPortraitOutputSpec={portrait.setPortraitOutputSpec}
                            disabled={portrait.portraitLoading}
                        />
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
