import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMaterialPreferences } from '../utils/materialPreferences';

export type MaterialCollection = 'all' | 'favorites' | 'recent';
export function MaterialFavoriteButton({ id, title }: { id: string; title: string }) {
  const { language } = useLanguage();
  const preferences = useMaterialPreferences();
  const favorite = preferences.isFavorite(id);
  const zh = language === 'zh-TW';
  return (
    <button
      type="button"
      className="tool-button tool-button-secondary"
      data-testid={`favorite-material-${id}`}
      aria-pressed={favorite}
      aria-label={
        zh
          ? `${favorite ? '取消收藏' : '收藏'} ${title}`
          : `${favorite ? 'Remove' : 'Add'} ${title} ${favorite ? 'from' : 'to'} favorites`
      }
      onClick={() => preferences.toggleFavorite(id)}
    >
      {favorite ? (zh ? '已收藏' : 'Saved') : zh ? '收藏' : 'Favorite'}
    </button>
  );
}
export function MaterialCollectionFilters({
  value,
  onChange,
}: {
  value: MaterialCollection;
  onChange: (value: MaterialCollection) => void;
}) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const preferences = useMaterialPreferences();
  return (
    <div
      className="material-collection-controls"
      role="group"
      aria-label={zh ? '個人素材' : 'Your materials'}
    >
      <button
        type="button"
        className="tool-button tool-button-secondary"
        data-testid="materials-favorites-filter"
        aria-pressed={value === 'favorites'}
        onClick={() => onChange(value === 'favorites' ? 'all' : 'favorites')}
      >
        {zh ? '只看收藏' : 'Favorites only'}
      </button>
      <button
        type="button"
        className="tool-button tool-button-secondary"
        data-testid="materials-recent-filter"
        aria-pressed={value === 'recent'}
        onClick={() => onChange(value === 'recent' ? 'all' : 'recent')}
      >
        {zh ? '最近使用' : 'Recently used'}
      </button>
      {value === 'recent' && preferences.recentIds.length > 0 && (
        <button
          type="button"
          className="tool-button tool-button-secondary"
          onClick={preferences.clearRecent}
        >
          {zh ? '清除最近使用' : 'Clear recently used'}
        </button>
      )}
      {!preferences.storageAvailable && (
        <p role="status" className="text-sm theme-ink-muted">
          {zh
            ? '瀏覽器無法儲存，目前僅在此頁保留收藏與紀錄。'
            : 'Browser storage is unavailable. Favorites and recent references are kept for this session.'}
        </p>
      )}
    </div>
  );
}
