// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TryOnPromptEditor from './TryOnPromptEditor';
import { SITE_URL } from '../../constants/site';
import { TRYON_MATERIALS } from '../../constants/tryOnMaterials';

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const referenceMap = [
  { role: 'person', name: 'private-person.png' },
  { role: 'clothing', name: 'builtin-file.svg', materialId: 'white-oxford-shirt' },
  { role: 'clothing', name: 'private-garment.png' },
  { role: 'pose', name: 'private-pose.png' },
  { role: 'lighting', name: 'lighting-file.svg', materialId: 'lighting-soft-window' },
];

function mount(overrides: Partial<React.ComponentProps<typeof TryOnPromptEditor>> = {}) {
  return render(
    <TryOnPromptEditor
      automaticPrompt="Automatic prompt"
      quantity={1}
      referenceMap={referenceMap}
      onChange={vi.fn()}
      {...overrides}
    />,
  );
}

function mockClipboard(reject = false) {
  const writeText = reject
    ? vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
    : vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  return writeText;
}

describe('TryOnPromptEditor reference brief', () => {
  it('copies prompt text exactly through the existing action', async () => {
    const writeText = mockClipboard();
    const manual = '  Keep these exact manual words.\n';
    mount({ promptOverride: manual });
    fireEvent.click(screen.getByRole('button', { name: 'Copy prompt' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(manual));
    expect(screen.queryByRole('textbox', { name: 'Reference brief' })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Prompt copied.');
  });

  it('copies public catalog links in generation order and keeps local files private', async () => {
    const writeText = mockClipboard();
    mount({ promptOverride: 'Use my exact manual prompt.' });
    fireEvent.click(screen.getByRole('button', { name: 'Copy reference brief' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const brief = writeText.mock.calls[0][0] as string;
    expect(brief).toContain('Use my exact manual prompt.\n\nReference images');
    expect(brief).toContain('- Image 1 · Attach this local image separately.');
    expect(brief).toContain(
      '- Image 2 · Clothing · Oxford shirt — ' +
        new URL(TRYON_MATERIALS.find((item) => item.id === 'white-oxford-shirt')!.image, SITE_URL)
          .href,
    );
    expect(brief).toContain('- Image 3 · Attach this local image separately.');
    expect(brief).toContain('- Image 4 · Attach this local image separately.');
    expect(brief).toContain('- Image 5 · Lighting · Window light — ');
    expect(brief).not.toMatch(/private-|builtin-file|lighting-file|blob:|data:|api[_-]?key/i);
    expect(screen.getByRole('status').textContent).toBe('Reference brief copied.');
  });

  it('retains a selectable brief after clipboard denial and reflects later input changes', async () => {
    mockClipboard(true);
    const view = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Copy reference brief' }));
    const field = (await screen.findByRole('textbox', {
      name: 'Reference brief',
    })) as HTMLTextAreaElement;
    expect(field.readOnly).toBe(true);
    expect(field.value).toContain('Automatic prompt');
    expect(screen.getByRole('status').textContent).toBe(
      'Select the reference brief below to copy it.',
    );
    view.rerender(
      <TryOnPromptEditor
        automaticPrompt="Changed prompt"
        quantity={1}
        referenceMap={[]}
        onChange={vi.fn()}
      />,
    );
    expect(field.value).toBe('Changed prompt');
    fireEvent.focus(field);
    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe(field.value.length);
  });

  it('does not export URLs supplied as names or unknown and mismatched material IDs', async () => {
    const writeText = mockClipboard();
    mount({
      referenceMap: [
        { role: 'person', name: 'secret-person.png', materialId: 'white-oxford-shirt' },
        {
          role: 'clothing',
          name: 'blob:https://private/secret',
          materialId: 'data:image/png;base64,private',
        },
        {
          role: 'pose',
          name: 'https://private/image.png?api_key=secret',
          materialId: 'white-oxford-shirt',
        },
      ],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Copy reference brief' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const brief = writeText.mock.calls[0][0] as string;
    expect(brief.match(/Attach this local image separately\./g)).toHaveLength(3);
    expect(brief).not.toMatch(/https?:|secret|private|data:|blob:|api_key/);
  });

  it('explains conversion only for SVG references actually present in the brief', () => {
    const view = mount();
    expect(
      screen.getByText('Convert SVG references to PNG before attaching them to an image model.'),
    ).toBeTruthy();
    view.rerender(
      <TryOnPromptEditor
        automaticPrompt="Automatic prompt"
        quantity={1}
        referenceMap={[
          { role: 'pose', name: 'pose.png', materialId: 'seated-study-front-lineart' },
        ]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Convert SVG references/)).toBeNull();
  });
});
