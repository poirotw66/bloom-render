import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CLOTHING_CATEGORIES, getClothingCategoryLabel } from '../constants/clothingMetadata.mjs';
import '../styles/pose-material-fields.css';

export default function ClothingMaterialFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  return (
    <label className="clothing-material-filter">
      <span>{zh ? '服裝分類' : 'Clothing category'}</span>
      <select
        className="tool-control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{zh ? '全部服裝' : 'All clothing'}</option>
        {CLOTHING_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {getClothingCategoryLabel(category, language)}
          </option>
        ))}
      </select>
    </label>
  );
}
