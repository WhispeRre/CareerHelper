import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Iridescence initialization', () => {
  it('initializes the shader program before the first resize call reads it', () => {
    const source = readFileSync('src/components/landing/iridescence.tsx', 'utf8');

    expect(source.indexOf('const program = new Program')).toBeLessThan(source.indexOf('resize();'));
  });
});
