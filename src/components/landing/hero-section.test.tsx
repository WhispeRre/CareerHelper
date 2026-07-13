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

  it('uses the stacked resume showcase instead of rendering template thumbnails inline', () => {
    const source = readFileSync('src/components/landing/hero-section.tsx', 'utf8');

    expect(source).toContain("import { HeroResumeShowcase } from './hero-resume-showcase'");
    expect(source).toContain('<HeroResumeShowcase');
    expect(source).not.toContain("import { TemplateThumbnail } from '@/components/dashboard/template-thumbnail'");
  });

  it('uses split text animation for the main hero title', () => {
    const source = readFileSync('src/components/landing/hero-section.tsx', 'utf8');

    expect(source).toContain("import SplitText from './split-text'");
    expect(source).toContain('<SplitText');
    expect(source).toContain("const titleLines = t('title').split('\\n')");
    expect(source).toContain('titleLines.map');
    expect(source).toContain('tag="span"');
    expect(source).toContain('block');
  });

  it('uses split text animation for the hero subtitle too', () => {
    const source = readFileSync('src/components/landing/hero-section.tsx', 'utf8');

    expect(source).toContain("const subtitleLines = t('subtitle').split('\\n')");
    expect(source).toContain('subtitleLines.map');
    expect(source).toContain('tag="span"');
  });
});
