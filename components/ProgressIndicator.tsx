/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Progress indicator component for generation processes.
 */

import React from 'react';
import BloomFlowerLoader from './BloomFlowerLoader';
import { useLanguage } from '../contexts/LanguageContext';

interface ProgressIndicatorProps {
  progress?: number;
  statusMessages?: string[];
  currentStatusIndex?: number;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  statusMessages,
  currentStatusIndex = 0,
  className = '',
}) => {
  const { t } = useLanguage();

  return (
    <div className={`flex flex-col items-center gap-4 w-full max-w-md animate-fade-in bg-gray-800/40 p-8 rounded-xl border border-gray-700/50 backdrop-blur-sm ${className}`}>
      <div className="relative">
        <BloomFlowerLoader size={80} />
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-300">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
      {statusMessages && statusMessages.length > 0 && (
        <div className="space-y-2 text-center">
          <p className="text-lg font-bold text-gray-100">
            {t(statusMessages[currentStatusIndex] || statusMessages[0])}
          </p>
          {progress !== undefined && (
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
