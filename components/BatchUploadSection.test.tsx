// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BatchUploadSection from './BatchUploadSection';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));
vi.mock('./CostEstimateBadge', () => ({ default: () => null }));
const props = () => ({
  files: [] as File[],
  previewUrls: [] as string[],
  error: null,
  loading: false,
  isDraggingOver: false,
  onFileChange: vi.fn(),
  onGenerate: vi.fn(),
  onRemoveFile: vi.fn(),
  onDragOver: vi.fn(),
  onDragLeave: vi.fn(),
  onDrop: vi.fn(),
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe('batch photo input controls', () => {
  it('opens a stable native picker through an upload button and supports removing each selected image', () => {
    const upload = props();
    const view = render(<BatchUploadSection {...upload} />);
    const input = document.getElementById('batch-image-upload') as HTMLInputElement;
    const picker = vi.spyOn(input, 'click');
    fireEvent.click(screen.getByRole('button', { name: 'batch.upload_button' }));
    expect(picker).toHaveBeenCalledOnce();
    const file = new File(['photo'], 'photo.png', { type: 'image/png' });
    view.rerender(<BatchUploadSection {...upload} files={[file]} previewUrls={['blob:photo']} />);
    expect(document.getElementById('batch-image-upload')).toBe(input);
    fireEvent.click(screen.getByRole('button', { name: 'batch.add_more' }));
    expect(picker).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'batch.remove_file 1' }));
    expect(upload.onRemoveFile).toHaveBeenCalledWith(0);
  });
  it('disables image mutation while a batch is processing', () => {
    const upload = props();
    const file = new File(['photo'], 'photo.png', { type: 'image/png' });
    render(<BatchUploadSection {...upload} loading files={[file]} previewUrls={['blob:photo']} />);
    expect(screen.getByRole('button', { name: 'batch.remove_file 1' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(document.getElementById('batch-image-upload')).toHaveProperty('disabled', true);
    fireEvent.drop(screen.getByRole('group'), { dataTransfer: { files: [file] } });
    expect(upload.onDrop).not.toHaveBeenCalled();
  });
});
