import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HeroResumeShowcase layout', () => {
  it('positions a wide staggered card stack toward the center on desktop', () => {
    const source = readFileSync('src/components/landing/hero-resume-showcase.tsx', 'utf8');

    expect(source).toContain('clamp(430px, 48vw, 760px)');
    expect(source).toContain('clamp(310px, 38vw, 560px)');
    expect(source).toContain('cardDistance={108}');
    expect(source).toContain('verticalDistance={62}');
    expect(source).toContain('lg:left-12');
    expect(source).not.toContain('lg:left-[-5rem]');
  });

  it('uses a denser hero-specific resume preview inside the wide cards', () => {
    const source = readFileSync('src/components/landing/hero-resume-showcase.tsx', 'utf8');

    expect(source).toContain('function HeroResumePreview');
    expect(source).toContain('function ModernPreview');
    expect(source).toContain('function ClassicPreview');
    expect(source).toContain('function MinimalPreview');
    expect(source).toContain('<HeroResumePreview variant={template}');
    expect(source).not.toContain('TemplateThumbnail');
  });

  it('keeps the card animation running while hovered', () => {
    const source = readFileSync('src/components/landing/hero-resume-showcase.tsx', 'utf8');

    expect(source).not.toContain('pauseOnHover');
  });

  it('uses English labels for the stacked card headers', () => {
    const source = readFileSync('src/components/landing/hero-resume-showcase.tsx', 'utf8');

    expect(source).toContain("title: 'AI Optimized'");
    expect(source).toContain("accent: 'bg-pink-500'");
    expect(source).toContain("title: 'Multi-Template'");
    expect(source).toContain("title: 'ATS Friendly'");
    expect(source).not.toContain('智能优化');
    expect(source).not.toContain('多模板适配');
    expect(source).not.toContain('ATS 友好');
  });

  it('adds pink accents inside the resume preview content', () => {
    const source = readFileSync('src/components/landing/hero-resume-showcase.tsx', 'utf8');

    expect(source).toContain('bg-pink-500');
    expect(source).toContain('bg-pink-400');
  });
});
