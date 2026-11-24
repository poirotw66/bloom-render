import { describe, expect, it } from 'vitest';
import { parseTryOnRecipe, type TryOnRecipe } from './tryOnRecipe';
const recipe: TryOnRecipe = {
  v: 1,
  kind: 'tryon',
  materialIds: ['white-shirt'],
  settings: {
    background: 'studio',
    style: 'editorial_high',
    quantity: 2,
    outputSize: '1K',
    aspectRatio: '9:16',
    keepBackground: true,
    keepPose: true,
  },
};
describe('try-on recipe boundary', () => {
  it('accepts portable settings and material ids', () =>
    expect(parseTryOnRecipe(recipe)).toEqual(recipe));
  it.each([
    { ...recipe, apiKey: 'secret' },
    { ...recipe, photo: 'blob:private' },
    { ...recipe, materialIds: ['https://example.com/photo.png'] },
    { ...recipe, materialIds: ['same', 'same'] },
    { ...recipe, settings: { ...recipe.settings, quantity: 9 } },
    { ...recipe, settings: { ...recipe.settings, background: 'unknown' } },
    { ...recipe, settings: { ...recipe.settings, apiKey: 'secret' } },
  ])('rejects credentials, images, unsupported settings and duplicate references', (invalid) =>
    expect(parseTryOnRecipe(invalid)).toBeNull(),
  );
});
