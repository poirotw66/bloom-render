import { describe, expect, it } from 'vitest';
import {
  pruneBatchSelection,
  selectVisibleMaterials,
  toggleBatchSelection,
} from './posewearBatchSelection';

describe('PoseWear batch selection adapter', () => {
  it('toggles exact atomic IDs without mutating the input', () => {
    const original = ['standing-study-back-depth'];
    expect(toggleBatchSelection(original, 'standing-study-back-depth')).toEqual([]);
    expect(toggleBatchSelection(original, 'shirt')).toEqual([...original, 'shirt']);
    expect(original).toEqual(['standing-study-back-depth']);
  });
  it('prunes hidden variants and selects only current visible faces in order', () => {
    expect(pruneBatchSelection(['back-depth', 'front-lineart'], ['back-depth'])).toEqual([
      'back-depth',
    ]);
    expect(selectVisibleMaterials(['back-depth', 'shirt', 'back-depth'])).toEqual([
      'back-depth',
      'shirt',
    ]);
  });
});
