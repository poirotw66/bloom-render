import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import type { HistoryItem } from '../utils/historyDb';
import {
  buildHistoryReferenceTrace,
  type HistoryReferenceTrace,
} from '../utils/posewearHistoryReferences';
import { publicAssetUrl } from '../utils/publicAsset';
import ResultImage from './ResultImage';
import { confirmDiscardUnsavedWork } from '../hooks/useUnsavedWork';
import '../styles/history-result-viewer.css';

function ReferenceImage({ reference, alt }: { reference: HistoryReferenceTrace; alt: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!reference.blob) return;
    const ownedUrl = URL.createObjectURL(reference.blob);
    setUrl(ownedUrl);
    return () => URL.revokeObjectURL(ownedUrl);
  }, [reference.blob]);
  const src = reference.blob
    ? url
    : reference.catalogImage
      ? publicAssetUrl(reference.catalogImage)
      : undefined;
  return src ? <img src={src} alt={alt} /> : <span className="history-viewer-missing">—</span>;
}

interface Props {
  item: HistoryItem;
  onClose: () => void;
  onReferenceNavigate: () => void;
}

export default function HistoryResultViewer({ item, onClose, onReferenceNavigate }: Props) {
  const { language, t } = useLanguage();
  const zh = language === 'zh-TW';
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const references = useMemo(() => buildHistoryReferenceTrace(item), [item]);
  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  const roleLabels = zh
    ? {
        person: '原始人物',
        clothing: '服裝',
        pose: '姿勢',
        expression: '表情',
        scene: '場景',
        lighting: '光線',
        reference: '參考圖',
      }
    : {
        person: 'Original person',
        clothing: 'Clothing',
        pose: 'Pose',
        expression: 'Expression',
        scene: 'Scene',
        lighting: 'Lighting',
        reference: 'Reference',
      };
  const metadata = ['provider', 'model', 'prompt'].flatMap((key) => {
    const value =
      key === 'provider'
        ? (item.options?.imageProvider ?? item.options?.provider)
        : item.options?.[key];
    return typeof value === 'string' && value.trim() ? [{ key, value }] : [];
  });
  return createPortal(
    <dialog
      ref={dialogRef}
      className="history-result-viewer"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="history-viewer-header">
        <h2 id={titleId}>{zh ? '結果與參考圖' : 'Result and references'}</h2>
        <button type="button" onClick={onClose}>
          {zh ? '關閉' : 'Close'}
        </button>
      </header>
      <div className="history-viewer-content">
        <ResultImage
          resultUrl={item.url}
          originalUrl={item.sourceUrl}
          alt={zh ? '生成結果' : 'Generated result'}
          showDemoBadge={false}
          imageClassName="history-viewer-result-image"
        />
        <section aria-label={zh ? '使用的參考圖' : 'Input references'}>
          <h3>{zh ? '使用的參考圖' : 'Input references'}</h3>
          {(!item.sourceBlob && item.type !== 'generate') ||
          references.some((ref) => ref.source !== 'stored') ||
          references.length === 0 ? (
            <p className="history-viewer-note">
              {zh
                ? '這筆紀錄未完整保存所有原始輸入。缺少的圖片無法追溯。'
                : 'This record does not contain all original inputs. Missing images cannot be recovered.'}
            </p>
          ) : null}
          <ol className="history-reference-list" data-testid="history-reference-list">
            {references.map((reference) => (
              <li key={reference.slot} data-source={reference.source}>
                <ReferenceImage
                  reference={reference}
                  alt={`${roleLabels[reference.role]} ${reference.slot}`}
                />
                <div className="history-reference-caption">
                  <strong>
                    {zh ? '圖片' : 'Image'} {reference.slot} · {roleLabels[reference.role]}
                  </strong>
                  {reference.name && <span>{reference.name}</span>}
                  {reference.source === 'catalog' && (
                    <span>
                      {zh
                        ? '目前素材預覽（非原始輸入快照）'
                        : 'Current catalog preview (not the original input snapshot)'}
                    </span>
                  )}
                  {reference.source === 'missing' && (
                    <span>{zh ? '原始圖片未保存' : 'Original image not saved'}</span>
                  )}
                  {reference.materialId && (
                    <Link
                      to={`/materials/${reference.materialId}`}
                      onClick={(event) => {
                        if (
                          event.button !== 0 ||
                          event.metaKey ||
                          event.ctrlKey ||
                          event.shiftKey ||
                          event.altKey
                        )
                          return;
                        if (!confirmDiscardUnsavedWork(t('main.unsaved_confirm'))) {
                          event.preventDefault();
                          return;
                        }
                        onReferenceNavigate();
                      }}
                    >
                      {zh ? '開啟素材' : 'Open material'}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
        {metadata.length > 0 && (
          <dl className="history-viewer-metadata">
            {metadata.map(({ key, value }) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </dialog>,
    document.body,
  );
}
