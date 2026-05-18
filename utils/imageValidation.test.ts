import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { validateImage } from './imageValidation';

function makeFile(overrides: Partial<{ name: string; type: string; size: number }> = {}): File {
  const { name = 'photo.png', type = 'image/png', size = 1024 } = overrides;
  const blob = new Blob([new Uint8Array(Math.min(size, 64))], { type });
  Object.defineProperty(blob, 'size', { value: size });
  return new File([blob], name, { type });
}

describe('validateImage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        naturalWidth = 800;
        naturalHeight = 600;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects non-image MIME types', async () => {
    const result = await validateImage(makeFile({ type: 'application/pdf' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('validation.error_not_image');
  });

  it('rejects files over 50 MB', async () => {
    const result = await validateImage(makeFile({ size: 51 * 1024 * 1024 }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('validation.error_file_too_large');
  });

  it('accepts a normal image and records dimensions', async () => {
    const result = await validateImage(makeFile());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.info.width).toBe(800);
    expect(result.info.height).toBe(600);
  });

  it('adds a low-resolution warning below 512px', async () => {
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        naturalWidth = 400;
        naturalHeight = 400;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );

    const result = await validateImage(makeFile());
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('validation.warn_resolution_low');
  });
});
