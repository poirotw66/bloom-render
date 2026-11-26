// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import { materialBoardEntries, renderMaterialBoard, wrapBoardText } from './materialBoard';

const COLORS = {
  background: '#111111',
  surface: '#222222',
  ink: '#ffffff',
  muted: '#bbbbbb',
  accent: '#ff4488',
};

describe('reference board content', () => {
  it('preserves the selected order and numbers every reference with attribution', () => {
    const selected = [TRYON_MATERIALS[5], TRYON_MATERIALS[0]];
    const entries = materialBoardEntries(selected, 'en');
    expect(entries.map((entry) => [entry.id, entry.number])).toEqual([
      [selected[0].id, 1],
      [selected[1].id, 2],
    ]);
    expect(entries[0].pose).toContain('Profile');
    expect(entries[0].pose).not.toContain('Not specified');
    expect(entries[0].attribution).toContain('CC0-1.0');
    expect(entries[0].attribution).toContain(selected[0].source);
    expect(entries[1].role).toBe('Clothing');
    expect(entries[1].pose).toBe('');
    expect(materialBoardEntries(selected, 'zh-TW')[1].title).toBe(selected[1].titleZh);
  });

  it('wraps long attribution URLs and Chinese text without dropping characters', () => {
    const context = { measureText: (text: string) => ({ width: text.length * 10 }) } as Pick<
      CanvasRenderingContext2D,
      'measureText'
    >;
    for (const text of ['https://example.test/very-long-source-link', '參考素材姿勢與拍攝機位']) {
      const lines = wrapBoardText(context, text, 60);
      expect(lines.join('')).toBe(text);
      expect(lines.every((line) => line.length <= 6)).toBe(true);
    }
  });

  it('rejects empty boards without claiming an export', async () => {
    await expect(renderMaterialBoard([], { language: 'en', colors: COLORS })).rejects.toThrow(
      'Select references',
    );
  });

  it('rejects boards that exceed the basket capacity', async () => {
    await expect(
      renderMaterialBoard(Array(10).fill(TRYON_MATERIALS[0]), {
        language: 'en',
        colors: COLORS,
      }),
    ).rejects.toThrow('nine materials');
  });

  it('fails the entire export when any image fails and permits a fresh retry', async () => {
    let fail = true;
    class FakeImage {
      naturalWidth = 100;
      naturalHeight = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(value: string) {
        if (value) queueMicrotask(() => (fail ? this.onerror?.() : this.onload?.()));
      }
    }
    vi.stubGlobal('Image', FakeImage);
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    try {
      await expect(
        renderMaterialBoard([TRYON_MATERIALS[0]], { language: 'en', colors: COLORS }),
      ).rejects.toThrow('Cannot load board image');
      fail = false;
      await expect(
        renderMaterialBoard([TRYON_MATERIALS[0]], { language: 'en', colors: COLORS }),
      ).rejects.toThrow('Canvas is unavailable');
    } finally {
      getContext.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('cancels image loading when the basket closes', async () => {
    class PendingImage {
      onload = null;
      onerror = null;
      set src(_value: string) {}
    }
    vi.stubGlobal('Image', PendingImage);
    try {
      const controller = new AbortController();
      const rendering = renderMaterialBoard([TRYON_MATERIALS[0]], {
        language: 'en',
        colors: COLORS,
        signal: controller.signal,
      });
      controller.abort();
      await expect(rendering).rejects.toMatchObject({ name: 'AbortError' });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
