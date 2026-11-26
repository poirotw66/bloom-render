import React from 'react';
import { TRYON_MATERIALS, type TryOnMaterial } from '../constants/tryOnMaterials';
import { getPoseMetadataLabel } from '../constants/poseMetadata.mjs';
import {
  getPairedPoseReference,
  getPoseAlternatives,
  getPoseRepresentationLabel,
} from '../constants/poseReferences.mjs';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/pose-material-fields.css';

interface Props {
  material: TryOnMaterial;
  onChange: (material: TryOnMaterial) => void;
  disabled?: boolean;
}

export default function PoseVariantControls({ material, onChange, disabled = false }: Props) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const alternatives = getPoseAlternatives(material, TRYON_MATERIALS) as TryOnMaterial[];
  const paired = getPairedPoseReference(material, TRYON_MATERIALS) as TryOnMaterial | null;
  if (alternatives.length < 2 && !paired) return null;
  return (
    <div
      className="pose-variant-controls"
      role="group"
      aria-label={zh ? '姿勢參考版本' : 'Pose reference variants'}
    >
      {alternatives.length > 1 && (
        <label className="pose-material-filter">
          <span>{zh ? '拍攝視角' : 'Pose view'}</span>
          <select
            className="tool-control"
            data-testid="pose-view-select"
            value={material.pose?.view}
            disabled={disabled}
            onChange={(event) => {
              const next = alternatives.find((item) => item.pose?.view === event.target.value);
              if (next && next.id !== material.id) onChange(next);
            }}
          >
            {alternatives.map((item) => (
              <option key={item.pose!.view} value={item.pose!.view}>
                {getPoseMetadataLabel('view', item.pose!.view, language)}
              </option>
            ))}
          </select>
        </label>
      )}
      {paired && material.poseReference && (
        <label className="pose-material-filter">
          <span>{zh ? '參考圖形式' : 'Reference representation'}</span>
          <select
            className="tool-control"
            data-testid="pose-representation-select"
            value={material.poseReference.representation}
            disabled={disabled}
            onChange={(event) => {
              if (event.target.value === paired.poseReference?.representation) onChange(paired);
            }}
          >
            {(['lineart', 'depth'] as const).map((representation) => (
              <option key={representation} value={representation}>
                {getPoseRepresentationLabel(representation, language)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
