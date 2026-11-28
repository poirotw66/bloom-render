import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TRYON_MATERIALS, type TryOnMaterial } from '../../constants/tryOnMaterials';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TryOnReferenceRole } from '../../types/tryOnRecipe';
import { groupMaterials } from '../../constants/materialGroups';
import MaterialGroupCard from '../../components/MaterialGroupCard';
import { recordMaterialUse, useMaterialPreferences } from '../../utils/materialPreferences';
import MaterialViewer from '../../components/MaterialViewer';
import PoseVariantControls from '../../components/PoseVariantControls';
import {
  MaterialCollectionFilters,
  MaterialFavoriteButton,
  type MaterialCollection,
} from '../../components/MaterialPreferenceControls';
import { getPoseSearchText, matchesPoseFilters } from '../../constants/poseMetadata.mjs';
import { PoseMaterialFilters, type PoseFilterValues } from '../../components/PoseMaterialFields';
import ClothingMaterialFilter from '../../components/ClothingMaterialFilter';
import {
  getClothingSearchText,
  matchesClothingCategory,
} from '../../constants/clothingMetadata.mjs';
import { matchesMaterialSearch } from '../../constants/materialSearch.mjs';

export const REFERENCE_ROLE_LABELS: Record<TryOnReferenceRole, [string, string]> = {
  clothing: ['Clothing', '服裝'],
  pose: ['Pose', '姿勢'],
  expression: ['Expression', '表情'],
  scene: ['Scene', '場景'],
  lighting: ['Lighting', '光線'],
};

interface TryOnMaterialPickerProps {
  selectedIds: string[];
  initialRole?: TryOnReferenceRole | 'all';
  canAddClothing: boolean;
  disabled?: boolean;
  onSelect: (material: TryOnMaterial) => Promise<void | boolean>;
  onRemove: (id: string) => void;
}

export default function TryOnMaterialPicker({
  selectedIds,
  initialRole = 'all',
  canAddClothing,
  disabled = false,
  onSelect,
  onRemove,
}: TryOnMaterialPickerProps) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const [role, setRole] = useState<TryOnReferenceRole | 'all'>(initialRole);
  const [search, setSearch] = useState('');
  const [clothingCategory, setClothingCategory] = useState('');
  const preferences = useMaterialPreferences();
  const previousSelected = useRef(selectedIds);
  useEffect(() => {
    for (const id of selectedIds) if (!previousSelected.current.includes(id)) recordMaterialUse(id);
    previousSelected.current = selectedIds;
  }, [selectedIds]);
  const [collection, setCollection] = useState<MaterialCollection>('all');
  const [viewer, setViewer] = useState<TryOnMaterial | null>(null);
  const [viewerTracksSelection, setViewerTracksSelection] = useState(false);
  const selectedPose = TRYON_MATERIALS.find(
    (material) => material.role === 'pose' && selectedIds.includes(material.id),
  );
  useEffect(() => {
    if (viewerTracksSelection && selectedPose) setViewer(selectedPose);
  }, [viewerTracksSelection, selectedPose]);
  const [poseFilters, setPoseFilters] = useState<PoseFilterValues>({ posture: '', view: '' });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roles = [...new Set(TRYON_MATERIALS.map((material) => material.role))];
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
      (role !== 'clothing' || matchesClothingCategory(material, clothingCategory)) &&
      matchesMaterialSearch(search, [
        material.title,
        material.titleZh,
        material.description,
        material.descriptionZh,
        getPoseSearchText(material),
        getClothingSearchText(material),
      ]),
  );

  const select = async (material: TryOnMaterial) => {
    setError(null);
    if (selectedIds.includes(material.id)) {
      onRemove(material.id);
      return;
    }
    setPendingId(material.id);
    try {
      const applied = await onSelect(material);
      if (applied === false)
        setError(
          zh ? '素材無法載入，請再試一次。' : 'Could not load this reference. Please try again.',
        );
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
      {viewer && (
        <MaterialViewer
          material={viewer}
          onClose={() => {
            setViewer(null);
            setViewerTracksSelection(false);
          }}
          onMaterialChange={(next) => {
            if (viewerTracksSelection) void select(next);
            else {
              recordMaterialUse(next.id);
              setViewer(next);
            }
          }}
          onRecommendationPreview={(next) => {
            setViewerTracksSelection(false);
            recordMaterialUse(next.id);
            setViewer(next);
          }}
          disabled={disabled || pendingId !== null}
          selectionError={error}
          selectionHint={
            viewerTracksSelection
              ? zh
                ? '切換版本會更新目前選取的姿勢參考圖。'
                : 'Changing a variant updates the selected pose reference.'
              : zh
                ? '目前僅檢視素材；關閉後可在素材庫選取參考圖。'
                : 'Preview only. Close the viewer to select a reference in the library.'
          }
        />
      )}
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
              setClothingCategory('');
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
      {role === 'clothing' && (
        <ClothingMaterialFilter value={clothingCategory} onChange={setClothingCategory} />
      )}
      {selectedPose && (
        <div className="tryon-selected-pose" data-testid="selected-pose-variants">
          <p className="tryon-hint">{zh ? '目前選取的姿勢參考' : 'Selected pose reference'}</p>
          <PoseVariantControls
            material={selectedPose}
            onChange={(next) => void select(next)}
            disabled={disabled || pendingId !== null}
          />
        </div>
      )}
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
      <p className="material-browser-count" role="status">
        {zh
          ? `${groupMaterials(materials).length} 組素材`
          : `${groupMaterials(materials).length} references`}
      </p>
      <div className="material-browser-grid material-browser-grid--picker">
        {groupMaterials(materials).map((group) => (
          <MaterialGroupCard
            key={group.id}
            group={group}
            selectedIds={selectedIds}
            onPreview={(material) => {
              recordMaterialUse(material.id);
              setViewerTracksSelection(selectedIds.includes(material.id));
              setViewer(material);
            }}
          >
            {(material) => {
              const selected = selectedIds.includes(material.id);
              const title = zh ? material.titleZh : material.title;
              const full = material.role === 'clothing' && !canAddClothing && !selected;
              return (
                <>
                  <button
                    type="button"
                    data-testid={`tryon-material-${material.id}`}
                    disabled={disabled || pendingId !== null || full}
                    aria-label={`${selected ? (zh ? '移除' : 'Remove') : zh ? '選擇' : 'Select'} ${title}`}
                    aria-pressed={selected}
                    aria-busy={pendingId === material.id}
                    onClick={() => void select(material)}
                    className={`tool-button ${selected ? 'tool-button-secondary' : 'tool-button-primary'}`}
                  >
                    {pendingId === material.id
                      ? zh
                        ? '載入中'
                        : 'Loading'
                      : selected
                        ? zh
                          ? '移除素材'
                          : 'Remove reference'
                        : zh
                          ? '選用素材'
                          : 'Select reference'}
                  </button>
                  <MaterialFavoriteButton id={material.id} title={title} />
                  <Link
                    to={`/materials/${material.id}`}
                    onClick={() => recordMaterialUse(material.id)}
                    className="tool-button tool-button-secondary"
                    aria-label={zh ? `${title} 素材詳情` : `${title} details`}
                  >
                    {zh ? '素材詳情' : 'Details'}
                  </Link>
                </>
              );
            }}
          </MaterialGroupCard>
        ))}
      </div>
      {materials.length === 0 && (
        <div className="space-y-3">
          <p className="tryon-hint">{zh ? '沒有符合的素材。' : 'No matching references.'}</p>
          <button
            type="button"
            className="tool-button tool-button-secondary"
            onClick={() => {
              setSearch('');
              setCollection('all');
              setClothingCategory('');
              setPoseFilters({ posture: '', view: '' });
            }}
          >
            {zh ? '清除篩選' : 'Clear filters'}
          </button>
        </div>
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
