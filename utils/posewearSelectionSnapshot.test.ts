import { describe, expect, it } from 'vitest';
import { captureSelection, restoreSelection } from './posewearSelectionSnapshot';

describe('local selection snapshot', () => {
  it('retains original reference identities without mutable collection aliases', () => {
    const original = { file: new Blob(['local'], { type: 'image/png' }), materialId: 'local-id' };
    const input = { clothing: [original], references: { pose: original } };
    const snapshot = captureSelection(input, 4);
    input.clothing.length = 0;
    delete (input.references as { pose?: typeof original }).pose;
    const restored = restoreSelection(snapshot, 4)!;
    expect(restored.clothing).toEqual([original]);
    expect(restored.references.pose).toBe(original);
    restored.clothing.length = 0;
    expect(restoreSelection(snapshot, 4)!.clothing).toHaveLength(1);
  });
  it('rejects stale revisions even when the current selection becomes empty again', () => {
    const snapshot = captureSelection({ clothing: ['shirt'], references: {} }, 1);
    expect(restoreSelection(snapshot, 3)).toBeNull();
    expect(restoreSelection(null, 1)).toBeNull();
  });
});
