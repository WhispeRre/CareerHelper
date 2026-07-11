/**
 * Structural normalization for resume section content.
 *
 * The AI edit/generate tools ask the model to return structured JSON, but the
 * model sometimes writes list fields as plain strings (e.g. `highlights` as a
 * newline-separated string instead of `string[]`). The renderers assume arrays
 * and call `.map` / `.join`, so a non-empty string passes a `.length > 0` guard
 * and then throws — crashing the whole editor with no way to reopen the resume
 * (issue #87). This module coerces content into the shape the renderers expect.
 *
 * It is idempotent and non-destructive for already-valid content, so it is safe
 * to run both on write (AI tools / generation) and on read (healing resumes
 * whose content was already corrupted before this fix shipped).
 */

// Item-based sections whose content is `{ items: [...] }`.
const ITEM_SECTION_TYPES = new Set([
  'work_experience',
  'education',
  'projects',
  'certifications',
  'languages',
  'github',
  'custom',
  'qr_codes',
]);

// Fields inside an item that MUST be string arrays (renderers call .map/.join).
const ITEM_ARRAY_FIELDS = ['highlights', 'technologies'];

function genId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}

function asObject(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Coerce any value into a clean string[]. A single string is split on newlines
 *  (the common way the model returns a bullet list as one blob) so it becomes
 *  multiple entries rather than one giant line. */
export function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x) => x != null && x !== '').map((x) => (typeof x === 'string' ? x : String(x)));
  }
  if (v == null) return [];
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (!trimmed) return [];
    const parts = trimmed
      .split(/\r?\n/)
      .map((s) => s.replace(/^\s*[-*•]\s?/, '').trim())
      .filter(Boolean);
    return parts.length > 1 ? parts : [trimmed];
  }
  return [String(v)];
}

/**
 * Return a structurally-safe copy of a section's content for the given type.
 * Never throws; falls back to an empty-but-valid structure for junk input.
 */
export function normalizeSectionContent(type: string, rawContent: unknown): Record<string, unknown> {
  const content = asObject(rawContent);

  if (type === 'skills') {
    const base = content ?? {};
    const cats = Array.isArray(base.categories) ? base.categories : [];
    return {
      ...base,
      categories: cats.map((c) => {
        const cat = asObject(c);
        if (!cat) return { id: genId(), name: '', skills: [] };
        return { ...cat, id: cat.id || genId(), skills: toStringArray(cat.skills) };
      }),
    };
  }

  if (ITEM_SECTION_TYPES.has(type)) {
    const base = content ?? {};
    const items = Array.isArray(base.items) ? base.items : [];
    return {
      ...base,
      items: items.map((it) => {
        const item = asObject(it);
        if (!item) return { id: genId() };
        const next: Record<string, unknown> = { ...item, id: item.id || genId() };
        for (const field of ITEM_ARRAY_FIELDS) {
          // Only coerce a field that is present but the wrong type; leave
          // legitimately-absent optional fields (e.g. certifications.highlights)
          // untouched so we don't inflate the stored shape.
          if (field in next && !Array.isArray(next[field])) {
            next[field] = toStringArray(next[field]);
          }
        }
        return next;
      }),
    };
  }

  // summary / personal_info / other object sections.
  if (!content) {
    if (type === 'summary') return { text: rawContent == null ? '' : String(rawContent) };
    return {};
  }
  return content;
}

/** Normalize the content of every section in a list (used on resume load). */
export function normalizeSections<T extends { type: string; content: unknown }>(sections: T[]): T[] {
  return (sections || []).map((s) => ({
    ...s,
    content: normalizeSectionContent(s.type, s.content) as T['content'],
  }));
}
