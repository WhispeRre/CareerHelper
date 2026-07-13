import { describe, expect, it } from 'vitest';

import { hexToVec3 } from './soft-aurora-utils';

describe('hexToVec3', () => {
  it('converts a six-digit hex color to normalized RGB values', () => {
    expect(hexToVec3('#00ff80')).toEqual([0, 1, 128 / 255]);
  });

  it('accepts hex colors without a leading hash', () => {
    expect(hexToVec3('ffffff')).toEqual([1, 1, 1]);
  });
});
