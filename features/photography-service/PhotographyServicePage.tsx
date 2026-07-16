/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { SparklesIcon, UserIcon, UsersIcon, GiftIcon } from '../../components/icons';
import {
  PHOTOGRAPHY_SERVICE_CATEGORIES,
  PHOTOGRAPHY_SERVICE_ITEMS,
} from '../../constants/photographyService';
import ServiceCard from './ServiceCard';
import { PhotographyServiceItem } from './types';
import { UI_CHIP_ACTIVE, UI_CHIP_INACTIVE, UI_SUBTITLE, UI_TITLE } from '../../utils/uiClasses';

const FEATURED_SERVICE_IDS = [
  'id-photo-natural',
  'premium-leader-corp',
  'themed-magazine',
  'promo-family-spring',
] as const;

const FEATURED_SERVICE_ICONS = {
  'id-photo-natural': UserIcon,
  'premium-leader-corp': SparklesIcon,
  'themed-magazine': GiftIcon,
  'promo-family-spring': UsersIcon,
} as const;

const PhotographyServicePage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    PHOTOGRAPHY_SERVICE_CATEGORIES[0].id,
  );

  const filteredItems = useMemo(() => {
    return PHOTOGRAPHY_SERVICE_ITEMS.filter((item) => item.categoryId === activeCategoryId);
  }, [activeCategoryId]);

  const featuredItems = useMemo(() => {
    return FEATURED_SERVICE_IDS.map((id) =>
      PHOTOGRAPHY_SERVICE_ITEMS.find((item) => item.id === id),
    ).filter((item): item is PhotographyServiceItem => Boolean(item));
  }, []);

  const showcaseItems = useMemo(() => {
    return PHOTOGRAPHY_SERVICE_CATEGORIES.slice(0, 4)
      .map((category) => ({
        category,
        item: PHOTOGRAPHY_SERVICE_ITEMS.find(
          (serviceItem) => serviceItem.categoryId === category.id,
        ),
      }))
      .filter(
        (
          entry,
        ): entry is {
          category: (typeof PHOTOGRAPHY_SERVICE_CATEGORIES)[number];
          item: PhotographyServiceItem;
        } => Boolean(entry.item),
      );
  }, []);

  const handleServiceClick = (item: PhotographyServiceItem) => {
    let path = item.targetRoute;
    if (item.queryParams) {
      const searchParams = new URLSearchParams(item.queryParams);
      path += `?${searchParams.toString()}`;
    }
    navigate(path);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8 animate-fade-in px-4 py-6 sm:px-0">
      <div className="text-center space-y-4">
        <h1 className={UI_TITLE}>
          {t('service.title_part1')}{' '}
          <span className="text-blue-400">{t('service.title_part2')}</span>
        </h1>
        <p className={UI_SUBTITLE}>{t('service.subtitle')}</p>
      </div>

      <section className="w-full p-6 md:p-8 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
              {t('service.featured.eyebrow')}
            </p>
            <h2 className="text-3xl font-extrabold text-white">{t('service.featured.title')}</h2>
            <p className="max-w-2xl text-gray-300">{t('service.featured.desc')}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-gray-200">
            <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5">
              {t('service.featured.quick_turnaround')}
            </span>
            <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5">
              {t('service.featured.multi_scene')}
            </span>
            <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5">
              {t('service.featured.ai_polish')}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {featuredItems.map((item) => {
            const Icon =
              FEATURED_SERVICE_ICONS[item.id as keyof typeof FEATURED_SERVICE_ICONS] ??
              SparklesIcon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleServiceClick(item)}
                className="text-left h-full rounded-2xl border border-white/10 bg-gray-950/40 hover:bg-gray-900/60 hover:border-blue-400/40 transition-all duration-200 p-5 flex flex-col gap-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-300 border border-blue-400/20 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  {item.badgeKey && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                      {t(item.badgeKey)}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">{t(item.nameKey)}</h3>
                  <p className="text-sm text-gray-400 line-clamp-3">{t(item.descriptionKey)}</p>
                </div>
                <div className="mt-auto flex items-end justify-between gap-3">
                  <div className="space-y-1">
                    {item.originalPrice && (
                      <p className="text-xs text-gray-500 line-through">{item.originalPrice}</p>
                    )}
                    <p className="text-lg font-bold text-amber-400">{item.priceRange}</p>
                  </div>
                  <span className="text-sm font-semibold text-blue-300">
                    {t(item.actionLabelKey)} →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Category Tabs */}
      <div className="w-full flex flex-wrap justify-center gap-2 mb-4">
        {PHOTOGRAPHY_SERVICE_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategoryId(category.id)}
            className={activeCategoryId === category.id ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE}
          >
            {t(category.labelKey)}
          </button>
        ))}
      </div>

      {/* Service Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <ServiceCard key={item.id} item={item} onClick={handleServiceClick} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-gray-500 italic">{t('service.empty_category')}</p>
          </div>
        )}
      </div>

      <section className="w-full mt-8 p-8 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-3xl border border-white/5">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-white">{t('service.showcase.title')}</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">{t('service.showcase.desc')}</p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {showcaseItems.map(({ category, item }) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveCategoryId(category.id);
                handleServiceClick(item);
              }}
              className="text-left rounded-2xl border border-white/10 bg-black/20 hover:bg-black/30 hover:border-white/20 transition-all duration-200 p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
                  {t(category.labelKey)}
                </span>
                {item.badgeKey && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-gray-200">
                    {t(item.badgeKey)}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white">{t(item.nameKey)}</h3>
              <p className="text-sm text-gray-400 line-clamp-3">{t(item.descriptionKey)}</p>
              <div className="mt-auto pt-2 flex items-center justify-between gap-3">
                <span className="text-amber-400 font-bold">{item.priceRange}</span>
                <span className="text-sm text-gray-200">{t('service.showcase.cta')}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PhotographyServicePage;
