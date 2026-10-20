/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Transparent canvas overlay for painting / erasing retouch mask strokes.
 * Uses Pointer Events so mouse, pen, and touch share one path.
 */

import React, { useEffect, useRef } from 'react';
import type { UseMaskBrushResult } from '../hooks/useMaskBrush';

interface MaskBrushCanvasProps {
  brush: UseMaskBrushResult;
  /** Match the displayed image box (same CSS size as the photo). */
  className?: string;
  disabled?: boolean;
  /** 'paint' → crosshair / none; eraser still paints with destination-out. */
  cursor?: string;
}

const MaskBrushCanvas: React.FC<MaskBrushCanvasProps> = ({
  brush,
  className = '',
  disabled = false,
  cursor = 'crosshair',
}) => {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  const attachCanvas = brush.attachCanvas;
  const redraw = brush.redraw;

  useEffect(() => {
    attachCanvas(canvasElRef.current);
    return () => attachCanvas(null);
  }, [attachCanvas]);

  useEffect(() => {
    redraw();
  }, [redraw, brush.strokes, brush.tool, brush.brushSize]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = e.currentTarget;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    brush.beginStroke(e.clientX, e.clientY, rect);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    brush.continueStroke(e.clientX, e.clientY, rect);
  };

  const finish = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
    brush.endStroke();
  };

  return (
    <canvas
      ref={canvasElRef}
      className={`absolute top-0 left-0 w-full h-full touch-none ${className}`}
      style={{ cursor: disabled ? 'default' : cursor, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      aria-hidden
    />
  );
};

export default MaskBrushCanvas;
