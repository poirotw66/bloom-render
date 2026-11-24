import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TRYON_MATERIALS, type TryOnMaterial } from '../../constants/tryOnMaterials';
import { DEFAULT_TRYON_BACKGROUND, DEFAULT_TRYON_STYLE } from '../../constants/tryOn';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TryOnRecipe } from '../../types/tryOnRecipe';
import { publicAssetUrl } from '../../utils/publicAsset';
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
  const navigate = useNavigate();
  const zh = language === 'zh-TW';
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const selected = id ? TRYON_MATERIALS.find((material) => material.id === id) : undefined;
  const items = TRYON_MATERIALS.filter(
    (material) =>
      (role === 'all' || material.role === role) &&
      [material.title, material.titleZh, material.description, material.descriptionZh]
        .join(' ')
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
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
      </header>

      {selected ? (
        <div className="grid gap-7 md:grid-cols-2 items-start">
          <img
            src={publicAssetUrl(selected.image)}
            alt={zh ? selected.titleZh : selected.title}
            className="w-full max-h-[540px] object-contain rounded-xl theme-raised"
          />
          <div className="space-y-5 min-w-0">
            <h2 className="text-lg font-semibold theme-ink">
              {zh ? '參考圖提示詞' : 'Reference prompt'}
            </h2>
            <p className="text-sm theme-ink-muted leading-relaxed">{selected.prompt}</p>
            <button
              type="button"
              className={UI_BTN_PRIMARY}
              onClick={() =>
                navigate(ROUTES.TRY_ON, { state: { tryOnRecipe: recipeForMaterial(selected) } })
              }
            >
              {zh ? '套用到試穿' : 'Use in try-on'}
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
                onChange={(event) => setRole(event.target.value)}
              >
                {roles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((material) => (
              <Link
                key={material.id}
                to={`${ROUTES.MATERIALS}/${material.id}`}
                className="group block rounded-xl border theme-border overflow-hidden theme-raised focus-visible:outline-2 focus-visible:outline-offset-4"
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
