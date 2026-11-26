import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TryOnMaterial } from '../constants/tryOnMaterials';
import { useLanguage } from '../contexts/LanguageContext';
import { publicAssetUrl } from '../utils/publicAsset';
import '../styles/material-viewer.css';

interface MaterialViewerProps {
  material: TryOnMaterial;
  onClose: () => void;
}
export default function MaterialViewer({ material, onClose }: MaterialViewerProps) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const titleId = useId();
  const [zoom, setZoom] = useState(1);
  const [mirror, setMirror] = useState(false);
  const [gray, setGray] = useState(false);
  const [grid, setGrid] = useState<'off' | 'thirds' | 'center'>('off');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>('loading');
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const reset = () => {
    setZoom(1);
    setMirror(false);
    setGray(false);
    setGrid('off');
    setPan({ x: 0, y: 0 });
  };
  useEffect(() => {
    reset();
    setImageState('loading');
  }, [material.id]);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  const measureImage = () => {
    if (!image.current) return;
    const { clientWidth: width, clientHeight: height } = image.current;
    setImageSize((current) =>
      current.width === width && current.height === height ? current : { width, height },
    );
  };
  useEffect(() => {
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measureImage) : null;
    if (stage.current) observer?.observe(stage.current);
    if (image.current) observer?.observe(image.current);
    window.addEventListener('resize', measureImage);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measureImage);
    };
  }, [material.id]);
  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) scaleX(${mirror ? -1 : 1})`;
  const changeZoom = (next: number) => {
    setZoom(next);
    setPan({ x: 0, y: 0 });
  };
  const cycleGrid = () =>
    setGrid((current) => (current === 'off' ? 'thirds' : current === 'thirds' ? 'center' : 'off'));
  return createPortal(
    <dialog
      ref={dialog}
      aria-label={zh ? '素材檢視台' : 'Material viewer'}
      aria-describedby={titleId}
      className="material-viewer"
      data-testid="material-viewer"
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onKeyDown={(event) => {
        if (
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          (event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')
        )
          return;
        const key = event.key.toLowerCase();
        if (!['z', 'h', 'g', 'b', '0'].includes(key)) return;
        event.preventDefault();
        event.stopPropagation();
        if (key === 'z') changeZoom(zoom === 3 ? 1 : zoom + 1);
        if (key === 'h') setMirror((current) => !current);
        if (key === 'g') cycleGrid();
        if (key === 'b') setGray((current) => !current);
        if (key === '0') reset();
      }}
    >
      <header className="material-viewer__heading">
        <h2 id={titleId}>{zh ? material.titleZh : material.title}</h2>
        <button type="button" className="tool-button tool-button-secondary" onClick={onClose}>
          {zh ? '關閉檢視台' : 'Close viewer'}
        </button>
      </header>
      <div
        ref={stage}
        className="material-viewer__stage"
        data-testid="material-viewer-stage"
        data-zoom={zoom}
        onDoubleClick={() => changeZoom(zoom === 1 ? 2 : 1)}
        onPointerDown={(event) => {
          if (zoom === 1 || event.button !== 0) return;
          drag.current = { x: event.clientX, y: event.clientY, startX: pan.x, startY: pan.y };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current || !stage.current) return;
          const { width, height } = stage.current.getBoundingClientRect();
          const maxX = Math.max(0, (imageSize.width * zoom - width) / 2);
          const maxY = Math.max(0, (imageSize.height * zoom - height) / 2);
          setPan({
            x: Math.max(
              -maxX,
              Math.min(maxX, drag.current.startX + event.clientX - drag.current.x),
            ),
            y: Math.max(
              -maxY,
              Math.min(maxY, drag.current.startY + event.clientY - drag.current.y),
            ),
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
      >
        <img
          key={material.id}
          ref={image}
          src={publicAssetUrl(material.image)}
          alt={zh ? material.titleZh : material.title}
          draggable={false}
          data-testid="material-viewer-image"
          onLoad={() => {
            measureImage();
            setImageState('ready');
          }}
          onError={() => setImageState('error')}
          style={{
            transform,
            filter: gray ? 'grayscale(1)' : undefined,
          }}
        />
        {grid !== 'off' && (
          <div
            aria-hidden="true"
            data-testid="material-viewer-grid"
            data-grid={grid}
            className={`material-viewer__grid material-viewer__grid--${grid}`}
            style={{
              width: imageSize.width,
              height: imageSize.height,
              marginLeft: -imageSize.width / 2,
              marginTop: -imageSize.height / 2,
              transform,
            }}
          />
        )}
        {imageState !== 'ready' && (
          <p className="material-viewer__status" role={imageState === 'error' ? 'alert' : 'status'}>
            {imageState === 'error'
              ? zh
                ? '圖片無法載入，請關閉後重試。'
                : 'Could not load this image. Close and try again.'
              : zh
                ? '圖片載入中'
                : 'Loading image'}
          </p>
        )}
      </div>
      <div
        className="material-viewer__tools"
        role="group"
        aria-label={zh ? '圖片檢視工具' : 'Image viewing tools'}
      >
        <button
          type="button"
          className="tool-button tool-button-secondary"
          disabled={zoom === 1}
          aria-label={zh ? '縮小圖片' : 'Zoom out'}
          onClick={() => changeZoom(zoom - 1)}
        >
          −
        </button>
        <output aria-label={zh ? '縮放倍率' : 'Zoom level'}>{zoom}×</output>
        <button
          type="button"
          className="tool-button tool-button-secondary"
          disabled={zoom === 3}
          aria-label={zh ? '放大圖片' : 'Zoom in'}
          onClick={() => changeZoom(zoom + 1)}
        >
          ＋
        </button>
        <button
          type="button"
          className="tool-button tool-button-secondary"
          aria-label={zh ? '鏡像圖片' : 'Mirror image'}
          aria-pressed={mirror}
          onClick={() => setMirror(!mirror)}
        >
          {zh ? '鏡像' : 'Mirror'}
        </button>
        <button
          type="button"
          className="tool-button tool-button-secondary"
          aria-label={zh ? '顯示構圖線' : 'Show composition grid'}
          data-state={grid}
          onClick={cycleGrid}
        >
          {grid === 'thirds'
            ? zh
              ? '三分線'
              : 'Thirds'
            : grid === 'center'
              ? zh
                ? '中心線'
                : 'Center'
              : zh
                ? '構圖線'
                : 'Grid'}
        </button>
        <button
          type="button"
          className="tool-button tool-button-secondary"
          aria-label={zh ? '灰階圖片' : 'Grayscale image'}
          aria-pressed={gray}
          onClick={() => setGray(!gray)}
        >
          {zh ? '灰階' : 'Grayscale'}
        </button>
        <button type="button" className="tool-button tool-button-secondary" onClick={reset}>
          {zh ? '重設檢視' : 'Reset view'}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
