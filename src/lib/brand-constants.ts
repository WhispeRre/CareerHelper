/**
 * Brand color constants for non-CSS contexts.
 *
 * Use these in PDF/HTML export pipelines and any place where Tailwind
 * classes / CSS variables are unavailable. For all in-browser UI, use
 * Tailwind `brand` classes (`bg-brand`, `text-brand`, etc.) instead.
 *
 * Default brand: BOSS green. These constants reflect the LIGHT mode
 * values since exports always render on a white background.
 */

export const BRAND_COLORS = {
  brand: '#00A77F',
  brandHover: '#008463',
  brandMuted: '#CCF4E9',
  brandForeground: '#FFFFFF',
} as const;

export const BRAND_GRADIENT = {
  from: '#00A77F',
  to: '#008463',
} as const;
