import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('LandingHeader scroll states', () => {
  it('floats over the top of the hero and keeps the scrolled glass bar state', () => {
    const source = readFileSync('src/components/landing/landing-header.tsx', 'utf8');

    expect(source).toContain('fixed top-0');
    expect(source).toContain('border-transparent bg-transparent');
    expect(source).toContain('border-zinc-200 bg-white/80 backdrop-blur-lg');
  });
});
