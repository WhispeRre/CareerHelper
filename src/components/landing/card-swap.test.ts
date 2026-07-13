import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('CardSwap layout', () => {
  it('uses a flat stack so all cards keep the same visual size', () => {
    const source = readFileSync('src/components/landing/card-swap.tsx', 'utf8');
    const styles = readFileSync('src/components/landing/card-swap.module.css', 'utf8');

    expect(source).toContain('z: 0');
    expect(source).not.toContain('z: -index * distX * 1.5');
    expect(source).not.toContain('z: slot.z');
    expect(styles).not.toContain('perspective: 900px');
  });

  it('renders the initial staggered transform before the animation effect runs', () => {
    const source = readFileSync('src/components/landing/card-swap.tsx', 'utf8');

    expect(source).toContain('getInitialCardStyle');
    expect(source).toContain('transform:');
    expect(source).toContain('translate3d(calc(-50% + ${slot.x}px), calc(-50% + ${slot.y}px), 0)');
    expect(source).toContain('zIndex: slot.zIndex');
  });
});
