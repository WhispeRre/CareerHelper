import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HeroSection background', () => {
  it('renders the Iridescence animated background', () => {
    const source = readFileSync('src/components/landing/hero-section.tsx', 'utf8');

    expect(source).toContain("import Iridescence from './iridescence'");
    expect(source).toContain('<Iridescence');
  });

  it('lets the animated hero background reach the top behind a fixed header', () => {
    const source = readFileSync('src/components/landing/hero-section.tsx', 'utf8');

    expect(source).toContain('pt-24');
    expect(source).toContain('absolute inset-0 z-0 overflow-hidden');
  });

  it('softens the transition from the animated hero background into the next section', () => {
    const source = readFileSync('src/components/landing/hero-section.tsx', 'utf8');

    expect(source).toContain('bottom-0');
    expect(source).toContain('bg-gradient-to-b');
    expect(source).toContain('to-white');
  });
});
