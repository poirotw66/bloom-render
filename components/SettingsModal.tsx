/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { 
        apiKey, 
        setApiKey, 
        model, 
        setModel,
        enableImageCompression,
        setEnableImageCompression,
        compressionThresholdMB,
        setCompressionThresholdMB,
    } = useSettings();
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-xl font-bold text-white mb-6">{t('settings.title')}</h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('settings.model')}
                        </label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value as any)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="gemini-2.5-flash-image">{t('settings.model.flash')}</option>
                            <option value="gemini-3-pro-image-preview">{t('settings.model.pro')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('settings.api_key')}
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={t('settings.api_key_placeholder')}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-500"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            {t('settings.api_key_desc')}
                        </p>
                    </div>

                    <div className="border-t border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            {t('settings.compression')}
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="enable-compression"
                                    checked={enableImageCompression}
                                    onChange={(e) => setEnableImageCompression(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <label 
                                        htmlFor="enable-compression"
                                        className="block text-sm font-medium text-gray-300 mb-1"
                                    >
                                        {t('settings.compression.enable')}
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        {t('settings.compression.enable_desc')}
                                    </p>
                                </div>
                            </div>

                            {enableImageCompression && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {t('settings.compression.threshold')}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        step="0.5"
                                        value={compressionThresholdMB}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value);
                                            if (!isNaN(value) && value > 0) {
                                                setCompressionThresholdMB(value);
                                            }
                                        }}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        {t('settings.compression.threshold_desc')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                     <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                    >
                        {t('settings.cancel')}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                    >
                        {t('settings.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
