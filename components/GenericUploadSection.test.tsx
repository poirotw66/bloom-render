// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GenericUploadSection from './GenericUploadSection';

const demo = vi.hoisted(() => ({ enabled: false }));
vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({ isDemoMode: demo.enabled }),
}));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));
vi.mock('./CostEstimateBadge', () => ({ default: () => null }));
const props = () => ({
  previewUrl: null,
  error: null,
  loading: false,
  isDraggingOver: false,
  onFileChange: vi.fn(),
  onGenerate: vi.fn(),
  onDragOver: vi.fn(),
  onDragLeave: vi.fn(),
  onDrop: vi.fn(),
  uploadInputId: 'original-upload-id',
});
beforeEach(() => {
  demo.enabled = false;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe('shared upload workflow', () => {
  it('opens the native file picker through a keyboard-focusable button and retains the input ID after upload', () => {
    const upload = props();
    const view = render(<GenericUploadSection {...upload} />);
    const input = document.getElementById(upload.uploadInputId) as HTMLInputElement;
    const click = vi.spyOn(input, 'click');
    const button = screen.getByRole('button', { name: 'start.upload_button' });
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(click).toHaveBeenCalledOnce();
    const file = new File(['image'], 'photo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(upload.onFileChange).toHaveBeenCalledOnce();
    view.rerender(<GenericUploadSection {...upload} previewUrl="blob:photo" />);
    expect(document.getElementById(upload.uploadInputId)).toBe(input);
    expect(screen.getByRole('button', { name: 'start.idphoto_change_photo' })).toBeTruthy();
  });
  it('places configuration after upload and before generation', () => {
    render(
      <GenericUploadSection {...props()} previewUrl="blob:photo">
        <label>
          Style
          <select>
            <option>Original</option>
          </select>
        </label>
      </GenericUploadSection>,
    );
    const replace = screen.getByRole('button', { name: 'start.idphoto_change_photo' });
    const style = screen.getByRole('combobox', { name: 'Style' });
    const generate = screen.getByRole('button', { name: 'start.idphoto_generate_btn' });
    expect(replace.compareDocumentPosition(style) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(style.compareDocumentPosition(generate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('blocks replacing, dropping and pasting images during generation', () => {
    const upload = props();
    render(<GenericUploadSection {...upload} previewUrl="blob:photo" loading />);
    expect(screen.getByRole('button', { name: 'start.idphoto_change_photo' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(document.getElementById(upload.uploadInputId)).toHaveProperty('disabled', true);
    const zone = screen.getByRole('group');
    fireEvent.drop(zone, {
      dataTransfer: { files: [new File(['image'], 'photo.png', { type: 'image/png' })] },
    });
    fireEvent.paste(zone, {
      clipboardData: { files: [new File(['image'], 'photo.png', { type: 'image/png' })] },
    });
    expect(upload.onDrop).not.toHaveBeenCalled();
    expect(upload.onFileChange).not.toHaveBeenCalled();
  });
});
