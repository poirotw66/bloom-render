import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { TRYON_MATERIALS, type TryOnMaterial } from '../constants/tryOnMaterials';
import { getPoseMetadataLabel, POSE_METADATA_FIELDS } from '../constants/poseMetadata.mjs';
import { getPoseRepresentationLabel } from '../constants/poseReferences.mjs';
import '../styles/pose-material-fields.css';

export interface PoseFilterValues {
  posture: string;
  view: string;
}

interface FilterProps {
  value: PoseFilterValues;
  onChange: (value: PoseFilterValues) => void;
}

export function PoseMaterialFilters({ value, onChange }: FilterProps) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  return (
    <div
      className="pose-material-filters"
      role="group"
      aria-label={zh ? '姿勢與視角篩選' : 'Pose and view filters'}
    >
      {(['posture', 'view'] as const).map((field) => (
        <label key={field} className="pose-material-filter">
          <span>{field === 'posture' ? (zh ? '姿態' : 'Posture') : zh ? '拍攝視角' : 'View'}</span>
          <select
            className="tool-control"
            data-testid={`pose-${field}-filter`}
            value={value[field]}
            onChange={(event) => onChange({ ...value, [field]: event.target.value })}
          >
            <option value="">{zh ? '全部' : 'All'}</option>
            {POSE_METADATA_FIELDS[field].map((option) => (
              <option key={option} value={option}>
                {getPoseMetadataLabel(field, option, language)}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

export function PoseMaterialDetails({ material }: { material: TryOnMaterial }) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  if (material.role !== 'pose' || !material.pose) return null;
  const fields = [
    ['groupId', zh ? '姿勢群組' : 'Pose group'],
    ['posture', zh ? '姿態' : 'Posture'],
    ['view', zh ? '拍攝視角' : 'View'],
    ['cameraHeight', zh ? '機位高度' : 'Camera height'],
    ['framing', zh ? '取景範圍' : 'Framing'],
  ] as const;
  const availableViews = [
    ...new Set(
      TRYON_MATERIALS.filter(
        (item) => item.role === 'pose' && item.pose?.groupId === material.pose!.groupId,
      ).map((item) => item.pose!.view),
    ),
  ];
  return (
    <dl className="pose-material-details" data-testid="pose-metadata">
      {fields.map(([field, label]) => (
        <div key={field}>
          <dt>{label}</dt>
          <dd>{getPoseMetadataLabel(field, material.pose![field], language)}</dd>
        </div>
      ))}
      {material.poseReference && (
        <div>
          <dt>{zh ? '參考圖形式' : 'Reference representation'}</dt>
          <dd>{getPoseRepresentationLabel(material.poseReference.representation, language)}</dd>
        </div>
      )}
      <div>
        <dt>{zh ? '現有視角' : 'Available views'}</dt>
        <dd>
          {availableViews
            .map((view) => getPoseMetadataLabel('view', view, language))
            .join(zh ? '、' : ', ')}
        </dd>
      </div>
    </dl>
  );
}
