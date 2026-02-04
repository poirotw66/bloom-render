/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Component for selecting output quantity (1-4 images).
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  max?: number;
  min?: number;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onChange,
  disabled = false,
  max = 4,
  min = 1,
}) => {
  const { t } = useLanguage();

  const quantities = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-300">
        {t('common.output_quantity')}
      </label>
      <div className="flex gap-2">
        {quantities.map((qty) => (
          <button
            key={qty}
            type="button"
            onClick={() => onChange(qty)}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              quantity === qty
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {qty}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuantitySelector;
