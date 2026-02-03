/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PhotographyServiceItem } from './types';

interface ServiceCardProps {
    item: PhotographyServiceItem;
    onClick: (item: PhotographyServiceItem) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ item, onClick }) => {
    const { t } = useLanguage();

    return (
        <div
            className="group bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 flex flex-col gap-4 hover:bg-gray-700/40 hover:border-blue-500/50 transition-all duration-300 shadow-xl hover:shadow-blue-500/10 cursor-pointer"
            onClick={() => onClick(item)}
        >
            <div className="flex justify-between items-start gap-4">
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {t(item.nameKey)}
                </h3>
                {item.badgeKey && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-500/20">
                        {t(item.badgeKey)}
                    </span>
                )}
            </div>

            <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
                {t(item.descriptionKey)}
            </p>

            <div className="mt-auto pt-4 flex items-center justify-between">
                <div className="flex flex-col">
                    {item.originalPrice && (
                        <span className="text-xs text-gray-500 line-through">{item.originalPrice}</span>
                    )}
                    <span className="text-lg font-bold text-amber-400">{item.priceRange}</span>
                </div>

                <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all duration-200 group-hover:scale-105"
                >
                    {t(item.actionLabelKey)}
                </button>
            </div>
        </div>
    );
};

export default ServiceCard;
