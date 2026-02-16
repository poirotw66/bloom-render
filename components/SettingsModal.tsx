/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useSettings, type ModelType } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

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
    const { t, language, setLanguage } = useLanguage();
    const { theme, setTheme } = useTheme();

    const [openSections, setOpenSections] = useState({
        theme: true,
        language: false,
        model: false,
        compression: false,
    });

    const toggleSection = (key: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className={`rounded-xl p-6 w-full max-w-md md:max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto ${
                theme === 'newyear'
                    ? 'bg-red-900/90 border border-red-700/50'
                    : theme === 'bloom'
                        ? 'bg-gray-800 border border-fuchsia-500/30'
                        : 'bg-gray-800 border border-gray-700'
            }`}>
                <button 
                    onClick={onClose}
                    className={`absolute top-4 right-4 transition-colors ${
                        theme === 'newyear'
                            ? 'text-red-400 hover:text-red-100'
                            : theme === 'bloom'
                                ? 'text-gray-400 hover:text-white'
                                : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className={`text-xl font-bold mb-6 ${
                    theme === 'newyear' ? 'text-red-50' : theme === 'bloom' ? 'text-white' : 'text-white'
                }`}>{t('settings.title')}</h2>

                <div className="space-y-4">
                    <div className={`border rounded-xl ${
                        theme === 'newyear' ? 'border-red-700/60 bg-red-900/30' : theme === 'bloom' ? 'border-fuchsia-500/20 bg-gray-900/40' : 'border-gray-700 bg-gray-900/40'
                    }`}>
                        <button
                            onClick={() => toggleSection('theme')}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                        >
                            <span className={`text-sm font-semibold ${
                                theme === 'newyear' ? 'text-red-50' : 'text-white'
                            }`}>
                                {t('settings.theme')}
                            </span>
                            <svg
                                className={`h-5 w-5 transition-transform ${openSections.theme ? 'rotate-180' : 'rotate-0'} ${
                                    theme === 'newyear' ? 'text-yellow-200' : 'text-gray-200'
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {openSections.theme && (
                            <div className="px-4 pb-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {([
                                        { id: 'bloom', label: t('theme.bloom') },
                                        { id: 'night', label: t('theme.night') },
                                        { id: 'newyear', label: t('theme.newyear') }
                                    ] as const).map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => setTheme(option.id)}
                                            className={`w-full rounded-lg border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-black ${
                                                option.id === theme
                                                    ? theme === 'newyear'
                                                        ? 'border-yellow-400/80 text-yellow-200 focus:ring-yellow-400'
                                                        : theme === 'bloom'
                                                            ? 'border-fuchsia-400 text-white focus:ring-fuchsia-400'
                                                            : 'border-cyan-400 text-white focus:ring-cyan-400'
                                                    : theme === 'newyear'
                                                        ? 'border-red-700/50 text-red-100 hover:border-yellow-300/60 hover:text-yellow-200'
                                                        : theme === 'bloom'
                                                            ? 'border-gray-700 text-gray-200 hover:border-fuchsia-300/60 hover:text-white'
                                                            : 'border-gray-700 text-gray-200 hover:border-cyan-300/60 hover:text-white'
                                            } ${
                                                option.id === 'night' ? 'bg-black/40' : 'bg-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{option.label}</span>
                                                {option.id === theme && (
                                                    <span className={`text-xs uppercase tracking-wide ${
                                                        theme === 'newyear' ? 'text-yellow-300' : 'text-cyan-300'
                                                    }`}>
                                                        {t('common.selected')}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`border rounded-xl ${
                        theme === 'newyear' ? 'border-red-700/60 bg-red-900/30' : theme === 'bloom' ? 'border-fuchsia-500/20 bg-gray-900/40' : 'border-gray-700 bg-gray-900/40'
                    }`}>
                        <button
                            onClick={() => toggleSection('language')}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                        >
                            <span className={`text-sm font-semibold ${
                                theme === 'newyear' ? 'text-red-50' : 'text-white'
                            }`}>
                                {t('settings.language')}
                            </span>
                            <svg
                                className={`h-5 w-5 transition-transform ${openSections.language ? 'rotate-180' : 'rotate-0'} ${
                                    theme === 'newyear' ? 'text-yellow-200' : 'text-gray-200'
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {openSections.language && (
                            <div className="px-4 pb-4">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setLanguage('en')}
                                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-black ${
                                            language === 'en'
                                                ? theme === 'newyear'
                                                    ? 'border-yellow-400/80 text-yellow-200 focus:ring-yellow-400'
                                                    : theme === 'bloom'
                                                        ? 'border-fuchsia-400 text-white focus:ring-fuchsia-400'
                                                        : 'border-cyan-400 text-white focus:ring-cyan-400'
                                                : theme === 'newyear'
                                                    ? 'border-red-700/50 text-red-100 hover:border-yellow-300/60 hover:text-yellow-200'
                                                    : theme === 'bloom'
                                                        ? 'border-gray-700 text-gray-200 hover:border-fuchsia-300/60 hover:text-white'
                                                        : 'border-gray-700 text-gray-200 hover:border-cyan-300/60 hover:text-white'
                                        }`}
                                    >
                                        {t('settings.language.en')}
                                    </button>
                                    <button
                                        onClick={() => setLanguage('zh-TW')}
                                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-black ${
                                            language === 'zh-TW'
                                                ? theme === 'newyear'
                                                    ? 'border-yellow-400/80 text-yellow-200 focus:ring-yellow-400'
                                                    : theme === 'bloom'
                                                        ? 'border-fuchsia-400 text-white focus:ring-fuchsia-400'
                                                        : 'border-cyan-400 text-white focus:ring-cyan-400'
                                                : theme === 'newyear'
                                                    ? 'border-red-700/50 text-red-100 hover:border-yellow-300/60 hover:text-yellow-200'
                                                    : theme === 'bloom'
                                                        ? 'border-gray-700 text-gray-200 hover:border-fuchsia-300/60 hover:text-white'
                                                        : 'border-gray-700 text-gray-200 hover:border-cyan-300/60 hover:text-white'
                                        }`}
                                    >
                                        {t('settings.language.zh')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`border rounded-xl ${
                        theme === 'newyear' ? 'border-red-700/60 bg-red-900/30' : theme === 'bloom' ? 'border-fuchsia-500/20 bg-gray-900/40' : 'border-gray-700 bg-gray-900/40'
                    }`}>
                        <button
                            onClick={() => toggleSection('model')}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                        >
                            <span className={`text-sm font-semibold ${
                                theme === 'newyear' ? 'text-red-50' : 'text-white'
                            }`}>
                                {t('settings.model')}
                            </span>
                            <svg
                                className={`h-5 w-5 transition-transform ${openSections.model ? 'rotate-180' : 'rotate-0'} ${
                                    theme === 'newyear' ? 'text-yellow-200' : 'text-gray-200'
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {openSections.model && (
                            <div className="px-4 pb-4 space-y-4">
                                <select
                                    value={model}
                                    onChange={(e) => setModel(e.target.value as ModelType)}
                                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:outline-none ${
                                        theme === 'newyear'
                                            ? 'bg-red-900/50 border-red-700/50 text-red-50 focus:ring-red-500'
                                            : theme === 'bloom'
                                                ? 'bg-gray-900 border-gray-600 text-white focus:ring-fuchsia-500'
                                                : 'bg-gray-900 border-gray-600 text-white focus:ring-blue-500'
                                    }`}
                                >
                                    <option value="gemini-2.5-flash-image">{t('settings.model.flash')}</option>
                                    <option value="gemini-3-pro-image-preview">{t('settings.model.pro')}</option>
                                </select>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${
                                        theme === 'newyear' ? 'text-red-200' : 'text-gray-300'
                                    }`}>
                                        {t('settings.api_key')}
                                    </label>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder={t('settings.api_key_placeholder')}
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:outline-none ${
                                            theme === 'newyear'
                                                ? 'bg-red-900/50 border-red-700/50 text-red-50 placeholder-red-300 focus:ring-red-500'
                                                : theme === 'bloom'
                                                    ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500 focus:ring-fuchsia-500'
                                                    : 'bg-gray-900 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500'
                                        }`}
                                    />
                                    <p className={`text-xs mt-2 ${
                                        theme === 'newyear' ? 'text-red-300' : 'text-gray-500'
                                    }`}>
                                        {t('settings.api_key_desc')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`border rounded-xl ${
                        theme === 'newyear' ? 'border-red-700/60 bg-red-900/30' : theme === 'bloom' ? 'border-fuchsia-500/20 bg-gray-900/40' : 'border-gray-700 bg-gray-900/40'
                    }`}>
                        <button
                            onClick={() => toggleSection('compression')}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                        >
                            <span className={`text-sm font-semibold ${
                                theme === 'newyear' ? 'text-red-50' : 'text-white'
                            }`}>
                                {t('settings.compression')}
                            </span>
                            <svg
                                className={`h-5 w-5 transition-transform ${openSections.compression ? 'rotate-180' : 'rotate-0'} ${
                                    theme === 'newyear' ? 'text-yellow-200' : 'text-gray-200'
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {openSections.compression && (
                            <div className="px-4 pb-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="enable-compression"
                                        checked={enableImageCompression}
                                        onChange={(e) => setEnableImageCompression(e.target.checked)}
                                        className={`mt-1 w-4 h-4 rounded focus:ring-2 ${
                                            theme === 'newyear'
                                                ? 'text-red-600 bg-red-900/50 border-red-700 focus:ring-red-500'
                                                : theme === 'bloom'
                                                    ? 'text-blue-600 bg-gray-900 border-gray-600 focus:ring-fuchsia-500'
                                                    : 'text-blue-600 bg-gray-900 border-gray-600 focus:ring-blue-500'
                                        }`}
                                    />
                                    <div className="flex-1">
                                        <label 
                                            htmlFor="enable-compression"
                                            className={`block text-sm font-medium mb-1 ${
                                                theme === 'newyear' ? 'text-red-200' : 'text-gray-300'
                                            }`}
                                        >
                                            {t('settings.compression.enable')}
                                        </label>
                                        <p className={`text-xs ${
                                            theme === 'newyear' ? 'text-red-300' : 'text-gray-500'
                                        }`}>
                                            {t('settings.compression.enable_desc')}
                                        </p>
                                    </div>
                                </div>

                                {enableImageCompression && (
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${
                                            theme === 'newyear' ? 'text-red-200' : 'text-gray-300'
                                        }`}>
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
                                            className={`w-full border rounded-lg p-3 focus:ring-2 focus:outline-none ${
                                                theme === 'newyear'
                                                    ? 'bg-red-900/50 border-red-700/50 text-red-50 focus:ring-red-500'
                                                    : theme === 'bloom'
                                                        ? 'bg-gray-900 border-gray-600 text-white focus:ring-fuchsia-500'
                                                        : 'bg-gray-900 border-gray-600 text-white focus:ring-blue-500'
                                            }`}
                                        />
                                        <p className={`text-xs mt-2 ${
                                            theme === 'newyear' ? 'text-red-300' : 'text-gray-500'
                                        }`}>
                                            {t('settings.compression.threshold_desc')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                            theme === 'newyear'
                                ? 'bg-red-800/50 hover:bg-red-700/50 text-red-100'
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    >
                        {t('settings.cancel')}
                    </button>
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                            theme === 'newyear'
                                ? 'bg-red-600 hover:bg-red-500 text-white'
                                : theme === 'bloom'
                                    ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                    >
                        {t('settings.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
