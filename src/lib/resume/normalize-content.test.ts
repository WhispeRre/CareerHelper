import { describe, it, expect } from 'vitest';
import { normalizeSectionContent, toStringArray, normalizeSections } from './normalize-content';

describe('toStringArray', () => {
  it('passes through a clean string array', () => {
    expect(toStringArray(['a', 'b'])).toEqual(['a', 'b']);
  });
  it('drops null/empty entries from arrays', () => {
    expect(toStringArray(['a', null, '', 'b'])).toEqual(['a', 'b']);
  });
  it('wraps a single-line string into a one-element array', () => {
    expect(toStringArray('Led a team of 8')).toEqual(['Led a team of 8']);
  });
  it('splits a multi-line/bulleted string into entries', () => {
    expect(toStringArray('- one\n- two\n* three')).toEqual(['one', 'two', 'three']);
  });
  it('returns [] for null/undefined/empty', () => {
    expect(toStringArray(null)).toEqual([]);
    expect(toStringArray(undefined)).toEqual([]);
    expect(toStringArray('   ')).toEqual([]);
  });
});

describe('normalizeSectionContent — heals renderer-crashing shapes (issue #87)', () => {
  it('coerces work_experience item.highlights written as a string into an array', () => {
    const out = normalizeSectionContent('work_experience', {
      items: [{ id: 'w1', company: 'ACME', highlights: 'Did a thing' }],
    });
    expect(Array.isArray((out.items as any[])[0].highlights)).toBe(true);
    expect((out.items as any[])[0].highlights).toEqual(['Did a thing']);
  });

  it('coerces item.technologies written as a string into an array', () => {
    const out = normalizeSectionContent('projects', {
      items: [{ id: 'p1', name: 'X', technologies: 'React, Node' }],
    });
    expect((out.items as any[])[0].technologies).toEqual(['React, Node']);
  });

  it('coerces skills category.skills written as a string into an array', () => {
    const out = normalizeSectionContent('skills', {
      categories: [{ id: 'c1', name: 'Langs', skills: 'Go\nRust' }],
    });
    expect((out.categories as any[])[0].skills).toEqual(['Go', 'Rust']);
  });

  it('replaces a non-array items with an empty array', () => {
    const out = normalizeSectionContent('education', { items: 'oops' } as any);
    expect(out.items).toEqual([]);
  });

  it('gives non-object item an id and drops it into a safe object', () => {
    const out = normalizeSectionContent('custom', { items: ['just a string'] } as any);
    expect(typeof (out.items as any[])[0].id).toBe('string');
  });

  it('returns a safe default for primitive/null content', () => {
    expect(normalizeSectionContent('projects', 'garbage')).toEqual({ items: [] });
    expect(normalizeSectionContent('skills', null)).toEqual({ categories: [] });
    expect(normalizeSectionContent('summary', 'hi')).toEqual({ text: 'hi' });
  });

  it('is idempotent for already-valid content', () => {
    const valid = { items: [{ id: 'w1', company: 'ACME', highlights: ['a', 'b'], technologies: ['x'] }] };
    const once = normalizeSectionContent('work_experience', valid);
    const twice = normalizeSectionContent('work_experience', once);
    expect(twice).toEqual(once);
    expect((once.items as any[])[0].highlights).toEqual(['a', 'b']);
  });

  it('assigns ids to items/categories missing them', () => {
    const out = normalizeSectionContent('work_experience', { items: [{ company: 'NoId' }] });
    expect(typeof (out.items as any[])[0].id).toBe('string');
  });

  it('leaves absent optional array fields absent (no shape inflation)', () => {
    const out = normalizeSectionContent('certifications', { items: [{ id: 'x1', name: 'AWS' }] });
    expect('highlights' in (out.items as any[])[0]).toBe(false);
  });
});

describe('normalizeSections', () => {
  it('normalizes every section and tolerates a missing list', () => {
    const sections = [
      { type: 'work_experience', content: { items: [{ id: 'w1', highlights: 'one' }] } },
      { type: 'skills', content: { categories: [{ id: 'c1', name: 'L', skills: 'Go' }] } },
    ];
    const out = normalizeSections(sections);
    expect((out[0].content as any).items[0].highlights).toEqual(['one']);
    expect((out[1].content as any).categories[0].skills).toEqual(['Go']);
    expect(normalizeSections(undefined as any)).toEqual([]);
  });
});
