import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TRYON_MATERIALS, type TryOnMaterial } from '../../constants/tryOnMaterials';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TryOnReferenceRole } from '../../types/tryOnRecipe';
import { publicAssetUrl } from '../../utils/publicAsset';
import { recordMaterialUse, useMaterialPreferences } from '../../utils/materialPreferences';
import MaterialViewer from '../../components/MaterialViewer';
import {
  MaterialCollectionFilters,
  MaterialFavoriteButton,
  type MaterialCollection,
} from '../../components/MaterialPreferenceControls';
import { getPoseSearchText, matchesPoseFilters } from '../../constants/poseMetadata.mjs';
import { PoseMaterialFilters, type PoseFilterValues } from '../../components/PoseMaterialFields';

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
  const preferences = useMaterialPreferences();
  const previousSelected = useRef(selectedIds);
  useEffect(() => {
    for (const id of selectedIds) if (!previousSelected.current.includes(id)) recordMaterialUse(id);
    previousSelected.current = selectedIds;
  }, [selectedIds]);
  const [collection, setCollection] = useState<MaterialCollection>('all');
  const [viewer, setViewer] = useState<TryOnMaterial | null>(null);
  const [poseFilters, setPoseFilters] = useState<PoseFilterValues>({ posture: '', view: '' });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roles = [...new Set(TRYON_MATERIALS.map((material) => material.role))];
  const query = search.normalize('NFKC').trim().toLocaleLowerCase();
  const pool =
    collection === 'recent'
      ? preferences.recentIds
          .map((recentId) => TRYON_MATERIALS.find((material) => material.id === recentId)!)
          .filter(Boolean)
      : TRYON_MATERIALS;
  const materials = pool.filter(
    (material) =>
      (collection !== 'favorites' || preferences.favoriteIds.includes(material.id)) &&
      (role === 'all' || material.role === role) &&
      (role !== 'pose' || matchesPoseFilters(material, poseFilters)) &&
      [
        material.title,
        material.titleZh,
        material.description,
        material.descriptionZh,
        getPoseSearchText(material),
      ]
        .join(' ')
        .normalize('NFKC')
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
    <section className="tryon-library" aria-labelledby="tryon-materials-title">
      {viewer && <MaterialViewer material={viewer} onClose={() => setViewer(null)} />}
      <div className="tryon-library-toolbar">
        <h2 id="tryon-materials-title" className="tryon-library-title">
          {zh ? '參考素材' : 'Reference library'}
        </h2>
        <Link to="/materials" className="tool-button tool-button-secondary">
          {zh ? '瀏覽素材庫' : 'Browse library'}
        </Link>
      </div>
      <div
        className="tryon-library-filters"
        role="group"
        aria-label={zh ? '素材類型' : 'Reference type'}
      >
        {(['all', ...roles] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={role === value}
            onClick={() => {
              setRole(value);
              setPoseFilters({ posture: '', view: '' });
            }}
            className="tool-button tool-button-secondary"
          >
            {value === 'all' ? (zh ? '全部' : 'All') : REFERENCE_ROLE_LABELS[value][zh ? 1 : 0]}
          </button>
        ))}
      </div>
      <MaterialCollectionFilters value={collection} onChange={setCollection} />
      {role === 'pose' && <PoseMaterialFilters value={poseFilters} onChange={setPoseFilters} />}
      <label className="tryon-field tryon-material-search">
        <span>{zh ? '搜尋參考素材' : 'Search references'}</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={zh ? '搜尋服裝、姿勢或光線' : 'Search clothing, poses or lighting'}
          className="tool-control"
        />
      </label>
      <div className="tryon-material-grid">
        {materials.map((material) => {
          const selected = selectedIds.includes(material.id);
          const title = zh ? material.titleZh : material.title;
          const full = material.role === 'clothing' && !canAddClothing && !selected;
          return (
            <article key={material.id} className="tryon-material-card">
              <button
                type="button"
                data-testid={`tryon-material-${material.id}`}
                disabled={disabled || pendingId !== null || full}
                aria-label={`${selected ? (zh ? '移除' : 'Remove') : zh ? '選擇' : 'Select'} ${title}`}
                aria-pressed={selected}
                aria-busy={pendingId === material.id}
                onClick={() => void select(material)}
                className="tryon-material-button"
              >
                <img
                  src={publicAssetUrl(material.image)}
                  alt=""
                  loading="eager"
                  decoding="async"
                  width="600"
                  height="800"
                  className="tryon-material-image"
                />
                <span className="tryon-material-title">{title}</span>
                {selected && (
                  <span className="tryon-material-selected">{zh ? '已選' : 'Selected'}</span>
                )}
                {pendingId === material.id && (
                  <span className="sr-only">{zh ? '載入中' : 'Loading'}</span>
                )}
              </button>
              <div className="tryon-material-card-tools">
                <button
                  type="button"
                  className="tool-button tool-button-secondary"
                  aria-label={`${zh ? '檢視大圖' : 'View image'} ${title}`}
                  onClick={() => {
                    recordMaterialUse(material.id);
                    setViewer(material);
                  }}
                >
                  {zh ? '檢視大圖' : 'View image'}
                </button>
                <MaterialFavoriteButton id={material.id} title={title} />
              </div>
              <Link
                to={`/materials/${material.id}`}
                onClick={() => recordMaterialUse(material.id)}
                className="tryon-material-details"
                aria-label={zh ? `${title} 素材詳情` : `${title} details`}
              >
                {zh ? '素材詳情' : 'Details'}
              </Link>
            </article>
          );
        })}
      </div>
      {materials.length === 0 && (
        <p className="tryon-hint">{zh ? '沒有符合的素材。' : 'No matching references.'}</p>
      )}
      {!canAddClothing && (
        <p className="tryon-hint">
          {zh
            ? '服裝已達上限，請先移除一件再選擇。'
            : 'Clothing limit reached. Remove an item to choose another.'}
        </p>
      )}
      {error && (
        <p role="alert" className="tryon-error">
          {error}
        </p>
      )}
    </section>
  );
}
