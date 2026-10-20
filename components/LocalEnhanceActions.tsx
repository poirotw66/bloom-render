/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Remove-background / 2× upscale actions that run entirely in the browser.
 */

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { removeBackground, upscale2x, type LocalEnhanceProgress } from '../services/localEnhance';
import { downloadImageAs } from '../utils/imageExport';
import { logger } from '../utils/logger';
import { UI_BTN_SECONDARY } from '../utils/uiClasses';

interface LocalEnhanceActionsProps {
  result: string | Blob;
  fileBaseName?: string;
  /** When set, replace the displayed result instead of only downloading. */
  onEnhanced?: (dataUrl: string) => void;
  disabled?: boolean;
}

const LocalEnhanceActions: React.FC<LocalEnhanceActionsProps> = ({
  result,
  fileBaseName = 'bloomrender-enhanced',
  onEnhanced,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<LocalEnhanceProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (task: 'remove-bg' | 'upscale-2x') => {
    setBusy(true);
    setError(null);
    setProgress({ percent: 0, statusKey: 'enhance.status_loading_model' });
    try {
      const onProgress = (p: LocalEnhanceProgress) => setProgress(p);
      const dataUrl =
        task === 'remove-bg'
          ? await removeBackground(result, onProgress)
          : await upscale2x(result, onProgress);
      if (onEnhanced) {
        onEnhanced(dataUrl);
      } else {
        await downloadImageAs(dataUrl, `${fileBaseName}-${task}`, 'png');
      }
      setProgress({ percent: 100, statusKey: 'enhance.status_done' });
    } catch (err) {
      logger.error('Local enhance failed:', err);
      setError(t('enhance.error_failed'));
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          disabled={disabled || busy}
          className={UI_BTN_SECONDARY}
          onClick={() => void run('remove-bg')}
        >
          {t('enhance.remove_bg')}
        </button>
        <button
          type="button"
          disabled={disabled || busy}
          className={UI_BTN_SECONDARY}
          onClick={() => void run('upscale-2x')}
        >
          {t('enhance.upscale_2x')}
        </button>
      </div>
      {busy && progress && (
        <p className="text-xs text-gray-400" role="status">
          {t(progress.statusKey)}
          {progress.percent > 0 ? ` · ${Math.round(progress.percent)}%` : ''}
          {progress.file ? ` · ${progress.file}` : ''}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      <p className="text-[11px] text-gray-500 text-center max-w-md">
        {t('enhance.no_api_key_hint')}
      </p>
    </div>
  );
};

export default LocalEnhanceActions;
