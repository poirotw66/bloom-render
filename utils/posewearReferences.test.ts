import { describe, expect, it } from 'vitest';
import { formatReferenceBrief } from './posewearReferences';

describe('PoseWear reference brief adaptation', () => {
  it('keeps the exact prompt when there are no references', () => {
    const prompt = '  Keep my custom wording.\n';
    expect(formatReferenceBrief(prompt, [], 'en')).toBe(prompt);
    expect(formatReferenceBrief('', [], 'en')).toBe('');
  });

  it('keeps local slots in place around public references', () => {
    expect(
      formatReferenceBrief(
        'A new outfit',
        [
          null,
          { label: 'Clothing · Oxford shirt', url: 'https://example.com/shirt.svg' },
          null,
          { label: 'Pose · Seated profile', url: 'https://example.com/pose.svg' },
        ],
        'en',
      ),
    ).toBe(
      [
        'A new outfit',
        '',
        'Reference images',
        '- Image 1 · Attach this local image separately.',
        '- Image 2 · Clothing · Oxford shirt — https://example.com/shirt.svg',
        '- Image 3 · Attach this local image separately.',
        '- Image 4 · Pose · Seated profile — https://example.com/pose.svg',
      ].join('\n'),
    );
  });

  it('formats Traditional Chinese references without adding an empty prompt', () => {
    expect(
      formatReferenceBrief(
        '',
        [null, { label: '服裝 · 襯衫', url: 'https://example.com/shirt.svg' }],
        'zh-TW',
      ),
    ).toBe(
      [
        '參考圖',
        '- 圖 1 · 請另附這張本機參考圖。',
        '- 圖 2 · 服裝 · 襯衫 — https://example.com/shirt.svg',
      ].join('\n'),
    );
  });
});
