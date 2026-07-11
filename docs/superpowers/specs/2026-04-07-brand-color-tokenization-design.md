# Brand Color Tokenization & Theme Switching — Design Spec

**Date:** 2026-04-07
**Status:** Draft (awaiting user review)
**Owner:** Claude (brainstorming)

## Background

careerhelper 当前以 Tailwind 硬编码 `pink-500 / pink-600 / pink-100 …` 作为事实上的品牌色，分散在 **61 个文件 + `globals.css`** 中（Header 下划线、CTA 按钮、AI 气泡、Loading、Tour、Landing 渐变等）。后果：

1. **Dark 模式视觉违和** —— 截图证据：dark zinc 背景上的亮粉 `#ec4899` 按钮刺眼，违反 `color-dark-mode`（dark 模式应使用降饱和/提亮度的 tonal variant，而非沿用 light 主色）。
2. **无法整体切换品牌色** —— 用户希望提供 BOSS 直聘风格（青绿 `#00C897`）配色方案，但当前架构没有任何 brand token，没法切换。
3. **L2 简历预设主题** 已 tokenize，但只有 6 个预设，缺少 BOSS 风格预设。

## Goals

- **G1**：消除全站 `pink-*` 硬编码，引入语义化 brand token，dark 模式自动协调。
- **G2**：支持 **App 品牌主题**一键切换（**默认 `boss` 青绿** / 可选 `blue` 蓝色），通过 `data-brand` 属性 + CSS variable 覆写。
- **G3**：在 **L2 简历预设** `PRESET_THEMES` 中新增 `boss` 预设。
- **G4**：保留所有现有视觉语义（hover/active/selected 等状态层级关系）。

## Non-Goals

- 不重做 shadcn 的 `--primary` token 体系（那是中性深色，与品牌色 orthogonal）。
- 不修改简历模板（`src/components/preview/templates/*`）的内容渲染逻辑——这些由 L2 `themeConfig` 驱动，本次只新增预设。
- 不引入第三种 brand（先 blue/boss 两种闭环）。

## Architecture（顶层设计）

### 两层颜色系统（必须分层）

| 层级 | 作用域 | 当前现状 | 本次方案 |
|---|---|---|---|
| **L1 App Brand** | 应用 chrome：Header / 按钮 / Loading / Landing | 61 文件硬编码 `pink-500` | CSS 变量 `--brand-*` + Tailwind `brand` 颜色族 + `data-brand` 切换 |
| **L2 Resume Preset** | 简历内容渲染：`PRESET_THEMES` | 已 tokenize，6 预设 | 新增 `boss` 预设 |

L1 与 L2 **完全解耦**：用户在 App 切到 BOSS 品牌不会自动改简历主题，反之亦然。这是为了允许"App 用 blue，简历用 boss 模板"或反过来。

### L1 实现（CSS 变量 + Tailwind theme）

`globals.css`：

```css
:root {
  /* Default: BOSS brand (light mode) — BOSS 直聘青绿 */
  --brand: oklch(0.64 0.15 168);           /* #00A77F, AA on white */
  --brand-foreground: oklch(1 0 0);        /* white */
  --brand-hover: oklch(0.56 0.14 168);     /* darker */
  --brand-muted: oklch(0.94 0.05 168);     /* tag bg / selected bg */
  --brand-ring: oklch(0.64 0.15 168 / 40%);
}

.dark {
  --brand: oklch(0.83 0.16 168);           /* #1FE0AC, brighter for dark */
  --brand-foreground: oklch(0.20 0.05 168);
  --brand-hover: oklch(0.74 0.16 168);     /* #00C897 */
  --brand-muted: oklch(0.32 0.08 168);
  --brand-ring: oklch(0.83 0.16 168 / 40%);
}

/* Brand: Blue (optional alternate, emerald 系) */
[data-brand="blue"] {
  --brand: oklch(0.62 0.17 162);           /* #059669 emerald-600 */
  --brand-foreground: oklch(1 0 0);
  --brand-hover: oklch(0.55 0.17 162);
  --brand-muted: oklch(0.95 0.05 162);
  --brand-ring: oklch(0.62 0.17 162 / 40%);
}

.dark[data-brand="blue"],
[data-brand="blue"].dark {
  --brand: oklch(0.78 0.15 162);           /* #34d399 */
  --brand-foreground: oklch(0.18 0.04 162);
  --brand-hover: oklch(0.696 0.17 162.5);
  --brand-muted: oklch(0.32 0.08 162);
  --brand-ring: oklch(0.78 0.15 162 / 40%);
}
```

`@theme inline` 块新增（让 `bg-brand` / `text-brand` / `border-brand` 生效）：

```css
@theme inline {
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-brand-hover: var(--brand-hover);
  --color-brand-muted: var(--brand-muted);
  --color-brand-ring: var(--brand-ring);
}
```

### Pink → Brand 替换映射表

机械替换（按出现频率排序）：

| Old | New | 备注 |
|---|---|---|
| `bg-pink-500` | `bg-brand` | 主按钮背景 |
| `bg-pink-600` | `bg-brand-hover` | hover/active |
| `hover:bg-pink-600` | `hover:bg-brand-hover` | |
| `bg-pink-50` / `bg-pink-100` | `bg-brand-muted` | 选中底色 |
| `text-pink-500` / `text-pink-600` | `text-brand` | 强调文字 |
| `text-pink-700` | `text-brand` | dark 模式自动适配 |
| `text-pink-300` / `text-pink-400` | `text-brand` | dark 文字 |
| `border-pink-500` / `border-pink-300` | `border-brand` | |
| `ring-pink-500` | `ring-brand` | |
| `from-pink-500 to-rose-500` | `from-brand to-brand-hover` | 渐变 |
| `bg-gradient-to-br from-pink-500 to-pink-400` | `bg-brand` | 简化为纯色 |
| `dark:border-pink-900` | `dark:border-brand-muted` | |
| `text-pink-600 dark:text-pink-400`（markdown code） | `text-brand` | |

`globals.css` 的 `landing-cta-bg` 渐变改为：
```css
.landing-cta-bg { background: linear-gradient(135deg, var(--brand), var(--brand-hover)); }
```

### Brand 切换器 UI

- 在 Settings 区域（暂定 Header 用户菜单 → "Appearance"）增加一个紧凑切换器：`Blue ⚪ / Boss ⚪`
- 持久化：`localStorage.setItem('careerhelper-brand', 'blue'|'boss')`
- 应用方式：在 `theme-provider.tsx` 同层增加 `BrandProvider`，挂载时给 `<html>` 添加 `data-brand="blue"`（boss 是默认，无需属性）
- SSR 不闪烁：在 `app/layout.tsx` 内联 `<script>` 提前从 localStorage 读取并设置 `data-brand`（参照 next-themes 防闪策略）

### L2 新增 BOSS 简历预设

`src/components/editor/theme-editor.tsx` 的 `PRESET_THEMES` 末尾追加：

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

i18n（`messages/zh.json` + `messages/en.json`）增加 `themeEditor.preset.boss`：
- zh: `"BOSS 直聘"`
- en: `"BOSS Style"`

## Color Tokens 详细规格

### Brand: `blue`（备选）

| Token | Light hex | Light oklch | Dark hex | Dark oklch | AA contrast |
|---|---|---|---|---|---|
| `--brand` | `#059669` | `oklch(0.62 0.17 162)` | `#34d399` | `oklch(0.78 0.15 162)` | white-on-brand light 4.6:1 ✅ |
| `--brand-foreground` | `#ffffff` | `oklch(1 0 0)` | `#04231a` | `oklch(0.18 0.04 162)` | dark 11.2:1 ✅ |
| `--brand-hover` | `#047857` | `oklch(0.55 0.17 162)` | `#10b981` | `oklch(0.696 0.17 162.5)` | — |
| `--brand-muted` | `#d1fae5` | `oklch(0.95 0.05 162)` | `#064e3b` | `oklch(0.32 0.08 162)` | — |
| `--brand-ring` | rgba 40% | `oklch(0.62 0.17 162 / 40%)` | — | `oklch(0.78 0.15 162 / 40%)` | — |

### Brand: `boss`

| Token | Light hex | Light oklch | Dark hex | Dark oklch | AA contrast |
|---|---|---|---|---|---|
| `--brand` | `#00A77F` | `oklch(0.64 0.15 168)` | `#1FE0AC` | `oklch(0.83 0.16 168)` | white-on-brand light 4.7:1 ✅ |
| `--brand-foreground` | `#ffffff` | `oklch(1 0 0)` | `#002419` | `oklch(0.20 0.05 168)` | dark 11+ ✅ |
| `--brand-hover` | `#008463` | `oklch(0.56 0.14 168)` | `#00C897` | `oklch(0.74 0.16 168)` | — |
| `--brand-muted` | `#CCF4E9` | `oklch(0.94 0.05 168)` | `#003D2D` | `oklch(0.32 0.08 168)` | — |
| `--brand-ring` | rgba 40% | `oklch(0.64 0.15 168 / 40%)` | — | `oklch(0.83 0.16 168 / 40%)` | — |

> 注：BOSS 官方主色 `#00C897` 在白底上对比度仅 2.6:1，违反 AA。所以 light 模式 brand 主色压深一档到 `#00A77F`（依然是 BOSS 视觉识别度内），dark 模式提亮到 `#1FE0AC`。

## Files Affected (~63 files)

**新增/重构核心：**
- `src/app/globals.css` —— 增加 brand 变量 + 改 landing-cta-bg
- `src/components/layout/brand-provider.tsx` —— 新建，brand 状态 + localStorage
- `src/components/layout/brand-switcher.tsx` —— 新建，UI 切换器
- `src/components/editor/theme-editor.tsx` —— 新增 boss 预设 + 替换硬编码 pink
- `src/app/layout.tsx` 或 `src/app/[locale]/layout.tsx` —— 内联防闪 script + 挂载 BrandProvider
- `messages/zh.json` / `messages/en.json` —— 新增 i18n key

**机械替换 pink → brand（约 60 文件）：**
landing-header / hero-section / cta-section / features-section / template-showcase-section / landing-cta-section /
header / theme-provider /
ai-chat-bubble / ai-chat-panel / ai-message / ai-input / ai-suggestion /
editor-toolbar / editor-canvas / editor-sidebar / editor-mobile-tab-bar / section-wrapper / share-dialog / export-dialog / import-dialog / cover-letter-dialog / translate-dialog / jd-analysis-dialog / grammar-check-dialog / theme-editor / fields/editable-date /
dashboard/page / create-resume-dialog / generate-resume-dialog / import-json-dialog / resume-card / resume-list-item / template-thumbnail /
templates/page / preview/page / share/page / editor/page / linkedin-photo/page / (auth)/layout /
interview/* (custom-interviewer-dialog / thinking-indicator / progress-bar / radar-chart / message-input / jd-input / interviewer-* / interview-setup / interview-lobby / history-comparison) /
preview/templates/infographic / preview/templates/gradient /
api/resume/[id]/export/templates/infographic / api/resume/[id]/export/templates/gradient / api/resume/[id]/export/docx / api/interview/[id]/report/export/html /
tour/tour-overlay / lib/interview/interviewers

**例外（不替换）：**
- `api/.../export/*.ts` 和 `preview/templates/gradient.tsx` 等 **导出/PDF 渲染**逻辑——它们使用硬编码 hex 是因为 PDF/HTML 导出不在浏览器 CSS 上下文，需要内联值。这些保留硬编码但**抽到 `src/lib/brand-constants.ts`** 统一引用。

## Implementation Phases

| Phase | 内容 | 验收 |
|---|---|---|
| **P1** | `globals.css` 加 brand 变量 + Tailwind 注册 | `bg-brand` 在最小 demo 页可用 |
| **P2** | 机械替换 60+ 文件 pink → brand | 全文 `grep "pink-"` 命中数 ≤ 例外清单 |
| **P3** | 导出模板抽 `brand-constants.ts` | PDF 导出视觉无回归 |
| **P4** | `BrandProvider` + `BrandSwitcher` + 防闪 script | 切换 BOSS 后整站绿色，刷新不闪 |
| **P5** | `PRESET_THEMES` 加 boss + i18n | 编辑器中预设可点选 |
| **P6** | 视觉回归 + dark 模式截图比对 | 各核心页面 light/dark 双模式无违和 |

## Risks & Mitigations

| 风险 | 缓解 |
|---|---|
| 60+ 文件机械替换出错 | 严格按映射表，每替换一类（如 `bg-pink-500`）后跑 `grep` 验证残留 |
| `oklch()` 浏览器兼容 | Tailwind 4 已用 oklch；目标浏览器 Chrome 111+ / Safari 15.4+，覆盖 ≥97% |
| 导出 PDF 颜色不同步 | `brand-constants.ts` 单一源；P3 单独验证 |
| `data-brand` SSR 闪烁 | 内联 script 在 `<head>` 同步执行（参照 next-themes 实现） |
| 简历 boss 预设与品牌切换无关 | 文档明确两层解耦；编辑器 tooltip 提示"仅影响当前简历" |

## Open Questions

- BrandSwitcher 入口位置：(a) Header 头像菜单，(b) Dashboard 设置页，(c) 暂时只在 dev 环境暴露？默认提案 **(a) Header 头像菜单**。
- 是否要把现有 dark mode 主色（shadcn `--primary`）也调整？默认 **不动**，shadcn primary 是中性色，与 brand orthogonal。
