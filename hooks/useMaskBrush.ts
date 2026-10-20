/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Stroke stack for the editor retouch mask brush: paint, erase, undo per stroke.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_BRUSH_SIZE,
  MAX_BRUSH_SIZE,
  MIN_BRUSH_SIZE,
  MASK_PREVIEW_FILL,
  displayToNaturalPoint,
  drawMaskStroke,
  exportBinaryMaskFile,
  maskHasPaint,
  renderMaskStrokes,
  type MaskBrushTool,
  type MaskPoint,
  type MaskStroke,
} from '../utils/maskBrush';

export interface UseMaskBrushOptions {
  naturalWidth: number;
  naturalHeight: number;
  /** When the underlying image changes, wipe strokes. */
  imageKey?: string | null;
}

export interface UseMaskBrushResult {
  strokes: MaskStroke[];
  brushSize: number;
  setBrushSize: (size: number) => void;
  tool: MaskBrushTool;
  setTool: (tool: MaskBrushTool) => void;
  hasMask: boolean;
  canUndoStroke: boolean;
  undoStroke: () => void;
  clearMask: () => void;
  /** Bind to the overlay canvas after mount / size change. */
  attachCanvas: (canvas: HTMLCanvasElement | null) => void;
  beginStroke: (clientX: number, clientY: number, rect: DOMRectReadOnly) => void;
  continueStroke: (clientX: number, clientY: number, rect: DOMRectReadOnly) => void;
  endStroke: () => void;
  exportMaskFile: () => Promise<File | null>;
  redraw: () => void;
}

export function useMaskBrush({
  naturalWidth,
  naturalHeight,
  imageKey,
}: UseMaskBrushOptions): UseMaskBrushResult {
  const [strokes, setStrokes] = useState<MaskStroke[]>([]);
  const [brushSize, setBrushSizeState] = useState(DEFAULT_BRUSH_SIZE);
  const [tool, setTool] = useState<MaskBrushTool>('paint');
  const [hasMask, setHasMask] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<MaskStroke[]>([]);
  const draftRef = useRef<MaskStroke | null>(null);
  const toolRef = useRef(tool);
  const brushSizeRef = useRef(brushSize);

  toolRef.current = tool;
  brushSizeRef.current = brushSize;
  strokesRef.current = strokes;

  const setBrushSize = useCallback((size: number) => {
    setBrushSizeState(Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, Math.round(size))));
  }, []);

  const paintPreview = useCallback(
    (allStrokes: readonly MaskStroke[], draft: MaskStroke | null) => {
      const canvas = canvasRef.current;
      if (!canvas || naturalWidth <= 0 || naturalHeight <= 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (canvas.width !== naturalWidth) canvas.width = naturalWidth;
      if (canvas.height !== naturalHeight) canvas.height = naturalHeight;
      renderMaskStrokes(ctx, naturalWidth, naturalHeight, allStrokes, {
        fillStyle: MASK_PREVIEW_FILL,
        clear: true,
      });
      if (draft && draft.points.length > 0) {
        drawMaskStroke(ctx, draft, { fillStyle: MASK_PREVIEW_FILL });
      }
      setHasMask(maskHasPaint(ctx, naturalWidth, naturalHeight));
    },
    [naturalWidth, naturalHeight],
  );

  const redraw = useCallback(() => {
    paintPreview(strokesRef.current, draftRef.current);
  }, [paintPreview]);

  const attachCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasRef.current = canvas;
      if (canvas) {
        canvas.width = Math.max(1, naturalWidth);
        canvas.height = Math.max(1, naturalHeight);
        paintPreview(strokesRef.current, draftRef.current);
      }
    },
    [naturalWidth, naturalHeight, paintPreview],
  );

  useEffect(() => {
    setStrokes([]);
    draftRef.current = null;
    setHasMask(false);
    paintPreview([], null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the source image identity changes
  }, [imageKey, naturalWidth, naturalHeight]);

  const beginStroke = useCallback(
    (clientX: number, clientY: number, rect: DOMRectReadOnly) => {
      if (naturalWidth <= 0 || naturalHeight <= 0) return;
      const point = displayToNaturalPoint(clientX, clientY, rect, naturalWidth, naturalHeight);
      draftRef.current = {
        tool: toolRef.current,
        size: brushSizeRef.current,
        points: [point],
      };
      paintPreview(strokesRef.current, draftRef.current);
    },
    [naturalWidth, naturalHeight, paintPreview],
  );

  const continueStroke = useCallback(
    (clientX: number, clientY: number, rect: DOMRectReadOnly) => {
      const draft = draftRef.current;
      if (!draft) return;
      const point = displayToNaturalPoint(clientX, clientY, rect, naturalWidth, naturalHeight);
      const last = draft.points[draft.points.length - 1];
      if (last && Math.hypot(point.x - last.x, point.y - last.y) < 0.5) return;
      draft.points.push(point);
      paintPreview(strokesRef.current, draft);
    },
    [naturalWidth, naturalHeight, paintPreview],
  );

  const endStroke = useCallback(() => {
    const draft = draftRef.current;
    draftRef.current = null;
    if (!draft || draft.points.length === 0) {
      paintPreview(strokesRef.current, null);
      return;
    }
    setStrokes((prev) => {
      const next = [...prev, draft];
      strokesRef.current = next;
      paintPreview(next, null);
      return next;
    });
  }, [paintPreview]);

  const undoStroke = useCallback(() => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      strokesRef.current = next;
      paintPreview(next, null);
      return next;
    });
  }, [paintPreview]);

  const clearMask = useCallback(() => {
    draftRef.current = null;
    strokesRef.current = [];
    setStrokes([]);
    paintPreview([], null);
  }, [paintPreview]);

  const exportMaskFile = useCallback(async (): Promise<File | null> => {
    const canvas = canvasRef.current;
    if (!canvas || !hasMask) return null;
    // Ensure latest strokes are painted before export.
    paintPreview(strokesRef.current, null);
    return exportBinaryMaskFile(canvas);
  }, [hasMask, paintPreview]);

  return {
    strokes,
    brushSize,
    setBrushSize,
    tool,
    setTool,
    hasMask,
    canUndoStroke: strokes.length > 0,
    undoStroke,
    clearMask,
    attachCanvas,
    beginStroke,
    continueStroke,
    endStroke,
    exportMaskFile,
    redraw,
  };
}

export type { MaskPoint, MaskStroke, MaskBrushTool };
