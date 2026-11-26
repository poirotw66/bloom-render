// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateVirtualTryOn, prepareTryOnRequest } from './tryOn';
import { runImageGeneration } from './runImageGeneration';

vi.mock('./runImageGeneration', () => ({
  runImageGeneration: vi.fn().mockResolvedValue('data:image/png;base64,result'),
}));
const photo = (name: string) => new File([name], name, { type: 'image/png' });
beforeEach(() => vi.mocked(runImageGeneration).mockClear());

describe('try-on reference requests', () => {
  it('uses a manual prompt exactly while preserving image ordering', () => {
    const person = photo('person'),
      shirt = photo('shirt'),
      pose = photo('pose');
    const prepared = prepareTryOnRequest(person, [shirt], {
      promptOverride: 'My exact prompt.\nKeep this line.',
      referenceFiles: { pose },
      variationIndex: 2,
    });
    expect(prepared.prompt).toBe('My exact prompt.\nKeep this line.');
    expect(prepared.images).toEqual([person, shirt, pose]);
  });
  it.each(['', '   ', 'x'.repeat(8001)])('rejects an unusable manual prompt', (promptOverride) => {
    expect(() =>
      prepareTryOnRequest(photo('person'), [photo('shirt')], { promptOverride }),
    ).toThrow('error.invalid_request');
  });
  it('sends person, garments and optional references in a stable declared order', async () => {
    const person = photo('person'),
      shirt = photo('shirt'),
      trousers = photo('trousers');
    const pose = photo('pose'),
      expression = photo('expression'),
      scene = photo('scene'),
      lighting = photo('lighting');
    await generateVirtualTryOn(person, [shirt, trousers], {
      referenceFiles: { lighting, scene, pose, expression },
      keepBackground: true,
      keepPose: true,
      variationIndex: 1,
    });
    const request = vi.mocked(runImageGeneration).mock.calls[0][0];
    expect(request.images).toEqual([person, shirt, trousers, pose, expression, scene, lighting]);
    expect(request.prompt).toContain('Image 4 is the pose reference');
    expect(request.prompt).toContain('Image 5 is the expression reference');
    expect(request.prompt).toContain('Image 6 is the scene reference');
    expect(request.prompt).toContain('Image 7 is the lighting reference');
    expect(request.prompt).toContain('Replace the original background using the scene reference');
    expect(request.prompt).not.toContain('Keep the original background');
    expect(request.prompt).not.toContain('Keep the original body posture');
    expect(request.prompt).toContain(
      'Do not override the selected scene, pose, expression or lighting',
    );
  });
  it('preserves background and pose without contradictory scene or pose variations', () => {
    const { prompt } = prepareTryOnRequest(photo('person'), [photo('shirt')], {
      keepBackground: true,
      keepPose: true,
      backgroundHint: 'snowy mountains',
      variationIndex: 2,
    });
    expect(prompt).toContain('Keep the original background');
    expect(prompt).toContain('Keep the original body posture');
    expect(prompt).not.toContain('snowy mountains');
    expect(prompt).not.toContain('Create a new scene');
  });
  it('uses chosen scene and original posture by default and records effective resolution', () => {
    const prepared = prepareTryOnRequest(photo('person'), [photo('shirt')], {
      backgroundHint: 'a cafe',
      outputSize: '4K',
      settings: { model: 'gemini-2.5-flash-image' },
    });
    expect(prepared.prompt).toContain('Create a new scene. a cafe');
    expect(prepared.prompt).toContain('Keep the original body posture');
    expect(prepared.effectiveSize).toBe('1K');
    expect(prepared.imageSize).toBeUndefined();
  });
  it('lets the lighting reference override preserved lighting without importing a reference face', () => {
    const { prompt } = prepareTryOnRequest(photo('person'), [photo('shirt')], {
      keepBackground: true,
      referenceFiles: { lighting: photo('light'), expression: photo('expression') },
    });
    expect(prompt).not.toContain(
      'Keep the original background, framing and environmental lighting',
    );
    expect(prompt).toContain('Transfer only the facial expression');
    expect(prompt).toContain('Match the lighting reference instead of the original lighting');
  });
});
