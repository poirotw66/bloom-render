import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TRYON_MATERIALS, type TryOnMaterial } from '../../constants/tryOnMaterials';
import { DEFAULT_TRYON_BACKGROUND, DEFAULT_TRYON_STYLE } from '../../constants/tryOn';
import { ROUTES } from '../../constants/routes';
import { useMaterialBasket } from '../../contexts/MaterialBasketContext';
import { materialBasketMessage } from '../../utils/materialBasket';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TryOnRecipe } from '../../types/tryOnRecipe';
import { publicAssetUrl } from '../../utils/publicAsset';
import {
  recordMaterialUse,
  setMaterialFavorites,
  useMaterialPreferences,
} from '../../utils/materialPreferences';
import MaterialViewer from '../../components/MaterialViewer';
import MaterialGroupCard from '../../components/MaterialGroupCard';
import { groupMaterials } from '../../constants/materialGroups';
import '../../styles/material-browser.css';
import '../../styles/material-batch.css';
import {
  pruneBatchSelection,
  toggleBatchSelection,
  selectVisibleMaterials,
} from '../../utils/posewearBatchSelection';
import PoseVariantControls from '../../components/PoseVariantControls';
import {
  MaterialCollectionFilters,
  MaterialFavoriteButton,
  type MaterialCollection,
} from '../../components/MaterialPreferenceControls';
import {
  getMaterialPrompt,
  getPoseSearchText,
  matchesPoseFilters,
} from '../../constants/poseMetadata.mjs';
import {
  PoseMaterialDetails,
  PoseMaterialFilters,
  type PoseFilterValues,
} from '../../components/PoseMaterialFields';
import {
  UI_BTN_PRIMARY,
  UI_BTN_SECONDARY,
  UI_INPUT,
  UI_PAGE,
  UI_TITLE,
} from '../../utils/uiClasses';

function recipeForMaterial(material: TryOnMaterial): TryOnRecipe {
  return {
    v: 1,
    kind: 'tryon',
    materialIds: [material.id],
    settings: {
      background: DEFAULT_TRYON_BACKGROUND,
      style: DEFAULT_TRYON_STYLE,
      outputSize: '1K',
      aspectRatio: '9:16',
      quantity: 1,
      keepBackground: true,
      keepPose: true,
    },
  };
}

export default function MaterialsPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const basket = useMaterialBasket();
  const navigate = useNavigate();
  const zh = language === 'zh-TW';
  const [query, setQuery] = useState('');
  const preferences = useMaterialPreferences();
  const [collection, setCollection] = useState<MaterialCollection>('all');
  const [viewer, setViewer] = useState<TryOnMaterial | null>(null);
  const [role, setRole] = useState('all');
  const [batchMode, setBatchMode] = useState(false);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [poseFilters, setPoseFilters] = useState<PoseFilterValues>({ posture: '', view: '' });
  const selected = id ? TRYON_MATERIALS.find((material) => material.id === id) : undefined;
  useEffect(() => {
    if (selected) recordMaterialUse(selected.id);
  }, [selected]);
  const pool =
    collection === 'recent'
      ? preferences.recentIds
          .map((recentId) => TRYON_MATERIALS.find((material) => material.id === recentId)!)
          .filter(Boolean)
      : TRYON_MATERIALS;
  const items = pool.filter(
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
        .includes(query.normalize('NFKC').trim().toLocaleLowerCase()),
  );
  const groups = groupMaterials(items);
  const faces = groups.map(
    (group) =>
      group.materials.find((material) => material.id === variants[group.id]) ??
      group.materials.find((material) => basket.materialIds.includes(material.id)) ??
      group.materials.find((material) => material.poseReference?.representation === 'lineart') ??
      group.materials[0],
  );
  const visibleKey = JSON.stringify(faces.map((material) => material.id));
  useEffect(() => {
    const visible: string[] = JSON.parse(visibleKey);
    setBatchIds((current) => {
      const next = pruneBatchSelection(current, visible);
      return next.length === current.length ? current : next;
    });
  }, [visibleKey]);
  const roles = [
    ['all', zh ? '全部素材' : 'All materials'],
    ['clothing', zh ? '服裝' : 'Clothing'],
    ['pose', zh ? '姿勢' : 'Pose'],
    ['lighting', zh ? '光線' : 'Lighting'],
  ];

  if (id && !selected) {
    return (
      <div className={`${UI_PAGE} space-y-5`}>
        <h1 className={UI_TITLE}>{zh ? '找不到這個素材' : 'Material not found'}</h1>
        <Link className={UI_BTN_SECONDARY} to={ROUTES.MATERIALS}>
          {zh ? '瀏覽素材' : 'Browse materials'}
        </Link>
      </div>
    );
  }

  return (
    <div className="material-browser">
      {viewer && (
        <MaterialViewer
          material={viewer}
          onClose={() => setViewer(null)}
          onMaterialChange={(next) => {
            recordMaterialUse(next.id);
            setViewer(next);
            if (selected) navigate(`${ROUTES.MATERIALS}/${next.id}`);
          }}
        />
      )}
      <header className="material-browser-header">
        {selected && (
          <Link
            to={ROUTES.MATERIALS}
            className="text-sm theme-ink-muted underline underline-offset-4"
          >
            {zh ? '所有參考素材' : 'All reference materials'}
          </Link>
        )}
        <h1 className="material-browser-title">
          {selected
            ? zh
              ? selected.titleZh
              : selected.title
            : zh
              ? '試穿參考素材'
              : 'Try-on reference materials'}
        </h1>
        <p className="material-browser-description">
          {selected
            ? zh
              ? selected.descriptionZh
              : selected.description
            : zh
              ? '挑選服裝、姿勢與光線，再用自己的照片試穿。'
              : 'Choose clothing, poses and lighting, then try them with your own photo.'}
        </p>
        <button type="button" className={UI_BTN_SECONDARY} onClick={basket.openBasket}>
          {zh ? '素材籃' : 'Material basket'} ({basket.materialIds.length})
        </button>
        <p role="status" className="material-browser-message">
          {materialBasketMessage(basket.message, zh)}
        </p>
      </header>

      {selected ? (
        <div className="grid gap-7 md:grid-cols-2 items-start">
          <div className="space-y-3">
            <PoseVariantControls
              material={selected}
              onChange={(next) => navigate(`${ROUTES.MATERIALS}/${next.id}`)}
            />
            <img
              src={publicAssetUrl(selected.image)}
              alt={zh ? selected.titleZh : selected.title}
              className="w-full max-h-[540px] object-contain rounded-xl theme-raised"
            />
            <div className="material-card-actions">
              <button
                type="button"
                className={UI_BTN_SECONDARY}
                onClick={() => {
                  recordMaterialUse(selected.id);
                  setViewer(selected);
                }}
              >
                {zh ? '檢視大圖' : 'View image'}
              </button>
              <MaterialFavoriteButton
                id={selected.id}
                title={zh ? selected.titleZh : selected.title}
              />
            </div>
          </div>
          <div className="space-y-5 min-w-0">
            <h2 className="text-lg font-semibold theme-ink">
              {zh ? '參考圖提示詞' : 'Reference prompt'}
            </h2>
            <p className="text-sm theme-ink-muted leading-relaxed">
              {getMaterialPrompt(selected, language)}
            </p>
            <PoseMaterialDetails material={selected} />
            <button
              type="button"
              className={UI_BTN_PRIMARY}
              onClick={() => {
                recordMaterialUse(selected.id);
                navigate(ROUTES.TRY_ON, { state: { tryOnRecipe: recipeForMaterial(selected) } });
              }}
            >
              {zh ? '套用到試穿' : 'Use in try-on'}
            </button>
            <button
              type="button"
              className={UI_BTN_SECONDARY}
              data-testid={`basket-add-${selected.id}`}
              aria-pressed={basket.materialIds.includes(selected.id)}
              onClick={() =>
                basket.materialIds.includes(selected.id)
                  ? basket.removeMaterial(selected.id)
                  : basket.addMaterial(selected.id)
              }
            >
              {basket.materialIds.includes(selected.id)
                ? zh
                  ? '從素材籃移除'
                  : 'Remove from basket'
                : zh
                  ? '加入素材籃'
                  : 'Add to basket'}
            </button>
            <p className="text-sm theme-ink-muted">
              {zh
                ? '套用後可繼續添加素材；生成前需上傳人物照與服裝。示意圖提供參考，成品依模型而異。'
                : 'Add more materials after applying. A person photo and clothing are required to generate. Illustrations guide the model; results vary.'}
            </p>
            <div className="text-sm theme-ink-muted space-y-2 border-t theme-border pt-4">
              <p>
                {zh
                  ? 'BloomRender 原創參考插圖，依 CC0 1.0 提供。'
                  : 'Original BloomRender reference illustration, provided under CC0 1.0.'}
              </p>
              <a
                href={selected.source}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {zh ? '查看素材來源' : 'View material source'}
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="material-browser-toolbar">
            <MaterialCollectionFilters value={collection} onChange={setCollection} />
            <label className="material-browser-search">
              {zh ? '搜尋素材' : 'Search materials'}
              <input
                className={`block mt-1 w-full ${UI_INPUT}`}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="material-browser-role">
              {zh ? '素材類型' : 'Material type'}
              <select
                className={`block mt-1 ${UI_INPUT}`}
                value={role}
                onChange={(event) => {
                  setRole(event.target.value);
                  setPoseFilters({ posture: '', view: '' });
                }}
              >
                {roles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {role === 'pose' && <PoseMaterialFilters value={poseFilters} onChange={setPoseFilters} />}
          <div className="material-batch" data-testid="material-batch-toolbar">
            <button
              type="button"
              className={UI_BTN_SECONDARY}
              aria-pressed={batchMode}
              onClick={() => {
                setBatchMode(!batchMode);
                setBatchIds([]);
              }}
            >
              {batchMode
                ? zh
                  ? '完成批次選取'
                  : 'Done selecting'
                : zh
                  ? '批次選取'
                  : 'Batch selection'}
            </button>
            {batchMode && (
              <>
                <span role="status">
                  {zh ? `已選 ${batchIds.length} 項` : `${batchIds.length} selected`}
                </span>
                <button
                  type="button"
                  className={UI_BTN_SECONDARY}
                  disabled={!faces.length}
                  onClick={() =>
                    setBatchIds(selectVisibleMaterials(faces.map((material) => material.id)))
                  }
                >
                  {zh ? '全選目前素材' : 'Select visible'}
                </button>
                <button
                  type="button"
                  className={UI_BTN_SECONDARY}
                  disabled={!batchIds.length}
                  onClick={() => setBatchIds([])}
                >
                  {zh ? '取消全選' : 'Deselect all'}
                </button>
                <button
                  type="button"
                  className={UI_BTN_SECONDARY}
                  disabled={!batchIds.length}
                  onClick={() => setMaterialFavorites(batchIds, true)}
                >
                  {zh ? '加入收藏' : 'Add favorites'}
                </button>
                <button
                  type="button"
                  className={UI_BTN_SECONDARY}
                  disabled={!batchIds.length}
                  onClick={() => setMaterialFavorites(batchIds, false)}
                >
                  {zh ? '移除收藏' : 'Remove favorites'}
                </button>
                <button
                  type="button"
                  className={UI_BTN_PRIMARY}
                  disabled={!batchIds.length}
                  onClick={() => {
                    if (basket.addMaterials(batchIds).ok) setBatchIds([]);
                  }}
                >
                  {zh ? '將所選加入素材籃' : 'Add selected to basket'}
                </button>
              </>
            )}
          </div>
          <p className="material-browser-count" role="status">
            {zh ? `${groups.length} 組素材` : `${groups.length} references`}
          </p>
          <div className="material-browser-grid">
            {groups.map((group, index) => (
              <MaterialGroupCard
                key={group.id}
                group={group}
                displayedMaterial={faces[index]}
                onVariantChange={(next) => {
                  setVariants((current) => ({ ...current, [group.id]: next.id }));
                  setBatchIds((current) =>
                    current.filter(
                      (value) => !group.materials.some((material) => material.id === value),
                    ),
                  );
                }}
                selectedIds={basket.materialIds}
                onPreview={(material) => {
                  recordMaterialUse(material.id);
                  setViewer(material);
                }}
              >
                {(material) =>
                  batchMode ? (
                    <button
                      type="button"
                      className="material-batch-pick"
                      data-testid={`material-batch-toggle-${material.id}`}
                      aria-pressed={batchIds.includes(material.id)}
                      aria-label={`${zh ? '選取' : 'Select'} ${zh ? material.titleZh : material.title}`}
                      onClick={() =>
                        setBatchIds((current) => toggleBatchSelection(current, material.id))
                      }
                    >
                      {batchIds.includes(material.id)
                        ? zh
                          ? '已選取'
                          : 'Selected'
                        : zh
                          ? '選取素材'
                          : 'Select material'}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={UI_BTN_PRIMARY}
                        data-testid={`basket-add-${material.id}`}
                        aria-pressed={basket.materialIds.includes(material.id)}
                        onClick={() =>
                          basket.materialIds.includes(material.id)
                            ? basket.removeMaterial(material.id)
                            : basket.addMaterial(material.id)
                        }
                      >
                        {basket.materialIds.includes(material.id)
                          ? zh
                            ? '從素材籃移除'
                            : 'Remove from basket'
                          : zh
                            ? '加入素材籃'
                            : 'Add to basket'}
                      </button>
                      <MaterialFavoriteButton
                        id={material.id}
                        title={zh ? material.titleZh : material.title}
                      />
                      <Link
                        className={UI_BTN_SECONDARY}
                        to={`${ROUTES.MATERIALS}/${material.id}`}
                        aria-label={`${zh ? material.titleZh : material.title} ${zh ? '素材詳情' : 'details'}`}
                      >
                        {zh ? '素材詳情' : 'Details'}
                      </Link>
                    </>
                  )
                }
              </MaterialGroupCard>
            ))}
          </div>
          {items.length === 0 && (
            <p role="status" className="theme-ink-muted">
              {zh ? '找不到符合條件的素材。' : 'No materials match your search.'}
            </p>
          )}
          <p className="text-sm theme-ink-muted">
            {zh
              ? '素材為 BloomRender 原創參考插圖，依 CC0 1.0 提供。'
              : 'Original reference illustrations by BloomRender, provided under CC0 1.0.'}
          </p>
        </>
      )}
    </div>
  );
}
