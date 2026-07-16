/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Component for selecting output quantity (1-4 images).
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { UI_LABEL, uiOption } from '../utils/uiClasses';

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
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
      <label className={UI_LABEL}>{t('common.output_quantity')}</label>
      <div className="flex justify-center gap-2">
        {quantities.map((qty) => (
          <button
            key={qty}
            type="button"
            onClick={() => onChange(qty)}
            disabled={disabled}
            className={uiOption(quantity === qty)}
          >
            {qty}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuantitySelector;
