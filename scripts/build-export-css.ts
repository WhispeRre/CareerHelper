/**
 * Build-time script: generates Tailwind v4 CSS for PDF/HTML export.
 *
 * Scans export template files for Tailwind class names, compiles them using
 * the same Tailwind v4 engine used in the preview, and outputs a TS module
 * containing the CSS string constant.
 *
 * Usage: tsx scripts/build-export-css.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compile } from 'tailwindcss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const EXPORT_TEMPLATES_DIR = path.join(ROOT, 'src/app/api/resume/[id]/export/templates');
const EXPORT_UTILS = path.join(ROOT, 'src/app/api/resume/[id]/export/utils.ts');
const EXPORT_BUILDERS = path.join(ROOT, 'src/app/api/resume/[id]/export/builders.ts');
const OUTPUT_FILE = path.join(ROOT, 'src/lib/pdf/export-tailwind-css.ts');

// Resolve the tailwindcss package root for loading stylesheets
const TW_PKG_DIR = path.dirname(
  require.resolve('tailwindcss/package.json'),
);

/**
 * Extract Tailwind candidate class names from source code.
 *
 * Uses a permissive approach: extract all token-like substrings that could be
 * Tailwind utility classes (including arbitrary values like w-[35%], max-w-[210mm]).
 * Invalid candidates are silently ignored by Tailwind's compiler.build().
 */
function extractCandidates(source: string): Set<string> {
  const candidates = new Set<string>();

  // This regex matches any token that looks like a Tailwind class:
  //  - Optionally starts with ! (important modifier) or - (negative)
  //  - Starts with a letter
  //  - Followed by word chars and hyphens
  //  - May contain arbitrary value brackets: [35%], [210mm], [#1a1a1a]
  //  - May have variant prefixes: sm:, hover:, dark:, etc.
  // Examples: flex, w-[35%], max-w-[210mm], text-sm, bg-slate-800, hover:bg-blue-500
  const TOKEN_RE = /[!-]?[a-zA-Z][a-zA-Z0-9_.-]*(?:\[[^\]\s]+\])?(?:[a-zA-Z0-9_.-]*(?:\[[^\]\s]+\])?)*(?:\/[a-zA-Z0-9._-]+)?/g;

  // Variant prefix pattern (to capture things like sm:flex, hover:text-blue-500)
  const VARIANT_RE = /(?:[a-z][a-z0-9-]*:)+/;

  for (const m of source.matchAll(TOKEN_RE)) {
    const token = m[0];
    // Skip common non-Tailwind tokens (JS keywords, imports, etc.)
    if (token.length < 2) continue;
    if (/^(?:if|else|for|while|const|let|var|return|import|export|from|type|as|function|class|new|this|null|undefined|true|false|void|typeof|instanceof|switch|case|break|continue|default|throw|try|catch|finally|interface|enum|extends|implements|static|async|await|yield|get|set|of|in|do|delete|super|with|debugger)$/.test(token)) continue;
    candidates.add(token);
  }

  return candidates;
}

/**
 * Remove @layer wrappers from CSS while preserving the content.
 * This is necessary because Chrome's print/PDF engine mishandles
 * flexbox page fragmentation when utilities sit inside @layer.
 */
function unwrapLayers(css: string): string {
  // Remove standalone @layer declarations (e.g. '@layer properties;')
  let result = css.replace(/@layer\s+[^{]+;\s*/g, '');

  // Unwrap @layer blocks — replace '@layer name { ... }' with just '...'
  let output = '';
  let i = 0;
  while (i < result.length) {
    const layerMatch = result.slice(i).match(/^@layer\s+[\w-]+\s*\{/);
    if (layerMatch) {
      i += layerMatch[0].length;
      // Find the matching closing brace (handling nested braces)
      let depth = 1;
      let j = i;
      while (j < result.length && depth > 0) {
        if (result[j] === '{') depth++;
        else if (result[j] === '}') depth--;
        if (depth > 0) j++;
      }
      output += result.slice(i, j);
      i = j + 1;
    } else {
      output += result[i];
      i++;
    }
  }
  return output;
}

async function main() {
  console.log('[build-export-css] Scanning export templates...');

  // Collect all source files to scan
  const files: string[] = [];

  // Export templates
  for (const f of fs.readdirSync(EXPORT_TEMPLATES_DIR)) {
    if (f.endsWith('.ts')) {
      files.push(path.join(EXPORT_TEMPLATES_DIR, f));
    }
  }

  // Export utils and builders (they contain class strings too)
  files.push(EXPORT_UTILS, EXPORT_BUILDERS);

  // Extract all candidates
  const allCandidates = new Set<string>();
  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8');
    for (const c of extractCandidates(source)) {
      allCandidates.add(c);
    }
  }

  console.log(`[build-export-css] Found ${allCandidates.size} candidate classes from ${files.length} files`);

  // Compile with Tailwind v4
  const compiler = await compile('@import "tailwindcss";', {
    loadStylesheet: async (id: string, base: string) => {
      let filePath: string;
      if (id === 'tailwindcss') {
        filePath = path.join(TW_PKG_DIR, 'index.css');
      } else if (id.startsWith('tailwindcss/')) {
        filePath = path.join(TW_PKG_DIR, id.replace('tailwindcss/', ''));
      } else {
        filePath = path.resolve(base, id);
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return { path: filePath, content, base: path.dirname(filePath) };
    },
  });

  let css = compiler.build([...allCandidates]);

  // Strip @layer wrappers from the CSS output.
  // Chrome's print engine breaks multi-page flex layouts when utilities are
  // inside @layer (non-layered PDF override CSS wins over layered flex/width
  // utilities during page fragmentation). Unwrapping keeps the same rules
  // but with normal cascade specificity, matching Tailwind v3 CDN behaviour.
  css = unwrapLayers(css);

  console.log(`[build-export-css] Generated ${css.length} bytes of CSS (layers unwrapped)`);

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write as TS module
  const tsContent = `// Auto-generated by scripts/build-export-css.ts — DO NOT EDIT
// Contains compiled Tailwind v4 CSS for PDF/HTML export
// This ensures export uses the same Tailwind version as the preview

export const EXPORT_TAILWIND_CSS = ${JSON.stringify(css)};
`;

  fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf8');
  console.log(`[build-export-css] Written to ${path.relative(ROOT, OUTPUT_FILE)}`);
}

main().catch((err) => {
  console.error('[build-export-css] Failed:', err);
  process.exit(1);
});
