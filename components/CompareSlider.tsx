/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Before/after comparison with a draggable divider.
 *
 * The edited image is the base layer; the original is overlaid and clipped to
 * the divider position, so dragging wipes between the two.
 *
 * The wrapper shrink-wraps the base image (rather than filling its container)
 * so the box the divider is measured against is exactly the picture. With a
 * w-full box the image letterboxes inside it, and the divider would then run
 * off the edge of the picture while the handle was still mid-track.
 */

import React, { useCallback, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface CompareSliderProps {
  /** Left side of the wipe: the untouched image. */
  originalUrl: string;
  /** Right side of the wipe: the current edited image. */
  currentUrl: string;
  /** Extra classes for the image layers (sizing is driven by the base image). */
  imageClassName?: string;
  className?: string;
}

const KEYBOARD_STEP = 2;
const KEYBOARD_STEP_LARGE = 10;

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Divider position (0-100) for a pointer at `clientX` over a box of the given
 * left edge and width. Returns null for a zero-width box, which happens if a
 * pointer event lands before layout has settled.
 */
export function positionFromClientX(
  clientX: number,
  rectLeft: number,
  rectWidth: number,
): number | null {
  if (rectWidth === 0) return null;
  return clampPercent(((clientX - rectLeft) / rectWidth) * 100);
}

const CompareSlider: React.FC<CompareSliderProps> = ({
  originalUrl,
  currentUrl,
  imageClassName = '',
  className = '',
}) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const next = positionFromClientX(clientX, rect.left, rect.width);
    if (next !== null) setPosition(next);
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Capture on the container so the drag keeps tracking even when the
      // pointer leaves the image bounds.
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
      updateFromClientX(event.clientX);
    },
    [updateFromClientX],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      updateFromClientX(event.clientX);
    },
    [isDragging, updateFromClientX],
  );

  const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        setPosition((prev) => clampPercent(prev - step));
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        setPosition((prev) => clampPercent(prev + step));
        break;
      case 'Home':
        event.preventDefault();
        setPosition(0);
        break;
      case 'End':
        event.preventDefault();
        setPosition(100);
        break;
      default:
        break;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-fit mx-auto select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-ew-resize'} ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* Base layer: the edited image, and the element that sizes the box. */}
      <img
        src={currentUrl}
        alt={t('main.compare_after')}
        draggable={false}
        className={`block pointer-events-none ${imageClassName}`}
      />

      {/* Overlay: the original, revealed to the left of the divider. */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        aria-hidden="true"
      >
        <img
          src={originalUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      </div>

      <span
        className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-bold pointer-events-none"
        style={{ opacity: position > 12 ? 1 : 0 }}
      >
        {t('main.compare_before')}
      </span>
      <span
        className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-bold pointer-events-none"
        style={{ opacity: position < 88 ? 1 : 0 }}
      >
        {t('main.compare_after')}
      </span>

      {/* Divider line + grab handle. */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.6)] pointer-events-none"
        style={{ left: `${position}%` }}
        aria-hidden="true"
      />
      <div
        role="slider"
        tabIndex={0}
        aria-label={t('main.compare_slider_label')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}%`}
        onKeyDown={handleKeyDown}
        className="absolute top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg flex items-center justify-center cursor-ew-resize focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/70"
        style={{ left: `${position}%` }}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-gray-800"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6 4 12l5 6M15 6l5 6-5 6" />
        </svg>
      </div>
    </div>
  );
};

export default CompareSlider;
