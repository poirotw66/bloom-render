/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Batch processing progress component.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Spinner from './Spinner';

interface BatchProgressProps {
  completed: number;
  total: number;
  current: number;
  results: Array<{ file: File; result: string; index: number }>;
  errors: Array<{ file: File; error: Error; index: number }>;
  className?: string;
}

const BatchProgress: React.FC<BatchProgressProps> = ({
  completed,
  total,
  current,
  results,
  errors,
  className = '',
}) => {
  const { t } = useLanguage();

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = completed === total;

  return (
    <div className={`flex flex-col items-center gap-6 w-full max-w-2xl mx-auto p-8 bg-gray-800/40 rounded-xl border border-gray-700/50 backdrop-blur-sm ${className}`}>
      <div className="relative w-full">
        {/* Progress Bar */}
        <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out flex items-center justify-center"
            style={{ width: `${progress}%` }}
          >
            {progress > 10 && (
              <span className="text-xs font-bold text-white">{progress}%</span>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="text-center space-y-2">
        {!isComplete ? (
          <>
            <div className="flex items-center justify-center gap-3">
              <Spinner />
              <p className="text-xl font-bold text-gray-100">
                {t('batch.processing').replace('{current}', String(current)).replace('{total}', String(total))}
              </p>
            </div>
            <p className="text-sm text-gray-400">
              {t('batch.progress').replace('{completed}', String(completed)).replace('{total}', String(total))}
            </p>
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-green-400">
              {t('batch.completed')}
            </p>
            <p className="text-sm text-gray-400">
              {t('batch.summary')
                .replace('{success}', String(results.length))
                .replace('{failed}', String(errors.length))
                .replace('{total}', String(total))}
            </p>
          </>
        )}
      </div>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="w-full bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-sm font-medium text-green-400 mb-2">
            {t('batch.success_count').replace('{count}', String(results.length))}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {results.slice(0, 8).map((item, idx) => (
              <img
                key={idx}
                src={item.result}
                alt={`Result ${item.index + 1}`}
                className="w-full aspect-square object-cover rounded border border-green-500/30"
              />
            ))}
            {results.length > 8 && (
              <div className="aspect-square flex items-center justify-center bg-gray-700 rounded border border-gray-600 text-gray-400 text-xs">
                +{results.length - 8}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Errors Summary */}
      {errors.length > 0 && (
        <div className="w-full bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm font-medium text-red-400 mb-2">
            {t('batch.error_count').replace('{count}', String(errors.length))}
          </p>
          <div className="space-y-1">
            {errors.map((item, idx) => (
              <div key={idx} className="text-xs text-red-300">
                {t('batch.error_item')
                  .replace('{index}', String(item.index + 1))
                  .replace('{error}', item.error.message)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProgress;
