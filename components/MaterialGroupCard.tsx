import React, { useState } from 'react';
import type { MaterialGroup } from '../constants/materialGroups';
import type { TryOnMaterial } from '../constants/tryOnMaterials';
import { getPoseMetadataLabel } from '../constants/poseMetadata.mjs';
import { getPoseRepresentationLabel } from '../constants/poseReferences.mjs';
import { useLanguage } from '../contexts/LanguageContext';
import { publicAssetUrl } from '../utils/publicAsset';
import '../styles/material-browser.css';

interface Props {
  group: MaterialGroup;
  selectedIds?: readonly string[];
  children: (material: TryOnMaterial) => React.ReactNode;
  onPreview: (material: TryOnMaterial) => void;
}

export default function MaterialGroupCard({ group, selectedIds = [], children, onPreview }: Props) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const [variantId, setVariantId] = useState<string>();
  const material =
    group.materials.find((item) => item.id === variantId) ??
    group.materials.find((item) => selectedIds.includes(item.id)) ??
    group.materials.find((item) => item.poseReference?.representation === 'lineart') ??
    group.materials[0];
  const title = zh ? material.titleZh : material.title;
  const views = [...new Set(group.materials.map((item) => item.pose?.view).filter(Boolean))];
  const representations = group.materials.filter((item) => item.pose?.view === material.pose?.view);
  const selected = selectedIds.includes(material.id);
  return (
    <article
      className={`material-group-card${selected ? ' material-group-card--selected' : ''}`}
      data-material-group={group.id}
    >
      <div className="material-group-card__heading">
        <h2>{zh ? group.titleZh : group.title}</h2>
        {views.length > 1 && <span>{zh ? `${views.length} 個視角` : `${views.length} views`}</span>}
      </div>
      <button
        type="button"
        className="material-group-card__visual"
        onClick={() => onPreview(material)}
        aria-label={`${zh ? '檢視大圖' : 'View image'} ${title}`}
      >
        <img
          src={publicAssetUrl(material.image)}
          alt={title}
          loading="lazy"
          decoding="async"
          width="600"
          height="800"
        />
        {selected && (
          <span className="material-group-card__selected">{zh ? '已選取' : 'Selected'}</span>
        )}
      </button>
      {views.length > 1 && (
        <div
          className="material-group-card__views"
          role="group"
          aria-label={`${zh ? group.titleZh : group.title} ${zh ? '拍攝視角' : 'views'}`}
        >
          {views.map((view) => (
            <button
              type="button"
              key={view}
              aria-pressed={material.pose?.view === view}
              className="tool-button tool-button-secondary"
              onClick={() => {
                const next =
                  group.materials.find(
                    (item) =>
                      item.pose?.view === view &&
                      item.poseReference?.representation === material.poseReference?.representation,
                  ) ?? group.materials.find((item) => item.pose?.view === view);
                if (next) setVariantId(next.id);
              }}
            >
              {getPoseMetadataLabel('view', view!, language)}
            </button>
          ))}
        </div>
      )}
      {representations.length > 1 && material.poseReference && (
        <details className="material-group-card__advanced">
          <summary>{zh ? '進階參考圖' : 'Advanced reference'}</summary>
          <label>
            <span>{zh ? '參考圖形式' : 'Reference representation'}</span>
            <select
              className="tool-control"
              value={material.id}
              onChange={(event) => setVariantId(event.target.value)}
            >
              {representations.map((item) => (
                <option key={item.id} value={item.id}>
                  {getPoseRepresentationLabel(item.poseReference!.representation, language)}
                </option>
              ))}
            </select>
          </label>
        </details>
      )}
      <div className="material-group-card__actions">{children(material)}</div>
    </article>
  );
}
