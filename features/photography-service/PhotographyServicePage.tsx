/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import StartTabNav from '../../components/StartTabNav';
import { PHOTOGRAPHY_SERVICE_CATEGORIES, PHOTOGRAPHY_SERVICE_ITEMS } from '../../constants/photographyService';
import ServiceCard from './ServiceCard';
import { PhotographyServiceItem } from './types';

const PhotographyServicePage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeCategoryId, setActiveCategoryId] = useState<string>(PHOTOGRAPHY_SERVICE_CATEGORIES[0].id);

    const filteredItems = useMemo(() => {
        return PHOTOGRAPHY_SERVICE_ITEMS.filter(item => item.categoryId === activeCategoryId);
    }, [activeCategoryId]);

    const handleServiceClick = (item: PhotographyServiceItem) => {
        let path = item.targetRoute;
        if (item.queryParams) {
            const searchParams = new URLSearchParams(item.queryParams);
            path += `?${searchParams.toString()}`;
        }
        navigate(path);
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8 animate-fade-in">
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl">
                    {t('service.title_part1')} <span className="text-blue-400">{t('service.title_part2')}</span>
                </h1>
                <p className="max-w-2xl mx-auto text-lg text-gray-400 md:text-xl">
                    {t('service.subtitle')}
                </p>
            </div>

            <StartTabNav currentTab="photography-service" navigate={navigate} />

            {/* Category Tabs */}
            <div className="w-full flex flex-wrap justify-center gap-2 mb-4">
                {PHOTOGRAPHY_SERVICE_CATEGORIES.map(category => (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategoryId(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border ${activeCategoryId === category.id
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
                            }`}
                    >
                        {t(category.labelKey)}
                    </button>
                ))}
            </div>

            {/* Service Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <ServiceCard
                            key={item.id}
                            item={item}
                            onClick={handleServiceClick}
                        />
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-gray-500 italic">{t('service.empty_category')}</p>
                    </div>
                )}
            </div>

            {/* Showcase Section (Optional/Placeholder) */}
            <div className="w-full mt-12 p-8 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-3xl border border-white/5 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{t('service.showcase.title')}</h2>
                <p className="text-gray-400 max-w-xl mx-auto mt-4">{t('service.showcase.desc')}</p>
            </div>
        </div>
    );
};

export default PhotographyServicePage;
