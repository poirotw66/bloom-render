/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SparklesIcon, UserIcon, UsersIcon, GiftIcon } from '../../components/icons';
import {
  PHOTOGRAPHY_SERVICE_CATEGORIES,
  PHOTOGRAPHY_SERVICE_ITEMS,
} from '../../constants/photographyService';
import ServiceCard from './ServiceCard';
import { PhotographyServiceItem } from './types';
import {
  UI_CHIP_ACTIVE,
  UI_CHIP_INACTIVE,
  UI_PAGE_WIDE,
  UI_SUBTITLE,
  UI_TITLE,
  getPageSurface,
  getTitleAccent,
} from '../../utils/uiClasses';

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
  const { theme } = useTheme();
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
    <div className={`${UI_PAGE_WIDE} ${getPageSurface(theme)} flex flex-col items-center gap-8`}>
      <div className="text-center space-y-4">
        <h1 className={UI_TITLE}>
          {t('service.title_part1')}{' '}
          <span className={getTitleAccent(theme)}>{t('service.title_part2')}</span>
        </h1>
        <p className={UI_SUBTITLE}>{t('service.subtitle')}</p>
      </div>

      <section className="w-full p-6 md:p-8 rounded-2xl border theme-border theme-raised">
        <div className="space-y-2 text-left md:text-left">
          <p className="text-sm font-semibold tracking-wide brand-text">
            {t('service.featured.eyebrow')}
          </p>
          <h2 className="text-2xl font-semibold theme-ink">{t('service.featured.title')}</h2>
          <p className="max-w-2xl theme-ink-muted">{t('service.featured.desc')}</p>
          <p className="max-w-2xl text-sm theme-ink-soft">
            {t('service.featured.quick_turnaround')}, {t('service.featured.multi_scene')},{' '}
            {t('service.featured.ai_polish')}
          </p>
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
                className="text-left h-full rounded-2xl border theme-border theme-raised hover:opacity-95 transition-opacity duration-200 p-5 flex flex-col gap-4 focus:outline-none focus-visible:ring-2 focus-visible:brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <Icon className="w-6 h-6 brand-text shrink-0" aria-hidden="true" />
                  {item.badgeKey && (
                    <span className="px-2 py-0.5 brand-bg text-white text-sm font-semibold tracking-wide rounded-md">
                      {t(item.badgeKey)}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold theme-ink">{t(item.nameKey)}</h3>
                  <p className="text-sm theme-ink-muted line-clamp-3">{t(item.descriptionKey)}</p>
                </div>
                <div className="mt-auto flex items-end justify-end">
                  <span className="text-sm font-semibold brand-text">
                    {t(item.actionLabelKey)} →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="w-full flex flex-wrap justify-center gap-2">
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

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <ServiceCard key={item.id} item={item} onClick={handleServiceClick} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="theme-ink-muted italic">{t('service.empty_category')}</p>
          </div>
        )}
      </div>

      <section className="w-full mt-2 p-6 md:p-8 rounded-2xl border theme-border theme-raised">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-semibold theme-ink">{t('service.showcase.title')}</h2>
          <p className="theme-ink-muted max-w-2xl mx-auto">{t('service.showcase.desc')}</p>
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
              className="text-left rounded-2xl border theme-border theme-raised hover:opacity-95 transition-opacity duration-200 p-5 flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-main)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold tracking-wide brand-text">
                  {t(category.labelKey)}
                </span>
                {item.badgeKey && (
                  <span className="px-2 py-0.5 rounded-md brand-bg text-white text-sm font-semibold">
                    {t(item.badgeKey)}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold theme-ink">{t(item.nameKey)}</h3>
              <p className="text-sm theme-ink-muted line-clamp-3">{t(item.descriptionKey)}</p>
              <div className="mt-auto pt-2 flex items-center justify-end">
                <span className="text-sm brand-text">{t('service.showcase.cta')}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PhotographyServicePage;
