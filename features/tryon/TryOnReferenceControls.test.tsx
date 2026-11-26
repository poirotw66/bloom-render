// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TryOnReferenceControls from './TryOnReferenceControls';

const locale = vi.hoisted(() => ({ language: 'en' }));
vi.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => locale }));

afterEach(() => {
  cleanup();
  locale.language = 'en';
});

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
  it('shows one pose action and upload while keeping the step legend descriptive', () => {
    const choose = vi.fn();
    const { onReferenceChange } = mount({
      variant: 'pose',
      onChoosePose: choose,
      referencePreviewUrls: { pose: 'blob:pose' },
    });
    const group = screen.getByRole('group');
    expect(group.querySelector('legend')?.textContent).toContain('03Pose and cameraOptional');
    expect(group.querySelector('legend button, legend input')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Choose pose' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Upload pose reference' })).toHaveLength(1);
    expect(screen.getAllByTestId('tryon-reference-pose')).toHaveLength(1);
    expect(screen.getAllByRole('img', { name: 'Pose reference' })).toHaveLength(1);
    expect(screen.queryByTestId('tryon-keep-background')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Choose pose' }));
    expect(choose).toHaveBeenCalledOnce();
    const file = new File(['pose'], 'pose.png', { type: 'image/png' });
    fireEvent.change(screen.getByTestId('tryon-reference-pose'), { target: { files: [file] } });
    expect(onReferenceChange).toHaveBeenCalledWith('pose', file);
    fireEvent.click(screen.getByRole('button', { name: 'Remove pose' }));
    expect(onReferenceChange).toHaveBeenCalledWith('pose', null);
  });

  it('keeps extra references separate and localizes their legend', () => {
    locale.language = 'zh-TW';
    mount({ variant: 'extra' });
    expect(
      screen.getByRole('group', { name: '構圖與參考圖' }).querySelector('legend')?.textContent,
    ).toBe('構圖與參考圖');
    expect(screen.queryByTestId('tryon-reference-pose')).toBeNull();
    for (const role of ['expression', 'scene', 'lighting']) {
      expect(screen.getAllByTestId(`tryon-reference-${role}`)).toHaveLength(1);
    }
  });

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
