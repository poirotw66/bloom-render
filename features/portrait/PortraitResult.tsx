/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { DownloadIcon, RefreshIcon, EditIcon } from '../../components/icons';

interface PortraitResultProps {
    portraitResult: string;
    portraitType: string;
    portraitOutputSpec: string;
    onDownload: () => void;
    onAgain: () => void;
    onEditInEditor: () => void;
}

const PortraitResult: React.FC<PortraitResultProps> = ({
    portraitResult,
    portraitType,
    portraitOutputSpec,
    onDownload,
    onAgain,
    onEditInEditor,
}) => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl animate-fade-in">
            <div className="flex flex-col md:flex-row gap-8 items-start justify-center w-full">
                <div className="flex-1 flex flex-col items-center gap-4">
                    <div className="relative group overflow-hidden rounded-2xl border-4 border-gray-700 bg-gray-900 shadow-2xl">
                        <img
                            src={portraitResult}
                            alt="Generated Portrait"
                            className="max-w-full h-auto object-contain max-h-[500px]"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button
                                onClick={onDownload}
                                className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110"
                                title={t('start.idphoto_download')}
                            >
                                <DownloadIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-80 flex flex-col gap-6">
                    <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">{t('idphoto.result.params_title')}</h3>
                        <div className="space-y-4">
                            <div>
                                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{t('portrait.label.type')}</span>
                                <span className="text-gray-200">{t(`portrait.type.${portraitType}`)}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{t('portrait.label.spec')}</span>
                                <span className="text-gray-200">{t(`portrait.spec.${portraitOutputSpec}`)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onDownload}
                            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            {t('start.idphoto_download')}
                        </button>
                        <button
                            onClick={onEditInEditor}
                            className="flex items-center justify-center gap-2 w-full py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all border border-gray-600 active:scale-95"
                        >
                            <EditIcon className="w-5 h-5" />
                            {t('start.idphoto_edit')}
                        </button>
                        <button
                            onClick={onAgain}
                            className="flex items-center justify-center gap-2 w-full py-4 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium rounded-xl transition-all active:scale-95"
                        >
                            <RefreshIcon className="w-5 h-5" />
                            {t('start.idphoto_again')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortraitResult;
