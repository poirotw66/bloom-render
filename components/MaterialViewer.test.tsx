// @vitest-environment jsdom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import MaterialViewer from './MaterialViewer';
import { extractMaterialPalette } from '../utils/posewearPalette';
vi.mock('../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('../utils/posewearPalette', () => ({ extractMaterialPalette: vi.fn(() => []) }));
beforeEach(() => {
  vi.mocked(extractMaterialPalette).mockReset().mockReturnValue([]);
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    }),
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    }),
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('MaterialViewer', () => {
  it('provides zoom, mirror, composition lines and grayscale with reset', () => {
    render(<MaterialViewer material={TRYON_MATERIALS[0]} onClose={vi.fn()} />);
    const image = screen.getByTestId('material-viewer-image');
    fireEvent.load(image);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mirror image' }));
    fireEvent.click(screen.getByRole('button', { name: 'Grayscale image' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show composition grid' }));
    expect(image.style.transform).toContain('scale(2) scaleX(-1)');
    expect(image.style.filter).toBe('grayscale(1)');
    expect(screen.getByTestId('material-viewer-grid').getAttribute('data-grid')).toBe('thirds');
    fireEvent.click(screen.getByRole('button', { name: 'Reset view' }));
    expect(image.style.transform).toContain('scale(1) scaleX(1)');
    expect(image.style.filter).toBe('');
    expect(screen.queryByTestId('material-viewer-grid')).toBeNull();
  });
  it('anchors composition lines to the displayed image and applies its transforms', () => {
    render(<MaterialViewer material={TRYON_MATERIALS[0]} onClose={vi.fn()} />);
    const image = screen.getByTestId('material-viewer-image');
    Object.defineProperty(image, 'clientWidth', { configurable: true, value: 300 });
    Object.defineProperty(image, 'clientHeight', { configurable: true, value: 400 });
    fireEvent.load(image);
    fireEvent.click(screen.getByRole('button', { name: 'Show composition grid' }));
    const grid = screen.getByTestId('material-viewer-grid');
    expect(grid.style.width).toBe('300px');
    expect(grid.style.height).toBe('400px');
    expect(grid.style.marginLeft).toBe('-150px');
    expect(grid.style.marginTop).toBe('-200px');
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mirror image' }));
    expect(grid.style.transform).toBe(image.style.transform);
    Object.defineProperty(image, 'clientWidth', { configurable: true, value: 240 });
    fireEvent(window, new Event('resize'));
    expect(grid.style.width).toBe('240px');
    expect(grid.style.marginLeft).toBe('-120px');
  });
  it('resets transformations when a different material opens and reports a failed image', async () => {
    const { rerender } = render(<MaterialViewer material={TRYON_MATERIALS[0]} onClose={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'h' });
    rerender(<MaterialViewer material={TRYON_MATERIALS[1]} onClose={vi.fn()} />);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Mirror image' }).getAttribute('aria-pressed'),
      ).toBe('false'),
    );
    fireEvent.error(screen.getByTestId('material-viewer-image'));
    expect(screen.getByRole('alert').textContent).toContain('Could not load');
  });
  it('cancels only the viewer and restores the opening control and preexisting scroll lock', () => {
    document.body.style.overflow = 'hidden';
    function Parent() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open preview</button>
          {open && <MaterialViewer material={TRYON_MATERIALS[0]} onClose={() => setOpen(false)} />}
        </>
      );
    }
    render(<Parent />);
    const trigger = screen.getByRole('button', { name: 'Open preview' });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { bubbles: false, cancelable: true }),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('hidden');
    document.body.style.overflow = '';
  });
  it('shows only real paired variants and compares their aligned images without changing selection', () => {
    const material = TRYON_MATERIALS.find((item) => item.id === 'standing-study-front-lineart')!;
    const onMaterialChange = vi.fn();
    render(
      <MaterialViewer material={material} onClose={vi.fn()} onMaterialChange={onMaterialChange} />,
    );
    const image = screen.getByTestId('material-viewer-image');
    Object.defineProperty(image, 'clientWidth', { configurable: true, value: 320 });
    Object.defineProperty(image, 'clientHeight', { configurable: true, value: 400 });
    fireEvent.load(image);
    fireEvent.click(screen.getByTestId('pose-compare-toggle'));
    const depth = screen.getByTestId('pose-comparison-depth-image');
    expect(depth.getAttribute('src')).toContain('standing-study-front-depth.png');
    expect(screen.getByTestId('pose-comparison').style.visibility).toBe('hidden');
    fireEvent.load(depth);
    const comparison = screen.getByTestId('pose-comparison');
    expect(comparison.style.visibility).toBe('visible');
    expect(comparison.style.width).toBe('320px');
    expect(comparison.style.height).toBe('400px');
    fireEvent.change(screen.getByTestId('pose-comparison-slider'), { target: { value: '35' } });
    expect(comparison.style.clipPath).toBe('inset(0 65% 0 0)');
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(comparison.style.transform).toBe(image.style.transform);
    expect(onMaterialChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByTestId('pose-view-select'), { target: { value: 'profile' } });
    expect(onMaterialChange.mock.calls[0][0].id).toBe('standing-study-profile-lineart');
    fireEvent.change(screen.getByTestId('pose-representation-select'), {
      target: { value: 'depth' },
    });
    expect(onMaterialChange.mock.calls[1][0].id).toBe('standing-study-front-depth');
    fireEvent.error(depth);
    expect(screen.getByRole('alert').textContent).toContain('Could not load');
    expect(comparison.style.visibility).toBe('hidden');
  });

  it('keeps an already loaded line-art image ready when a compared depth selection changes to line art', () => {
    const depthMaterial = TRYON_MATERIALS.find((item) => item.id === 'standing-study-back-depth')!;
    const lineartMaterial = TRYON_MATERIALS.find(
      (item) => item.id === 'standing-study-back-lineart',
    )!;
    const { rerender } = render(<MaterialViewer material={depthMaterial} onClose={vi.fn()} />);
    fireEvent.load(screen.getByTestId('material-viewer-image'));
    fireEvent.click(screen.getByTestId('pose-compare-toggle'));
    const primary = screen.getByTestId('material-viewer-image');
    expect(primary.getAttribute('src')).toContain('standing-study-back-lineart.png');
    fireEvent.load(primary);
    fireEvent.load(screen.getByTestId('pose-comparison-depth-image'));
    expect(screen.getByTestId('pose-comparison').style.visibility).toBe('visible');
    rerender(<MaterialViewer material={lineartMaterial} onClose={vi.fn()} />);
    expect(screen.getByTestId('material-viewer-image')).toBe(primary);
    expect(screen.queryByText('Loading image')).toBeNull();
    fireEvent.click(screen.getByTestId('pose-compare-toggle'));
    fireEvent.load(screen.getByTestId('pose-comparison-depth-image'));
    expect(screen.getByTestId('pose-comparison').style.visibility).toBe('visible');
    expect(screen.queryByText('Loading image')).toBeNull();
  });

  it('omits pairing and alternate-view controls for legacy unpaired materials', () => {
    render(
      <MaterialViewer
        material={TRYON_MATERIALS.find((item) => item.id === 'pose-relaxed-front')!}
        onClose={vi.fn()}
        onMaterialChange={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('pose-compare-toggle')).toBeNull();
    expect(screen.queryByTestId('pose-view-select')).toBeNull();
    expect(screen.queryByTestId('pose-representation-select')).toBeNull();
  });

  it('copies colors from the original image while view filters remain independent', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.mocked(extractMaterialPalette).mockReturnValue(['#1A3050', '#A06040']);
    render(<MaterialViewer material={TRYON_MATERIALS[1]} onClose={vi.fn()} />);
    fireEvent.load(screen.getByTestId('material-viewer-image'));
    const color = screen.getByRole('button', { name: 'Copy color #1A3050' });
    expect(color.textContent).toBe('#1A3050');
    fireEvent.click(screen.getByRole('button', { name: 'Grayscale image' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mirror image' }));
    expect(screen.getByRole('button', { name: 'Copy color #1A3050' })).toBe(color);
    expect(extractMaterialPalette).toHaveBeenCalledTimes(1);
    fireEvent.click(color);
    await waitFor(() => expect(screen.getByText('#1A3050 copied.')).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith('#1A3050');
  });

  it('retains a selectable color code when the clipboard is denied and clears it on material change', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')),
      },
    });
    vi.mocked(extractMaterialPalette).mockReturnValue(['#1A3050', '#A06040']);
    const { rerender } = render(<MaterialViewer material={TRYON_MATERIALS[1]} onClose={vi.fn()} />);
    fireEvent.load(screen.getByTestId('material-viewer-image'));
    fireEvent.click(screen.getByRole('button', { name: 'Copy color #1A3050' }));
    const code = await screen.findByRole('textbox', { name: 'Color code' });
    expect((code as HTMLInputElement).value).toBe('#1A3050');
    expect(code.hasAttribute('readonly')).toBe(true);
    expect(screen.getByRole('button', { name: 'Copy color #1A3050' })).toBeTruthy();
    rerender(<MaterialViewer material={TRYON_MATERIALS[2]} onClose={vi.fn()} />);
    expect(screen.queryByRole('region', { name: 'Extracted colors' })).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Color code' })).toBeNull();
    vi.mocked(extractMaterialPalette).mockReturnValue(['#C05040', '#303020']);
    fireEvent.load(screen.getByTestId('material-viewer-image'));
    expect(screen.getByRole('button', { name: 'Copy color #C05040' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Copy color #1A3050' })).toBeNull();
  });

  it('does not show color tools for pose references, failed images or monochrome samples', () => {
    vi.mocked(extractMaterialPalette).mockReturnValue(['#000000']);
    const { rerender } = render(<MaterialViewer material={TRYON_MATERIALS[0]} onClose={vi.fn()} />);
    fireEvent.load(screen.getByTestId('material-viewer-image'));
    expect(screen.queryByRole('region', { name: 'Extracted colors' })).toBeNull();
    vi.mocked(extractMaterialPalette).mockReturnValue(['#1A3050', '#A06040']);
    fireEvent.load(screen.getByTestId('material-viewer-image'));
    expect(screen.getByRole('region', { name: 'Extracted colors' })).toBeTruthy();
    fireEvent.error(screen.getByTestId('material-viewer-image'));
    expect(screen.queryByRole('region', { name: 'Extracted colors' })).toBeNull();
    rerender(
      <MaterialViewer
        material={TRYON_MATERIALS.find((item) => item.role === 'pose')!}
        onClose={vi.fn()}
      />,
    );
    fireEvent.load(screen.getByTestId('material-viewer-image'));
    expect(screen.queryByRole('region', { name: 'Extracted colors' })).toBeNull();
  });

  it('extracts an already-cached material image without waiting for another load event', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(100);
    vi.mocked(extractMaterialPalette).mockReturnValue(['#1A3050', '#A06040']);
    render(<MaterialViewer material={TRYON_MATERIALS[1]} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Copy color #1A3050' })).toBeTruthy();
    expect(screen.queryByText('Loading image')).toBeNull();
  });

  it('ignores a clipboard result from a material that is no longer displayed', async () => {
    let finishCopy!: () => void;
    const copying = new Promise<void>((resolve) => {
      finishCopy = resolve;
    });
    vi.stubGlobal('navigator', { clipboard: { writeText: () => copying } });
    vi.mocked(extractMaterialPalette).mockReturnValue(['#1A3050', '#A06040']);
    const { rerender } = render(<MaterialViewer material={TRYON_MATERIALS[1]} onClose={vi.fn()} />);
    fireEvent.load(screen.getByTestId('material-viewer-image'));
    fireEvent.click(screen.getByRole('button', { name: 'Copy color #1A3050' }));
    rerender(<MaterialViewer material={TRYON_MATERIALS[2]} onClose={vi.fn()} />);
    vi.mocked(extractMaterialPalette).mockReturnValue(['#C05040', '#303020']);
    fireEvent.load(screen.getByTestId('material-viewer-image'));
    finishCopy();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Copy color #C05040' })).toBeTruthy(),
    );
    expect(screen.queryByText('#1A3050 copied.')).toBeNull();
  });
});
