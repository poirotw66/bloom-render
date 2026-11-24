// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TryOnReferenceControls from './TryOnReferenceControls';

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

afterEach(cleanup);

function mount(props: Partial<React.ComponentProps<typeof TryOnReferenceControls>> = {}) {
  const onReferenceChange = vi.fn();
  const onKeepBackgroundChange = vi.fn();
  const onKeepPoseChange = vi.fn();
  render(
    <TryOnReferenceControls
      keepBackground={false}
      keepPose
      referencePreviewUrls={{}}
      onReferenceChange={onReferenceChange}
      onKeepBackgroundChange={onKeepBackgroundChange}
      onKeepPoseChange={onKeepPoseChange}
      {...props}
    />,
  );
  return { onReferenceChange, onKeepBackgroundChange, onKeepPoseChange };
}

describe('TryOnReferenceControls', () => {
  it('explains and disables overridden preservation settings', () => {
    mount({ referencePreviewUrls: { pose: 'blob:pose', lighting: 'blob:light' } });
    expect(
      (screen.getByRole('checkbox', { name: 'Keep original pose' }) as HTMLInputElement).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole('checkbox', {
          name: 'Keep original background and light',
        }) as HTMLInputElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByRole('status').textContent).toContain(
      'Scene or lighting references override',
    );
    expect(screen.getByRole('status').textContent).toContain('pose reference overrides');
  });

  it('assigns custom images to their role and removes references', () => {
    const { onReferenceChange } = mount({ referencePreviewUrls: { pose: 'blob:pose' } });
    const file = new File(['image'], 'expression.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Upload expression reference'), {
      target: { files: [file] },
    });
    expect(onReferenceChange).toHaveBeenCalledWith('expression', file);
    fireEvent.click(screen.getByRole('button', { name: 'Remove pose' }));
    expect(onReferenceChange).toHaveBeenCalledWith('pose', null);
  });

  it('lets users explicitly preserve their background and change their pose', () => {
    const { onKeepBackgroundChange, onKeepPoseChange } = mount();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Keep original background and light' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Keep original pose' }));
    expect(onKeepBackgroundChange).toHaveBeenCalledWith(true);
    expect(onKeepPoseChange).toHaveBeenCalledWith(false);
  });
});
