import React, { useEffect, useRef, useState } from 'react';
import type { TryOnMaterial } from '../constants/tryOnMaterials';
import { useLanguage } from '../contexts/LanguageContext';

export default function MaterialBoardExport({
  materials,
}: {
  materials: readonly TryOnMaterial[];
}) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const [status, setStatus] = useState<'idle' | 'exporting' | 'done' | 'error'>('idle');
  const request = useRef<AbortController | null>(null);
  const selection = materials.map((material) => material.id).join(',');
  useEffect(() => {
    setStatus('idle');
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [selection]);

  async function exportBoard() {
    if (!materials.length || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setStatus('exporting');
    try {
      const { renderMaterialBoard, downloadMaterialBoard } = await import('../utils/materialBoard');
      const style = getComputedStyle(document.documentElement);
      const color = (name: string, fallback: string) =>
        style.getPropertyValue(name).trim() || fallback;
      const blob = await renderMaterialBoard(materials, {
        language,
        colors: {
          background: color('--bg-main', '#1a1216'),
          surface: color('--bg-surface', '#241820'),
          ink: color('--ink', '#faf4f6'),
          muted: color('--ink-soft', '#e2cfd6'),
          accent: color('--brand-accent', '#f7a0bf'),
        },
        signal: controller.signal,
      });
      controller.signal.throwIfAborted();
      downloadMaterialBoard(blob);
      setStatus('done');
    } catch {
      if (!controller.signal.aborted) {
        controller.abort();
        setStatus('error');
      }
    } finally {
      if (request.current === controller) request.current = null;
    }
  }

  return (
    <div className="material-board-export">
      <button
        type="button"
        className="tool-button tool-button-secondary"
        data-testid="material-board-export"
        disabled={!materials.length || status === 'exporting'}
        aria-busy={status === 'exporting'}
        onClick={() => void exportBoard()}
      >
        {status === 'exporting'
          ? zh
            ? '正在匯出畫板…'
            : 'Exporting board…'
          : zh
            ? '匯出畫板 PNG'
            : 'Export board PNG'}
      </button>
      <p
        role={status === 'error' ? 'alert' : 'status'}
        className="material-basket-status"
        data-testid="material-board-status"
      >
        {status === 'error'
          ? zh
            ? '無法匯出完整畫板。請確認素材圖片可載入後重試。'
            : 'The complete board could not be exported. Check that every reference image loads and try again.'
          : status === 'done'
            ? zh
              ? '已匯出 PNG，包含參考圖編號、姿勢與來源。'
              : 'PNG exported with reference numbers, pose details and sources.'
            : status === 'exporting'
              ? zh
                ? '正在載入所有參考圖。關閉素材籃可取消匯出。'
                : 'Loading every reference. Close the basket to cancel.'
              : ''}
      </p>
    </div>
  );
}
