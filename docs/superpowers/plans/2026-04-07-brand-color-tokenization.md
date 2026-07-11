# Brand Color Tokenization & BOSS Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把全站硬编码的 `pink-*` 替换为语义化 `brand` token，默认使用 BOSS 直聘青绿配色，支持一键切换 Blue alternate 备选方案，并在简历预设中新增 BOSS 模板。

**Architecture:** 在 `globals.css` 通过 CSS 变量定义 `--brand` 系列 token，由 Tailwind `@theme inline` 注册为 `bg-brand` / `text-brand` 等工具类；通过 `<html data-brand="blue">` 切换备选；机械替换 60+ 文件的 `pink-*` 引用；导出/PDF 渲染层抽常量到 `brand-constants.ts`；编辑器 `PRESET_THEMES` 追加 `boss` 简历预设；新增 `BrandProvider` + `BrandSwitcher` UI（Header 头像菜单）。

**Tech Stack:** Next.js 16 / React 19 / Tailwind CSS 4 (oklch) / shadcn-ui / next-intl / next-themes

**Spec:** `docs/superpowers/specs/2026-04-07-brand-color-tokenization-design.md`

---

## Task 1: 在 globals.css 注册 brand CSS 变量与 Tailwind 颜色族

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: 在 `@theme inline` 块新增 brand color 映射**

在 `src/app/globals.css` 第 47 行 `--radius-4xl` 之后插入：

```css
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-brand-hover: var(--brand-hover);
  --color-brand-muted: var(--brand-muted);
  --color-brand-ring: var(--brand-ring);
```

- [ ] **Step 2: 在 `:root` 块尾部追加 BOSS 默认 brand 变量**

在 `src/app/globals.css` 的 `:root` 块（第 50-83 行）`--sidebar-ring` 之后插入：

```css
  /* Brand: BOSS green (default) */
  --brand: oklch(0.64 0.15 168);
  --brand-foreground: oklch(1 0 0);
  --brand-hover: oklch(0.56 0.14 168);
  --brand-muted: oklch(0.94 0.05 168);
  --brand-ring: oklch(0.64 0.15 168 / 40%);
```

- [ ] **Step 3: 在 `.dark` 块尾部追加 dark 模式 brand 变量**

在 `.dark` 块（第 85-117 行）`--sidebar-ring` 之后插入：

```css
  --brand: oklch(0.83 0.16 168);
  --brand-foreground: oklch(0.20 0.05 168);
  --brand-hover: oklch(0.74 0.16 168);
  --brand-muted: oklch(0.32 0.08 168);
  --brand-ring: oklch(0.83 0.16 168 / 40%);
```

- [ ] **Step 4: 追加 Blue 备选 brand 选择器（在 `.dark` 块之后）**

在 `src/app/globals.css` 第 118 行（`.dark` 块结束的 `}` 之后）插入：

```css
[data-brand="blue"] {
  --brand: oklch(0.62 0.17 162);
  --brand-foreground: oklch(1 0 0);
  --brand-hover: oklch(0.55 0.17 162);
  --brand-muted: oklch(0.95 0.05 162);
  --brand-ring: oklch(0.62 0.17 162 / 40%);
}

.dark[data-brand="blue"],
[data-brand="blue"] .dark {
  --brand: oklch(0.78 0.15 162);
  --brand-foreground: oklch(0.18 0.04 162);
  --brand-hover: oklch(0.696 0.17 162.5);
  --brand-muted: oklch(0.32 0.08 162);
  --brand-ring: oklch(0.78 0.15 162 / 40%);
}
```

- [ ] **Step 5: 修改 `.landing-cta-bg` 渐变使用 brand 变量**

将 `src/app/globals.css` 第 148-154 行替换为：

```css
.landing-cta-bg {
  background: linear-gradient(135deg, var(--brand), var(--brand-hover));
}
```

（删除原 `.dark .landing-cta-bg` 单独覆写——变量层已经处理 dark 模式）

- [ ] **Step 6: 修改 ai-markdown code 样式（pink → brand）**

将 `src/app/globals.css` 第 240-241 行：

```css
.ai-markdown code {
  @apply rounded bg-zinc-200/60 px-1 py-0.5 text-xs text-pink-600 dark:bg-zinc-700/60 dark:text-pink-400;
}
```

替换为：

```css
.ai-markdown code {
  @apply rounded bg-zinc-200/60 px-1 py-0.5 text-xs text-brand dark:bg-zinc-700/60;
}
```

- [ ] **Step 7: 修改 ai-markdown blockquote 样式（pink → brand）**

将 `src/app/globals.css` 第 257-258 行：

```css
.ai-markdown blockquote {
  @apply mb-2 border-l-2 border-pink-300 pl-2.5 text-zinc-500 dark:text-zinc-400 last:mb-0;
}
```

替换为：

```css
.ai-markdown blockquote {
  @apply mb-2 border-l-2 border-brand pl-2.5 text-zinc-500 dark:text-zinc-400 last:mb-0;
}
```

- [ ] **Step 8: 验证 Tailwind 编译通过**

Run: `pnpm dev` （等待 ready 后 ctrl-c）
Expected: 无 CSS 编译报错，无 "unknown utility class" 警告

- [ ] **Step 9: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): introduce brand color tokens with BOSS default + Blue alt"
```

---

## Task 2: 创建 brand-constants.ts 用于导出/PDF 渲染层

**Files:**
- Create: `src/lib/brand-constants.ts`

- [ ] **Step 1: 创建常量文件**

创建 `src/lib/brand-constants.ts`：

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/brand-constants.ts
git commit -m "feat(theme): add brand-constants for export/PDF render contexts"
```

---

## Task 3: 机械替换 src/components 与 src/app 中的 pink → brand（UI 层）

**Files:**
- Modify: 全部 `src/components/**/*.tsx` 与 `src/app/**/*.tsx`（约 55 个文件）
- **不要动**：`src/app/api/**/*.ts`（API/导出层在 Task 4 单独处理）
- **不要动**：`src/components/preview/templates/gradient.tsx` 与 `infographic.tsx`（这两个是简历模板渲染，颜色由 themeConfig 注入，pink 是其默认值的一部分，归 Task 5 处理）

**替换映射表（严格按此表执行）：**

| Old | New |
|---|---|
| `bg-pink-500` | `bg-brand` |
| `bg-pink-600` | `bg-brand-hover` |
| `bg-pink-400` | `bg-brand` |
| `bg-pink-50` | `bg-brand-muted` |
| `bg-pink-100` | `bg-brand-muted` |
| `bg-pink-950/30` | `bg-brand-muted` |
| `hover:bg-pink-600` | `hover:bg-brand-hover` |
| `hover:bg-pink-700` | `hover:bg-brand-hover` |
| `hover:bg-pink-50` | `hover:bg-brand-muted` |
| `text-pink-500` | `text-brand` |
| `text-pink-600` | `text-brand` |
| `text-pink-700` | `text-brand` |
| `text-pink-300` | `text-brand` |
| `text-pink-400` | `text-brand` |
| `hover:text-pink-600` | `hover:text-brand` |
| `border-pink-500` | `border-brand` |
| `border-pink-300` | `border-brand` |
| `border-pink-100` | `border-brand-muted` |
| `border-pink-200` | `border-brand-muted` |
| `dark:border-pink-900` | `dark:border-brand-muted` |
| `dark:bg-pink-950/30` | `dark:bg-brand-muted` |
| `dark:text-pink-300` | `dark:text-brand` |
| `dark:text-pink-400` | `dark:text-brand` |
| `ring-pink-500` | `ring-brand` |
| `focus:ring-pink-500` | `focus:ring-brand` |
| `from-pink-500` | `from-brand` |
| `to-pink-500` | `to-brand` |
| `to-pink-400` | `to-brand-hover` |
| `to-rose-500` | `to-brand-hover` |
| `from-rose-500` | `from-brand-hover` |
| `via-pink-500` | `via-brand` |
| `shadow-pink-500/10` | `shadow-brand/10` |
| `shadow-pink-500/20` | `shadow-brand/20` |

- [ ] **Step 1: 列出待修改文件**

Run:
```bash
grep -rl "pink-\|fuchsia-\|rose-500\|from-rose\|to-rose" /Users/chenhao/codes/myself/careerhelper/src/components /Users/chenhao/codes/myself/careerhelper/src/app --include="*.tsx" | grep -v "preview/templates/gradient" | grep -v "preview/templates/infographic"
```

Expected: 列出 ~55 个文件路径

- [ ] **Step 2: 执行机械替换**

按映射表用 Edit 工具逐文件 `replace_all` 执行。**严格按表中顺序**（先长串后短串，避免 `bg-pink-500` 替换后影响 `pink-500`）。

每个文件内对每条命中的映射执行一次 `Edit replace_all`。

- [ ] **Step 3: 验证 UI 层 pink 残留为 0**

Run:
```bash
grep -rn "pink-\|fuchsia-\|to-rose-500\|from-rose-500" /Users/chenhao/codes/myself/careerhelper/src/components /Users/chenhao/codes/myself/careerhelper/src/app --include="*.tsx" | grep -v "preview/templates/gradient" | grep -v "preview/templates/infographic"
```

Expected: 无输出（或仅剩 lib/interview/interviewers.ts 之类常量文件，本任务不处理）

- [ ] **Step 4: 类型检查**

Run: `pnpm tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: 启动 dev server 烟雾测试**

Run: `pnpm dev`，浏览器打开 `http://localhost:3000`，肉眼检查首页、Dashboard、Templates、Editor 四个核心页面在 light + dark 模式下不再出现亮粉色按钮/边框。Ctrl-C 退出。

Expected: 四个页面色调为青绿（BOSS）系，dark 模式下青绿提亮版本无刺眼问题。

- [ ] **Step 6: Commit**

```bash
git add src/components src/app
git commit -m "refactor(theme): replace hardcoded pink-* with brand tokens across UI"
```

---

## Task 4: 处理导出/API 层硬编码颜色（PDF/HTML/DOCX）

**Files:**
- Modify: `src/app/api/resume/[id]/export/templates/infographic.ts`
- Modify: `src/app/api/resume/[id]/export/templates/gradient.ts`
- Modify: `src/app/api/resume/[id]/export/docx.ts`
- Modify: `src/app/api/interview/[id]/report/export/html.ts`

- [ ] **Step 1: 定位导出层硬编码 pink hex**

Run:
```bash
grep -n "ec4899\|db2777\|f472b6\|pink" /Users/chenhao/codes/myself/careerhelper/src/app/api/resume/[id]/export/templates/infographic.ts /Users/chenhao/codes/myself/careerhelper/src/app/api/resume/[id]/export/templates/gradient.ts /Users/chenhao/codes/myself/careerhelper/src/app/api/resume/[id]/export/docx.ts /Users/chenhao/codes/myself/careerhelper/src/app/api/interview/[id]/report/export/html.ts
```

Expected: 列出每个文件中具体的 hex/类名

- [ ] **Step 2: 在每个文件顶部 import brand 常量**

```ts
import { BRAND_COLORS } from '@/lib/brand-constants';
```

- [ ] **Step 3: 替换 hex 引用**

对每个 `#ec4899` / `#db2777` / `#f472b6` 替换为 `BRAND_COLORS.brand` / `BRAND_COLORS.brandHover` / `BRAND_COLORS.brandMuted`。注意是字符串模板里的，需要用模板字符串语法 `${BRAND_COLORS.brand}`。

> **特殊说明**：`infographic.ts` 和 `gradient.ts` 是**简历模板渲染**，应优先使用 `themeConfig.accentColor`（如果调用方传入），fallback 才用 `BRAND_COLORS.brand`。具体改法：
> - 找到原 hex 出现的位置
> - 如果上下文已有 `accentColor` 变量 → 用 `accentColor`
> - 否则 → `BRAND_COLORS.brand`

- [ ] **Step 4: 类型检查**

Run: `pnpm tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: 验证导出层 pink 残留**

Run:
```bash
grep -n "ec4899\|db2777\|f472b6" /Users/chenhao/codes/myself/careerhelper/src/app/api/resume/[id]/export/templates/infographic.ts /Users/chenhao/codes/myself/careerhelper/src/app/api/resume/[id]/export/templates/gradient.ts /Users/chenhao/codes/myself/careerhelper/src/app/api/resume/[id]/export/docx.ts /Users/chenhao/codes/myself/careerhelper/src/app/api/interview/[id]/report/export/html.ts
```

Expected: 无输出

- [ ] **Step 6: Commit**

```bash
git add src/app/api src/lib/brand-constants.ts
git commit -m "refactor(export): use brand-constants in PDF/HTML/DOCX export pipelines"
```

---

## Task 5: 简历模板渲染层（gradient/infographic）颜色处理

**Files:**
- Modify: `src/components/preview/templates/gradient.tsx`
- Modify: `src/components/preview/templates/infographic.tsx`

> 这两个模板里的 pink 是 **简历模板的默认配色**，用户可以通过 themeConfig.accentColor 覆盖。本任务确保它们也能 fallback 到 brand 常量而不是硬编码 pink。

- [ ] **Step 1: 检视当前实现**

Run: `grep -n "pink\|#ec4899\|#db2777\|#f472b6" /Users/chenhao/codes/myself/careerhelper/src/components/preview/templates/gradient.tsx /Users/chenhao/codes/myself/careerhelper/src/components/preview/templates/infographic.tsx`

判断每处 pink 是：
- (a) 默认 fallback 颜色（应改为 `BRAND_COLORS.brand`）
- (b) 装饰性渐变（保留 pink，因为这是模板的视觉特征）

- [ ] **Step 2: 仅替换 (a) 类用法，保留 (b)**

对 (a) 类：import `BRAND_COLORS` 并替换。
对 (b) 类：保留原样并在该处添加注释 `// intentional: gradient template visual identity`。

- [ ] **Step 3: 类型检查 + dev 烟雾测试**

Run: `pnpm tsc --noEmit && pnpm dev`，编辑器中切到 gradient / infographic 模板，确认渲染正常。

- [ ] **Step 4: Commit**

```bash
git add src/components/preview/templates
git commit -m "refactor(templates): use brand fallback in gradient/infographic resume templates"
```

---

## Task 6: PRESET_THEMES 新增 BOSS 简历预设 + i18n

**Files:**
- Modify: `src/components/editor/theme-editor.tsx`
- Modify: `messages/zh.json`
- Modify: `messages/en.json`

- [ ] **Step 1: 在 `PRESET_THEMES` 数组追加 boss 预设**

`src/components/editor/theme-editor.tsx` 的 `PRESET_THEMES` 数组（第 49-128 行）末尾、`creative` 之后追加：

```ts
  {
    id: 'boss',
    colors: ['#0A1F44', '#00C897', '#F5FBFA', '#334155'],
    config: {
      primaryColor: '#0A1F44',
      accentColor: '#00C897',
      fontFamily: 'Inter',
      fontSize: 'medium',
      lineSpacing: 1.55,
      margin: { top: 22, right: 22, bottom: 22, left: 22 },
      sectionSpacing: 15,
    },
  },
```

- [ ] **Step 2: 中文 i18n 追加**

修改 `messages/zh.json` 第 292-299 行的 `themeEditor.preset` 块，在 `"creative": "创意"` 之后追加：

```json
      "creative": "创意",
      "boss": "BOSS 直聘"
```

（注意逗号位置）

- [ ] **Step 3: 英文 i18n 追加**

在 `messages/en.json` 对应的 `themeEditor.preset` 块追加：

```json
      "creative": "Creative",
      "boss": "BOSS Style"
```

- [ ] **Step 4: 验证编辑器中 boss 预设可点选**

Run: `pnpm dev`，打开任一简历的编辑器，点开 ThemeEditor 侧栏 → "预设主题"，确认 BOSS 直聘卡片出现且点击后简历内容颜色变为深蓝灰 + BOSS 绿。

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/theme-editor.tsx messages/zh.json messages/en.json
git commit -m "feat(theme): add BOSS preset to resume theme editor"
```

---

## Task 7: 创建 BrandProvider + 防闪 inline script

**Files:**
- Create: `src/components/layout/brand-provider.tsx`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: 创建 BrandProvider**

创建 `src/components/layout/brand-provider.tsx`：

```tsx
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Brand = 'boss' | 'blue';

const STORAGE_KEY = 'careerhelper-brand';

interface BrandContextValue {
  brand: Brand;
  setBrand: (brand: Brand) => void;
}

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrandState] = useState<Brand>('boss');

  useEffect(() => {
    const stored = (typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY) as Brand | null)
      : null);
    if (stored === 'blue' || stored === 'boss') {
      setBrandState(stored);
      applyBrand(stored);
    }
  }, []);

  const setBrand = (next: Brand) => {
    setBrandState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
    }
    applyBrand(next);
  };

  return <BrandContext.Provider value={{ brand, setBrand }}>{children}</BrandContext.Provider>;
}

function applyBrand(brand: Brand) {
  if (typeof document === 'undefined') return;
  if (brand === 'boss') {
    document.documentElement.removeAttribute('data-brand');
  } else {
    document.documentElement.setAttribute('data-brand', brand);
  }
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
}
```

- [ ] **Step 2: 在 layout 内联防闪 script**

打开 `src/app/[locale]/layout.tsx`，找到 `<head>` 或 `<html>` 区域，在 `<body>` 之前插入：

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{var b=localStorage.getItem('careerhelper-brand');if(b==='blue'){document.documentElement.setAttribute('data-brand','blue');}}catch(e){}})();`,
  }}
/>
```

- [ ] **Step 3: 在 ThemeProvider 同层包裹 BrandProvider**

在 `src/app/[locale]/layout.tsx` 找到 `<ThemeProvider>` 标签，把它的子内容用 `<BrandProvider>` 再包一层：

```tsx
<ThemeProvider ...>
  <BrandProvider>
    {children}
  </BrandProvider>
</ThemeProvider>
```

并在文件顶部 import：

```tsx
import { BrandProvider } from '@/components/layout/brand-provider';
```

- [ ] **Step 4: 类型检查**

Run: `pnpm tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: 验证防闪**

Run: `pnpm dev`。在浏览器 DevTools console 执行：
```js
localStorage.setItem('careerhelper-brand','blue'); location.reload();
```
Expected: 刷新后整站为 emerald 绿色，无闪烁。再执行 `localStorage.removeItem('careerhelper-brand'); location.reload();` 恢复 BOSS 默认。

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/brand-provider.tsx src/app/[locale]/layout.tsx
git commit -m "feat(theme): add BrandProvider with SSR-safe inline init script"
```

---

## Task 8: BrandSwitcher UI（Header 头像菜单）

**Files:**
- Create: `src/components/layout/brand-switcher.tsx`
- Modify: `src/components/layout/header.tsx`（或包含用户头像菜单的实际组件）

- [ ] **Step 1: 定位用户头像菜单**

Run: `grep -rln "DropdownMenu\|UserMenu\|avatar" /Users/chenhao/codes/myself/careerhelper/src/components/layout`

从结果中找出实际渲染头像下拉菜单的文件（例如 `header.tsx` 或 `user-menu.tsx`）。

- [ ] **Step 2: 创建 BrandSwitcher 组件**

创建 `src/components/layout/brand-switcher.tsx`：

```tsx
'use client';

import { useBrand } from './brand-provider';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandSwitcher() {
  const { brand, setBrand } = useBrand();
  const options: { id: 'boss' | 'blue'; label: string; swatch: string }[] = [
    { id: 'boss', label: 'BOSS 直聘', swatch: '#00A77F' },
    { id: 'blue', label: 'Blue 翡翠', swatch: '#059669' },
  ];

  return (
    <div className="px-2 py-1.5">
      <div className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Brand
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setBrand(opt.id)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors',
              brand === opt.id
                ? 'border-brand bg-brand-muted text-brand'
                : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300'
            )}
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: opt.swatch }}
            />
            <span className="truncate">{opt.label}</span>
            {brand === opt.id && <Check className="ml-auto h-3 w-3" />}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 在用户菜单中插入 BrandSwitcher**

打开 Step 1 找到的菜单文件，在 `<DropdownMenuContent>` 中合适位置（一般在主题切换器附近，或在最后的 separator 之前）插入：

```tsx
<DropdownMenuSeparator />
<BrandSwitcher />
```

并 import：
```tsx
import { BrandSwitcher } from '@/components/layout/brand-switcher';
```

如未引入 `DropdownMenuSeparator`，按需补齐。

- [ ] **Step 4: 验证切换器工作**

Run: `pnpm dev`，登录后点头像菜单，确认 BrandSwitcher 出现两个色块；点 Blue 全站颜色变绿（emerald），点 BOSS 变青绿；刷新页面状态保持。

- [ ] **Step 5: 类型检查**

Run: `pnpm tsc --noEmit`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/brand-switcher.tsx src/components/layout/header.tsx
git commit -m "feat(theme): add BrandSwitcher in user menu (BOSS / Blue)"
```

---

## Task 9: 视觉回归 + 收尾

**Files:**
- 无新增

- [ ] **Step 1: 全量 pink 残留扫描**

Run:
```bash
grep -rn "pink-\|fuchsia-\|#ec4899\|#db2777\|#f472b6" /Users/chenhao/codes/myself/careerhelper/src
```

Expected: 仅剩 `preview/templates/gradient.tsx` 和 `preview/templates/infographic.tsx` 中带 `// intentional` 注释的故意保留行；以及 `lib/interview/interviewers.ts` 中如有头像/装饰常量则保留。其他位置归零。

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: 无新增错误

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: 构建成功，无 TS / 编译错误

- [ ] **Step 4: 各核心页面 light/dark 双模式肉眼回归**

Run: `pnpm dev`，依次访问并截图：
- `/` 首页（landing）
- `/dashboard`
- `/templates`
- `/editor/<某个简历 id>`
- `/preview/<某个简历 id>`
- `/interview` (如果有)

每个页面切换 light/dark + BOSS/Blue，确认配色协调，dark 模式无亮粉残留。

- [ ] **Step 5: Commit (no-op)**

如果上述步骤无需修改，跳过 commit。否则：

```bash
git add -u
git commit -m "fix(theme): visual regression fixes after brand tokenization"
```

---

## Self-Review Notes

- ✅ 覆盖 spec 全部 G1-G4
- ✅ 60+ 文件机械替换通过映射表 + grep 验证闭环
- ✅ 导出层与 UI 层分离处理（Task 3 vs Task 4）
- ✅ 简历模板装饰性渐变保留（Task 5 区分 a/b 类）
- ✅ BrandProvider 防闪策略（inline script + localStorage）
- ✅ 所有任务最后均 commit
- ⚠️ Task 3 的机械替换是大批量操作，建议执行时逐文件 commit 也可，但默认按"全部完成后一次 commit"
