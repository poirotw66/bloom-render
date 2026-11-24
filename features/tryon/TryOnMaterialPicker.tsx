import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TRYON_MATERIALS, type TryOnMaterial } from '../../constants/tryOnMaterials';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TryOnReferenceRole } from '../../types/tryOnRecipe';
import { publicAssetUrl } from '../../utils/publicAsset';
import {
  UI_BTN_SECONDARY,
  UI_CHIP_ACTIVE,
  UI_CHIP_INACTIVE,
  UI_INPUT,
} from '../../utils/uiClasses';

export const REFERENCE_ROLE_LABELS: Record<TryOnReferenceRole, [string, string]> = {
  clothing: ['Clothing', '服裝'],
  pose: ['Pose', '姿勢'],
  expression: ['Expression', '表情'],
  scene: ['Scene', '場景'],
  lighting: ['Lighting', '光線'],
};

interface TryOnMaterialPickerProps {
  selectedIds: string[];
  canAddClothing: boolean;
  disabled?: boolean;
  onSelect: (material: TryOnMaterial) => Promise<void>;
  onRemove: (id: string) => void;
}

export default function TryOnMaterialPicker({
  selectedIds,
  canAddClothing,
  disabled = false,
  onSelect,
  onRemove,
}: TryOnMaterialPickerProps) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const [role, setRole] = useState<TryOnReferenceRole | 'all'>('all');
  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roles = [...new Set(TRYON_MATERIALS.map((material) => material.role))];
  const query = search.trim().toLocaleLowerCase();
  const materials = TRYON_MATERIALS.filter(
    (material) =>
      (role === 'all' || material.role === role) &&
      [material.title, material.titleZh, material.description, material.descriptionZh]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query),
  );

  const select = async (material: TryOnMaterial) => {
    setError(null);
    if (selectedIds.includes(material.id)) {
      onRemove(material.id);
      return;
    }
    setPendingId(material.id);
    try {
      await onSelect(material);
    } catch {
      setError(
        zh ? '素材無法載入，請再試一次。' : 'Could not load this reference. Please try again.',
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="space-y-4 min-w-0" aria-labelledby="tryon-materials-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="tryon-materials-title" className="text-lg font-semibold theme-ink">
          {zh ? '參考素材' : 'Reference library'}
        </h2>
        <Link to="/materials" className={`${UI_BTN_SECONDARY} min-h-11 text-sm`}>
          {zh ? '瀏覽素材庫' : 'Browse library'}
        </Link>
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={zh ? '素材類型' : 'Reference type'}
      >
        {(['all', ...roles] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={role === value}
            onClick={() => setRole(value)}
            className={`${role === value ? UI_CHIP_ACTIVE : UI_CHIP_INACTIVE} min-h-11`}
          >
            {value === 'all' ? (zh ? '全部' : 'All') : REFERENCE_ROLE_LABELS[value][zh ? 1 : 0]}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="sr-only">{zh ? '搜尋參考素材' : 'Search references'}</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={zh ? '搜尋服裝、姿勢或光線' : 'Search clothing, poses or lighting'}
          className={`${UI_INPUT} w-full min-h-11`}
        />
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {materials.map((material) => {
          const selected = selectedIds.includes(material.id);
          const title = zh ? material.titleZh : material.title;
          const full = material.role === 'clothing' && !canAddClothing && !selected;
          return (
            <article key={material.id} className="min-w-0 space-y-1">
              <button
                type="button"
                data-testid={`tryon-material-${material.id}`}
                disabled={disabled || pendingId !== null || full}
                aria-label={`${selected ? (zh ? '移除' : 'Remove') : zh ? '選擇' : 'Select'} ${title}`}
                aria-pressed={selected}
                aria-busy={pendingId === material.id}
                onClick={() => void select(material)}
                className={`group relative block w-full overflow-hidden rounded-xl border-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 disabled:opacity-50 disabled:cursor-not-allowed ${selected ? 'border-rose-400' : 'border-transparent hover:border-rose-300/60'}`}
              >
                <img
                  src={publicAssetUrl(material.image)}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-[3/4] object-cover transition-transform motion-safe:group-hover:scale-[1.02]"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gray-950/85 p-2.5 text-sm font-medium text-white">
                  {title}
                </span>
                {selected && (
                  <span className="absolute left-2 top-2 rounded-full bg-rose-600 px-2 py-1 text-xs font-semibold text-white">
                    {zh ? '已選' : 'Selected'}
                  </span>
                )}
                {pendingId === material.id && (
                  <span className="sr-only">{zh ? '載入中' : 'Loading'}</span>
                )}
              </button>
              <Link
                to={`/materials/${material.id}`}
                className="inline-flex min-h-11 items-center text-sm theme-ink-muted underline underline-offset-4 hover:theme-ink"
                aria-label={zh ? `${title} 素材詳情` : `${title} details`}
              >
                {zh ? '素材詳情' : 'Details'}
              </Link>
            </article>
          );
        })}
      </div>
      {materials.length === 0 && (
        <p className="text-sm theme-ink-muted">
          {zh ? '沒有符合的素材。' : 'No matching references.'}
        </p>
      )}
      {!canAddClothing && (
        <p className="text-sm theme-ink-muted">
          {zh
            ? '服裝已達上限，請先移除一件再選擇。'
            : 'Clothing limit reached. Remove an item to choose another.'}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      <p className="text-xs theme-ink-muted">
        {zh
          ? 'BloomRender 原創參考插圖 · CC0 1.0'
          : 'Original BloomRender reference illustrations · CC0 1.0'}
      </p>
    </section>
  );
}
