/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    PORTRAIT_TYPES,
    PORTRAIT_OUTPUT_SPECS,
} from '../../constants/portrait';
import type { PortraitType, OutputSpec } from '../../types';

interface PortraitFormProps {
    portraitType: PortraitType;
    setPortraitType: (v: PortraitType) => void;
    portraitOutputSpec: OutputSpec;
    setPortraitOutputSpec: (v: OutputSpec) => void;
    disabled?: boolean;
}

const PortraitForm: React.FC<PortraitFormProps> = ({
    portraitType,
    setPortraitType,
    portraitOutputSpec,
    setPortraitOutputSpec,
    disabled = false,
}) => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col gap-4 w-full max-w-2xl animate-fade-in bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('portrait.label.type')}</label>
                <select
                    value={portraitType}
                    onChange={(e) => setPortraitType(e.target.value as PortraitType)}
                    disabled={disabled}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {PORTRAIT_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>{t(type.nameKey)}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('portrait.label.spec')}</label>
                <div className="flex flex-wrap gap-2">
                    {PORTRAIT_OUTPUT_SPECS.map((spec) => (
                        <button
                            key={spec.id}
                            onClick={() => setPortraitOutputSpec(spec.id)}
                            disabled={disabled}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${portraitOutputSpec === spec.id
                                ? 'bg-blue-600 text-white border border-blue-500'
                                : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {t(spec.nameKey)}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">{t('idphoto.model_recommendation')}</p>
        </div>
    );
};

export default PortraitForm;
