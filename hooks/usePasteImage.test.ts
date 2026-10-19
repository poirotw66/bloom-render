/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { imageFileFromClipboard, usePasteImage } from './usePasteImage';

describe('imageFileFromClipboard', () => {
  it('returns the first image file from clipboard items', () => {
    const file = new File(['x'], 'paste.png', { type: 'image/png' });
    const item = {
      kind: 'file',
      type: 'image/png',
      getAsFile: () => file,
    };
    const data = {
      items: [item],
      files: undefined,
    } as unknown as DataTransfer;
    expect(imageFileFromClipboard(data)).toBe(file);
  });

  it('returns null when there is no image', () => {
    const data = {
      items: [{ kind: 'string', type: 'text/plain', getAsFile: () => null }],
      files: undefined,
    } as unknown as DataTransfer;
    expect(imageFileFromClipboard(data)).toBeNull();
    expect(imageFileFromClipboard(null)).toBeNull();
  });
});

describe('usePasteImage', () => {
  it('calls onImage when paste targets the container', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const ref = { current: container as HTMLElement | null };

    const onImage = vi.fn();
    renderHook(() => usePasteImage(ref, onImage));

    const file = new File(['x'], 'paste.png', { type: 'image/png' });
    const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, 'clipboardData', {
      value: {
        items: [
          {
            kind: 'file',
            type: 'image/png',
            getAsFile: () => file,
          },
        ],
      },
    });
    Object.defineProperty(event, 'target', { value: container });

    document.dispatchEvent(event);
    expect(onImage).toHaveBeenCalledWith(file);

    document.body.removeChild(container);
  });
});
