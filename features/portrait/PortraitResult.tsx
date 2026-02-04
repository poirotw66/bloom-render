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
        <div className="flex flex-col items-center gap-4 w-full animate-fade-in bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 backdrop-blur-sm">
            <div className="w-full aspect-[3/4] max-h-[400px] rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-900 flex items-center justify-center shadow-lg">
                <img
                    src={portraitResult}
                    alt="Generated Portrait"
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                />
            </div>
            
            <div className="w-full bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
                <h3 className="text-sm font-bold text-white mb-3">{t('idphoto.result.params_title')}</h3>
                <div className="space-y-2 text-sm">
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

            <div className="flex flex-col gap-2 w-full">
                <button
                    onClick={onDownload}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all text-sm active:scale-95"
                >
                    <DownloadIcon className="w-4 h-4" />
                    {t('start.idphoto_download')}
                </button>
                <button
                    onClick={onEditInEditor}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all text-sm border border-gray-600 active:scale-95"
                >
                    <EditIcon className="w-4 h-4" />
                    {t('start.idphoto_edit')}
                </button>
            </div>
        </div>
    );
};

export default PortraitResult;
