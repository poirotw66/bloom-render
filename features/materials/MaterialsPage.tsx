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
import { recordMaterialUse, useMaterialPreferences } from '../../utils/materialPreferences';
import MaterialViewer from '../../components/MaterialViewer';
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
      keepBackground: false,
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
    <div className={`${UI_PAGE} space-y-7`}>
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
      <header className="space-y-3">
        {selected && (
          <Link
            to={ROUTES.MATERIALS}
            className="text-sm theme-ink-muted underline underline-offset-4"
          >
            {zh ? '所有參考素材' : 'All reference materials'}
          </Link>
        )}
        <h1 className={UI_TITLE}>
          {selected
            ? zh
              ? selected.titleZh
              : selected.title
            : zh
              ? '試穿參考素材'
              : 'Try-on reference materials'}
        </h1>
        <p className="theme-ink-muted max-w-2xl">
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
        <p role="status" className="text-sm theme-ink-muted">
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
          <MaterialCollectionFilters value={collection} onChange={setCollection} />
          <div className="flex flex-wrap gap-3">
            <label className="flex-1 min-w-0 text-sm theme-ink-muted">
              {zh ? '搜尋素材' : 'Search materials'}
              <input
                className={`block mt-1 w-full ${UI_INPUT}`}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="text-sm theme-ink-muted">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((material) => (
              <article
                key={material.id}
                className="rounded-xl border theme-border overflow-hidden theme-raised"
              >
                <Link
                  to={`${ROUTES.MATERIALS}/${material.id}`}
                  className="group block focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  <img
                    src={publicAssetUrl(material.image)}
                    alt={zh ? material.titleZh : material.title}
                    loading="lazy"
                    className="w-full aspect-[4/3] object-contain transition-transform group-hover:scale-[1.02]"
                  />
                  <h2 className="px-4 py-3 text-base font-semibold theme-ink">
                    {zh ? material.titleZh : material.title}
                  </h2>
                </Link>
                <div className="px-4 pb-4 material-card-actions">
                  <button
                    type="button"
                    className={UI_BTN_SECONDARY}
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
                  <button
                    type="button"
                    className={UI_BTN_SECONDARY}
                    aria-label={`${zh ? '檢視大圖' : 'View image'} ${zh ? material.titleZh : material.title}`}
                    onClick={() => {
                      recordMaterialUse(material.id);
                      setViewer(material);
                    }}
                  >
                    {zh ? '檢視大圖' : 'View image'}
                  </button>
                </div>
              </article>
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
