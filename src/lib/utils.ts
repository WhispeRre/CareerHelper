import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Register custom brand color tokens so tailwind-merge treats them as
// members of the same conflict groups as built-in colors. Without this,
// `cn("bg-primary", "bg-brand")` keeps both classes and Tailwind source
// order (alphabetical) lets `bg-primary` win, defeating brand overrides.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: ["brand", "brand-hover", "brand-muted", "brand-foreground", "brand-ring"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a UUID, with fallback for non-secure contexts (HTTP).
 * crypto.randomUUID() requires HTTPS or localhost.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: manual UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
