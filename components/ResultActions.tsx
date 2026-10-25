/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Shared download / share controls for generation results.
 */

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { downloadImageAs, type ImageExportFormat, withExtension } from '../utils/imageExport';
import { shareBrandedCard, shareResultImage, type ShareOutcome } from '../utils/shareResult';
import { UI_BTN_SECONDARY, UI_BTN_SUCCESS } from '../utils/uiClasses';
import { logger } from '../utils/logger';
import LocalEnhanceActions from './LocalEnhanceActions';
import { peekPendingRemix } from '../utils/pendingRemix';
import { buildRemixUrl } from '../utils/remixLink';
import { getViralTemplateCardById } from '../constants/viralTemplateCards';

interface ResultActionsProps {
  result: string | Blob;
  originalUrl?: string | null;
  fileBaseName?: string;
  className?: string;
  extraActions?: React.ReactNode;
  /** Replace the displayed result after in-browser remove-bg / upscale. */
  onEnhanced?: (dataUrl: string) => void;
  /** Hide local enhance buttons (e.g. when the parent page owns them). */
  hideLocalEnhance?: boolean;
  /** Optional remix URL for “用同款” + share-card QR. */
  remixUrl?: string;
}

const FORMATS: ImageExportFormat[] = ['png', 'jpeg', 'webp'];

function outcomeMessageKey(outcome: ShareOutcome): string {
  if (outcome === 'shared') return 'result.share_ok_shared';
  if (outcome === 'clipboard') return 'result.share_ok_clipboard';
  return 'result.share_ok_downloaded';
}

function resolveRemixUrl(explicit?: string): string | undefined {
  if (explicit) return explicit;
  const pending = peekPendingRemix();
  if (!pending) return undefined;
  if ('id' in pending) {
    const card = getViralTemplateCardById(pending.id);
    if (card) return buildRemixUrl({ v: 1, id: card.id });
  }
  try {
    return buildRemixUrl(pending);
  } catch {
    return undefined;
  }
}

const ResultActions: React.FC<ResultActionsProps> = ({
  result,
  originalUrl,
  fileBaseName = 'bloomrender-result',
  className = '',
  extraActions,
  onEnhanced,
  hideLocalEnhance = false,
  remixUrl: remixUrlProp,
}) => {
  const { t } = useLanguage();
  const [format, setFormat] = useState<ImageExportFormat>('png');
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const remixUrl = resolveRemixUrl(remixUrlProp);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setStatus(null);
    try {
      await fn();
    } catch (err) {
      logger.error('Result action failed:', err);
      setStatus(t('result.action_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-3 w-full ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-300">
        <label htmlFor="result-download-format" className="flex items-center gap-2">
          <span className="text-xs tracking-normal text-gray-500">
            {t('result.download_format')}
          </span>
          <select
            id="result-download-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as ImageExportFormat)}
            className="bg-gray-900 border border-gray-600 rounded-lg px-2 py-1 text-white"
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        {format !== 'png' && (
          <label className="flex items-center gap-2">
            <span className="text-xs tracking-normal text-gray-500">
              {t('result.download_quality')}
            </span>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.02}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              aria-label={t('result.download_quality')}
            />
            <span className="tabular-nums w-10 text-xs">{Math.round(quality * 100)}%</span>
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          disabled={busy}
          className={UI_BTN_SUCCESS}
          onClick={() =>
            run(async () => {
              await downloadImageAs(result, fileBaseName, format, quality);
              setStatus(t('result.download_ok'));
            })
          }
        >
          {t('result.download')}
        </button>

        <button
          type="button"
          disabled={busy}
          className={UI_BTN_SECONDARY}
          onClick={() =>
            run(async () => {
              const outcome = await shareResultImage({
                source: result,
                fileName: withExtension(fileBaseName, 'png'),
                title: 'BloomRender',
              });
              setStatus(t(outcomeMessageKey(outcome)));
            })
          }
        >
          {t('result.share')}
        </button>

        <button
          type="button"
          disabled={busy}
          className={UI_BTN_SECONDARY}
          onClick={() =>
            run(async () => {
              const outcome = await shareBrandedCard({
                result,
                before: originalUrl,
                aspect: '1:1',
                fileName: `${fileBaseName}-card-1x1.png`,
                remixUrl,
              });
              setStatus(t(outcomeMessageKey(outcome)));
            })
          }
        >
          {t('result.share_card_square')}
        </button>

        <button
          type="button"
          disabled={busy}
          className={UI_BTN_SECONDARY}
          onClick={() =>
            run(async () => {
              const outcome = await shareBrandedCard({
                result,
                before: originalUrl,
                aspect: '9:16',
                fileName: `${fileBaseName}-card-9x16.png`,
                remixUrl,
              });
              setStatus(t(outcomeMessageKey(outcome)));
            })
          }
        >
          {t('result.share_card_story')}
        </button>

        {remixUrl && (
          <button
            type="button"
            disabled={busy}
            data-testid="use-this-style"
            className={UI_BTN_SECONDARY}
            onClick={() =>
              run(async () => {
                try {
                  await navigator.clipboard.writeText(remixUrl);
                  setStatus(t('viral.remix_copied'));
                } catch {
                  window.prompt(t('viral.copy_link'), remixUrl);
                }
              })
            }
          >
            {t('viral.use_this_style')}
          </button>
        )}

        {extraActions}
      </div>

      {!hideLocalEnhance && (
        <LocalEnhanceActions
          result={result}
          fileBaseName={fileBaseName}
          onEnhanced={onEnhanced}
          disabled={busy}
        />
      )}

      {status && (
        <p className="text-xs text-gray-400" role="status">
          {status}
        </p>
      )}
    </div>
  );
};

export default ResultActions;
