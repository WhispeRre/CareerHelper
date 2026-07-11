# Mobile Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full-site responsive mobile adaptation for careerhelper with zero desktop regressions. Below md (768px) is mobile.

**Architecture:** Pure responsive approach — same components adapt via Tailwind breakpoints and a `useIsMobile()` hook for JS-driven logic. Editor switches from 3-column to tab-based layout on mobile. Dialogs become bottom Sheets. All touch targets >= 44px.

**Tech Stack:** Tailwind CSS 4, shadcn/ui (Sheet, Tabs, DropdownMenu), Zustand, React 19

**Spec:** `docs/superpowers/specs/2026-04-06-mobile-adaptation-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/hooks/use-media-query.ts` | `useIsMobile()` hook — SSR-safe media query listener |
| `src/components/editor/editor-mobile-tab-bar.tsx` | Mobile tab switcher (Edit/Preview) for editor |

### Modified Files
| File | Change Summary |
|------|---------------|
| `src/stores/editor-store.ts` | Add `mobileActiveTab` state |
| `src/app/[locale]/editor/[id]/page.tsx` | Integrate mobile tab bar, conditional sidebar |
| `src/components/editor/editor-toolbar.tsx` | Mobile icon-only + "more" dropdown |
| `src/components/editor/editor-sidebar.tsx` | Mobile Sheet + FAB trigger |
| `src/components/editor/editor-canvas.tsx` | Mobile padding adjustments |
| `src/components/editor/editor-preview-panel.tsx` | Mobile pinch-to-zoom |
| `src/components/editor/section-wrapper.tsx` | Touch-friendly controls |
| `src/components/layout/header.tsx` | Consolidate mobile menu items |
| `src/app/[locale]/dashboard/page.tsx` | Mobile toolbar layout |
| `src/components/interview/interview-room.tsx` | Mobile dvh height |
| `src/components/interview/progress-bar.tsx` | Mobile avatar-only mode |
| `src/components/interview/control-bar.tsx` | Mobile icon-only |
| `src/components/interview/report-overview.tsx` | Mobile flex-col layout |
| `src/components/interview/interview-report.tsx` | Mobile export dropdown |
| `src/components/landing/hero-section.tsx` | Hide animated cards on mobile |
| `src/app/[locale]/templates/page.tsx` | Mobile template preview |
| `src/app/[locale]/preview/[id]/page.tsx` | Mobile bottom action bar |
| `src/app/[locale]/share/[token]/page.tsx` | Mobile bottom action bar |

---

## Task 1: useIsMobile Hook

**Files:**
- Create: `src/hooks/use-media-query.ts`

- [ ] **Step 1: Create the hook file**

```typescript
// src/hooks/use-media-query.ts
"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit src/hooks/use-media-query.ts 2>&1 || echo "Check manually"`

Alternatively, verify by running `pnpm build` later. This is a simple hook — move on.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-media-query.ts
git commit -m "feat: add useIsMobile hook for responsive JS logic"
```

---

## Task 2: Editor Store — Add mobileActiveTab

**Files:**
- Modify: `src/stores/editor-store.ts`

- [ ] **Step 1: Add mobileActiveTab to the store interface and initial state**

In `src/stores/editor-store.ts`, add to the `EditorStore` interface:

```typescript
mobileActiveTab: "edit" | "preview";
setMobileActiveTab: (tab: "edit" | "preview") => void;
```

Add to the initial state object:

```typescript
mobileActiveTab: "edit",
setMobileActiveTab: (tab) => set({ mobileActiveTab: tab }),
```

- [ ] **Step 2: Verify no type errors**

Run: `pnpm tsc --noEmit 2>&1 | head -20`
Expected: No errors related to editor-store

- [ ] **Step 3: Commit**

```bash
git add src/stores/editor-store.ts
git commit -m "feat: add mobileActiveTab state to editor store"
```

---

## Task 3: Editor Mobile Tab Bar Component

**Files:**
- Create: `src/components/editor/editor-mobile-tab-bar.tsx`

- [ ] **Step 1: Create the mobile tab bar component**

```typescript
// src/components/editor/editor-mobile-tab-bar.tsx
"use client";

import { Pencil, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEditorStore } from "@/stores/editor-store";
import { cn } from "@/lib/utils";

export function EditorMobileTabBar() {
  const t = useTranslations("editor");
  const { mobileActiveTab, setMobileActiveTab } = useEditorStore();

  return (
    <div className="flex border-b bg-white dark:border-zinc-800 dark:bg-background md:hidden">
      <button
        onClick={() => setMobileActiveTab("edit")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
          mobileActiveTab === "edit"
            ? "border-b-2 border-pink-500 text-pink-600 dark:text-pink-400"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        )}
      >
        <Pencil className="h-4 w-4" />
        {t("edit")}
      </button>
      <button
        onClick={() => setMobileActiveTab("preview")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
          mobileActiveTab === "preview"
            ? "border-b-2 border-pink-500 text-pink-600 dark:text-pink-400"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        )}
      >
        <Eye className="h-4 w-4" />
        {t("preview")}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add i18n keys if missing**

Check `messages/en.json` and `messages/zh.json` for `editor.edit` and `editor.preview` keys. If they don't exist, add them:

In `messages/en.json` under `"editor"`:
```json
"edit": "Edit",
"preview": "Preview"
```

In `messages/zh.json` under `"editor"`:
```json
"edit": "编辑",
"preview": "预览"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/editor-mobile-tab-bar.tsx messages/en.json messages/zh.json
git commit -m "feat: add EditorMobileTabBar component"
```

---

## Task 4: Editor Page — Integrate Mobile Layout

**Files:**
- Modify: `src/app/[locale]/editor/[id]/page.tsx`

- [ ] **Step 1: Add imports**

Add these imports to the top of the file:

```typescript
import { EditorMobileTabBar } from "@/components/editor/editor-mobile-tab-bar";
import { useIsMobile } from "@/hooks/use-media-query";
```

- [ ] **Step 2: Add hook and store usage**

Inside the component, after existing hooks, add:

```typescript
const isMobile = useIsMobile();
const { mobileActiveTab } = useEditorStore();
```

(Note: `useEditorStore` is already imported — just destructure `mobileActiveTab` from the existing call on line 40.)

- [ ] **Step 3: Update the JSX layout**

Replace the current content wrapper:

```typescript
// OLD:
<div className="flex flex-1 overflow-hidden">
  <EditorSidebar sections={sections} ... />
  <EditorCanvas sections={sections} ... />
  {showThemeEditor && <ThemeEditor />}
  <EditorPreviewPanel />
</div>
```

With:

```typescript
<EditorMobileTabBar />

<div className="flex flex-1 overflow-hidden">
  {/* Sidebar: hidden on mobile, shown on desktop */}
  <div className="hidden md:block">
    <EditorSidebar
      sections={sections}
      onAddSection={addSection}
      onReorderSections={reorderSections}
    />
  </div>

  {/* Canvas: always mounted, hidden on mobile when preview tab active */}
  <div className={cn(
    "min-w-0 flex-1",
    isMobile && mobileActiveTab !== "edit" && "hidden"
  )}>
    <EditorCanvas
      sections={sections}
      onUpdateSection={updateSection}
      onRemoveSection={removeSection}
      onReorderSections={reorderSections}
    />
  </div>

  {showThemeEditor && <ThemeEditor />}

  {/* Preview: always mounted, hidden on mobile when edit tab active */}
  <div className={cn(
    "min-w-0 flex-1 md:flex-[6]",
    isMobile && mobileActiveTab !== "preview" && "hidden"
  )}>
    <EditorPreviewPanel />
  </div>
</div>
```

Import `cn` from `@/lib/utils` if not already imported.

- [ ] **Step 4: Verify desktop layout unchanged**

Run: `pnpm dev`
Open browser at 1280px width. Confirm editor shows 3-column layout as before.
Resize to < 768px. Confirm tab bar appears and sidebar is hidden.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/editor/[id]/page.tsx
git commit -m "feat: integrate mobile tab bar and conditional layout in editor page"
```

---

## Task 5: Editor Sidebar — Mobile Sheet + FAB

**Files:**
- Modify: `src/components/editor/editor-sidebar.tsx`
- Modify: `src/app/[locale]/editor/[id]/page.tsx`

- [ ] **Step 1: Add mobile sidebar Sheet to editor page**

In `src/app/[locale]/editor/[id]/page.tsx`, add imports:

```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { List } from "lucide-react";
import { useState } from "react";
```

Add state:

```typescript
const [sidebarOpen, setSidebarOpen] = useState(false);
```

After the closing `</div>` of the flex content wrapper, before `<AIChatBubble>`, add:

```typescript
{/* Mobile sidebar FAB */}
<button
  onClick={() => setSidebarOpen(true)}
  className="fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
  aria-label="Open sections"
>
  <List className="h-5 w-5" />
</button>

{/* Mobile sidebar Sheet */}
<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
  <SheetContent side="left" className="w-72 p-0">
    <SheetHeader className="border-b px-4 py-3">
      <SheetTitle className="text-sm font-semibold">{t("sections")}</SheetTitle>
    </SheetHeader>
    <EditorSidebar
      sections={sections}
      onAddSection={(s) => { addSection(s); setSidebarOpen(false); }}
      onReorderSections={reorderSections}
    />
  </SheetContent>
</Sheet>
```

Add `t` from the existing `useTranslations` call, or add `const t = useTranslations("editor");` if not present.

- [ ] **Step 2: Make EditorSidebar work inside Sheet**

In `src/components/editor/editor-sidebar.tsx`, remove the outer container's fixed width so it fills its parent:

Change the root div className from:
```
"w-56 shrink-0 border-r bg-white dark:bg-zinc-900 dark:border-zinc-800"
```
To:
```
"w-56 shrink-0 border-r bg-white dark:bg-zinc-900 dark:border-zinc-800 md:w-56 max-md:w-full max-md:border-r-0"
```

Change `ScrollArea` className from:
```
"h-[calc(100vh-7rem)]"
```
To:
```
"h-[calc(100vh-7rem)] max-md:h-[calc(100vh-5rem)]"
```

- [ ] **Step 3: Add i18n key for "sections" if missing**

Check and add to `messages/en.json` under `"editor"`:
```json
"sections": "Sections"
```
And `messages/zh.json`:
```json
"sections": "章节"
```

- [ ] **Step 4: Verify**

At desktop width: sidebar is still fixed left.
At mobile width: sidebar is hidden, FAB appears at bottom-left, clicking opens Sheet with sidebar content.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/editor/[id]/page.tsx src/components/editor/editor-sidebar.tsx messages/en.json messages/zh.json
git commit -m "feat: mobile sidebar as Sheet with FAB trigger"
```

---

## Task 6: Editor Toolbar — Mobile Simplification

**Files:**
- Modify: `src/components/editor/editor-toolbar.tsx`

- [ ] **Step 1: Add "more" dropdown for secondary actions on mobile**

Add imports at the top:

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
```

- [ ] **Step 2: Wrap secondary actions in responsive groups**

In the right section of the toolbar, identify the secondary action buttons (export, import, share, translate, grammar, cover letter). Wrap them:

```typescript
{/* Desktop: show all buttons */}
<div className="hidden items-center gap-1 md:flex">
  {/* existing export, import, share, translate, grammar, cover letter buttons */}
</div>

{/* Mobile: "more" dropdown */}
<div className="md:hidden">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => openModal("export")}>
        {t("export")}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => openModal("import")}>
        {t("import")}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => openModal("share")}>
        {t("share")}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => openModal("translate")}>
        {t("translate")}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => openModal("grammarCheck")}>
        {t("grammarCheck")}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => openModal("coverLetter")}>
        {t("coverLetter")}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

- [ ] **Step 3: Keep primary actions (undo/redo, AI chat, theme toggle) always visible**

Ensure undo/redo buttons and AI chat button remain outside the dropdown. They should always be visible. Add `shrink-0` to prevent them from being squeezed.

- [ ] **Step 4: Make toolbar horizontally scrollable on very narrow screens**

Change the toolbar root className from:
```
"flex h-12 items-center justify-between border-b bg-white px-3 dark:bg-background dark:border-zinc-800"
```
To:
```
"flex h-12 items-center justify-between border-b bg-white px-3 dark:bg-background dark:border-zinc-800 overflow-x-auto"
```

- [ ] **Step 5: Verify**

Desktop: all buttons visible as before.
Mobile: only undo/redo, AI, theme visible. "..." dropdown shows secondary actions.

- [ ] **Step 6: Commit**

```bash
git add src/components/editor/editor-toolbar.tsx
git commit -m "feat: mobile toolbar with more-actions dropdown"
```

---

## Task 7: Editor Canvas — Mobile Spacing

**Files:**
- Modify: `src/components/editor/editor-canvas.tsx`

- [ ] **Step 1: Adjust padding and spacing for mobile**

Change the content wrapper className from:
```
"mx-auto max-w-3xl px-6 py-8"
```
To:
```
"mx-auto max-w-3xl px-3 py-4 md:px-6 md:py-8"
```

Change the sections container className from:
```
"space-y-4"
```
To:
```
"space-y-3 md:space-y-4"
```

- [ ] **Step 2: Verify**

Desktop: padding and spacing unchanged.
Mobile: tighter padding (px-3 py-4) and slightly closer sections.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/editor-canvas.tsx
git commit -m "feat: mobile-friendly spacing in editor canvas"
```

---

## Task 8: Editor Preview Panel — Mobile Pinch-to-Zoom

**Files:**
- Modify: `src/components/editor/editor-preview-panel.tsx`

- [ ] **Step 1: Hide zoom controls on mobile, enable touch zoom**

Change the header div:
```
"flex shrink-0 items-center justify-between border-b bg-white px-4 py-2 dark:bg-background dark:border-zinc-800"
```
To:
```
"hidden shrink-0 items-center justify-between border-b bg-white px-4 py-2 md:flex dark:bg-background dark:border-zinc-800"
```

This hides the zoom header bar on mobile (users will pinch-to-zoom instead).

- [ ] **Step 2: Add touch-action for pinch-to-zoom**

On the preview body container div (`"min-h-0 flex-1 overflow-y-auto"`), change to:

```
"min-h-0 flex-1 overflow-auto touch-pan-x touch-pan-y touch-pinch-zoom"
```

Also adjust the center wrapper for mobile:

Change `"flex justify-center p-4"` to `"flex justify-center p-2 md:p-4"`.

- [ ] **Step 3: On mobile, remove fixed A4 width and use responsive width**

Import `useIsMobile`:

```typescript
import { useIsMobile } from "@/hooks/use-media-query";
```

Add inside the component:
```typescript
const isMobile = useIsMobile();
```

Change the document wrapper from:
```typescript
<div className="bg-white shadow-md" style={{ width: A4_WIDTH, zoom: scale }}>
```
To:
```typescript
<div
  className="bg-white shadow-md"
  style={{
    width: isMobile ? "100%" : A4_WIDTH,
    maxWidth: A4_WIDTH,
    zoom: isMobile ? undefined : scale,
  }}
>
```

- [ ] **Step 4: Verify**

Desktop: zoom controls visible, fixed A4 width with zoom, as before.
Mobile: no zoom controls, full-width preview, pinch-to-zoom works.

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/editor-preview-panel.tsx
git commit -m "feat: mobile preview with pinch-to-zoom and responsive width"
```

---

## Task 9: Section Wrapper — Touch-Friendly Controls

**Files:**
- Modify: `src/components/editor/section-wrapper.tsx`

- [ ] **Step 1: Increase touch targets for action buttons**

In the header action buttons area, change the button sizes to be more touch-friendly:

Change the header div padding:
```
"flex flex-row items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800"
```
To:
```
"flex flex-row items-center justify-between border-b border-zinc-100 px-3 py-2.5 md:px-4 dark:border-zinc-800"
```

For the drag handle `GripVertical`, ensure it has adequate size:
```typescript
<GripVertical className="h-4 w-4 shrink-0 cursor-grab text-zinc-300 md:h-3.5 md:w-3.5" />
```

(Slightly larger on mobile for easier grabbing.)

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/section-wrapper.tsx
git commit -m "feat: touch-friendly section wrapper controls"
```

---

## Task 10: Header — Mobile Menu Consolidation

**Files:**
- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Ensure Settings button is in mobile menu**

Read the current header.tsx. The header currently shows nav links hidden on mobile (`hidden md:flex`). Verify that Settings and UserMenu are accessible on mobile.

If Settings button is currently visible on mobile but outside the Sheet menu, move it inside the Sheet by wrapping with `md:hidden`/`hidden md:block` as appropriate. If there's already a mobile Sheet (from landing-header), ensure consistency.

The main header for dashboard/editor/interview may not have a Sheet menu. If it doesn't, add one:

After the logo, add:

```typescript
{/* Mobile menu */}
<Sheet>
  <SheetTrigger asChild className="md:hidden">
    <Button variant="ghost" size="icon" className="h-10 w-10">
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-64">
    <nav className="flex flex-col gap-2 pt-8">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive ? "bg-pink-50 text-pink-600" : "text-zinc-600 hover:bg-zinc-50"
          )}
        >
          {t(item.i18nKey)}
        </Link>
      ))}
    </nav>
  </SheetContent>
</Sheet>
```

Add imports: `Sheet, SheetContent, SheetTrigger`, `Menu` from lucide-react.

- [ ] **Step 2: Hide desktop nav on mobile**

Ensure the existing nav links container has `hidden md:flex`.

- [ ] **Step 3: Verify**

Desktop: nav links visible in header as before.
Mobile: hamburger menu opens Sheet with nav links.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: mobile hamburger menu for main header"
```

---

## Task 11: Dashboard — Mobile Toolbar Layout

**Files:**
- Modify: `src/app/[locale]/dashboard/page.tsx`

- [ ] **Step 1: Make action buttons responsive**

Find the header buttons section (LinkedIn Photo, AI Generate, Import, Create Resume). Wrap text labels:

For each button that has an icon + text label, change the label span to include `hidden sm:inline`:

```typescript
<Button ...>
  <Icon className="h-4 w-4" />
  <span className="hidden sm:inline">{t("buttonLabel")}</span>
</Button>
```

This makes buttons icon-only on mobile.

- [ ] **Step 2: Make search/toolbar stack on mobile**

If search and sort/view controls are in a `flex-row`, ensure they stack:

Change from `flex items-center gap-4` to `flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4`.

- [ ] **Step 3: Verify**

Desktop: buttons with labels, horizontal toolbar.
Mobile: icon-only buttons, stacked search/controls.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/dashboard/page.tsx
git commit -m "feat: mobile-friendly dashboard toolbar"
```

---

## Task 12: Interview Room — Mobile Height

**Files:**
- Modify: `src/components/interview/interview-room.tsx`

- [ ] **Step 1: Use dvh on mobile for better viewport handling**

Find the container with `height: calc(100vh - 180px)` style. Change to a className-based approach:

Replace the inline style with:

```typescript
className="... h-[calc(100dvh-120px)] md:h-[calc(100vh-180px)]"
```

Remove the corresponding inline `style={{ height: "calc(100vh - 180px)" }}`.

- [ ] **Step 2: Commit**

```bash
git add src/components/interview/interview-room.tsx
git commit -m "feat: mobile-friendly interview room height with dvh"
```

---

## Task 13: Interview Progress Bar — Mobile Avatar-Only

**Files:**
- Modify: `src/components/interview/progress-bar.tsx`

- [ ] **Step 1: Hide interviewer names on mobile**

In the progress bar pills, find the interviewer name text. Wrap it:

```typescript
<span className="hidden sm:inline">{round.interviewer.name}</span>
```

This shows only the avatar circle on mobile, with the full name on desktop.

- [ ] **Step 2: Reduce pill padding on mobile**

Change pill padding from `px-2 py-1` to `px-1 py-1 sm:px-2`.

- [ ] **Step 3: Commit**

```bash
git add src/components/interview/progress-bar.tsx
git commit -m "feat: mobile avatar-only interview progress bar"
```

---

## Task 14: Interview Control Bar — Mobile Icon-Only

**Files:**
- Modify: `src/components/interview/control-bar.tsx`

- [ ] **Step 1: Hide button text labels on mobile**

For each control button, wrap the text label:

```typescript
<span className="hidden sm:inline">{t("skip")}</span>
```

Keep icons always visible. This applies to: Skip, Hint, Mark, End Round, Pause buttons.

- [ ] **Step 2: Commit**

```bash
git add src/components/interview/control-bar.tsx
git commit -m "feat: mobile icon-only interview controls"
```

---

## Task 15: Interview Report — Mobile Layout

**Files:**
- Modify: `src/components/interview/report-overview.tsx`
- Modify: `src/components/interview/interview-report.tsx`

- [ ] **Step 1: Report Overview — stack vertically on mobile**

In `report-overview.tsx`, find the header flex container (`"flex items-center gap-5"`). Change to:

```
"flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5"
```

Center the score circle on mobile:

```
"text-center sm:text-left"
```

on the meta section.

- [ ] **Step 2: Interview Report — mobile export dropdown**

In `interview-report.tsx`, find the export buttons area. Wrap them:

```typescript
<div className="hidden sm:flex items-center gap-2">
  <ExportButtons ... />
</div>
<div className="sm:hidden">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {/* Export options as menu items */}
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

Add necessary imports for DropdownMenu components and MoreHorizontal icon.

- [ ] **Step 3: Commit**

```bash
git add src/components/interview/report-overview.tsx src/components/interview/interview-report.tsx
git commit -m "feat: mobile-friendly interview report layout"
```

---

## Task 16: Landing Page — Hide Animated Cards on Mobile

**Files:**
- Modify: `src/components/landing/hero-section.tsx`

- [ ] **Step 1: Hide floating template cards on mobile**

Find the container with animated template cards (the three `TemplateThumbnail` components with `animate-float`). Add `hidden md:block` to their wrapper:

```typescript
<div className="hidden md:block">
  {/* existing animated template cards */}
</div>
```

Or if the cards are individually placed, wrap each in `hidden md:block`.

- [ ] **Step 2: Verify**

Desktop: animated cards visible.
Mobile: cards hidden, hero section clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/hero-section.tsx
git commit -m "feat: hide animated hero cards on mobile"
```

---

## Task 17: Templates Page — Mobile Grid & Preview

**Files:**
- Modify: `src/app/[locale]/templates/page.tsx`

- [ ] **Step 1: Verify grid is responsive**

The grid already uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. This is already mobile-friendly. No change needed if so.

- [ ] **Step 2: Make template preview dialog mobile-friendly**

Find the Dialog for template preview. On mobile, make it full-screen:

Change the dialog content className to include responsive sizing:

```typescript
<DialogContent className="max-h-[90vh] w-full max-w-[794px] overflow-y-auto p-0 sm:max-h-[85vh]">
```

Add a fixed bottom button bar for "Use Template":

```typescript
<div className="sticky bottom-0 border-t bg-white p-3 dark:bg-background sm:hidden">
  <Button className="w-full" onClick={handleUseTemplate}>
    {t("useTemplate")}
  </Button>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/templates/page.tsx
git commit -m "feat: mobile-friendly template preview"
```

---

## Task 18: Preview & Share Pages — Mobile Bottom Action Bar

**Files:**
- Modify: `src/app/[locale]/preview/[id]/page.tsx`
- Modify: `src/app/[locale]/share/[token]/page.tsx`

- [ ] **Step 1: Preview page — add mobile bottom action bar**

In `preview/[id]/page.tsx`, find the top action buttons (back, export). Keep them in header on desktop. Add a fixed bottom bar on mobile:

```typescript
{/* Mobile bottom action bar */}
<div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t bg-white p-3 dark:bg-background sm:hidden">
  <Button variant="outline" className="flex-1" onClick={() => router.back()}>
    {t("back")}
  </Button>
  <Button className="flex-1" onClick={handleExport} disabled={isExporting}>
    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("exportPdf")}
  </Button>
</div>
```

Add `pb-20 sm:pb-0` to the main content container to prevent bottom bar from overlapping content.

- [ ] **Step 2: Share page — same pattern**

In `share/[token]/page.tsx`, add similar bottom bar with "View on careerhelper" action if not already accessible.

- [ ] **Step 3: Enable pinch-to-zoom on preview containers**

On both pages, add to the resume preview wrapper:

```typescript
className="overflow-auto touch-pan-x touch-pan-y"
style={{ WebkitOverflowScrolling: "touch" }}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/preview/[id]/page.tsx src/app/[locale]/share/[token]/page.tsx
git commit -m "feat: mobile bottom action bars for preview and share pages"
```

---

## Task 19: Final Verification

- [ ] **Step 1: Run type check**

```bash
pnpm tsc --noEmit 2>&1 | tail -20
```

Expected: 0 errors

- [ ] **Step 2: Run build**

```bash
pnpm build 2>&1 | tail -30
```

Expected: Build succeeds

- [ ] **Step 3: Manual testing checklist**

Open dev server (`pnpm dev`) and test at 375px, 768px, and 1280px widths:

**Desktop (1280px) — zero regressions:**
- [ ] Landing page looks identical
- [ ] Dashboard grid and toolbar unchanged
- [ ] Editor 3-column layout works
- [ ] Interview room unchanged
- [ ] Templates grid unchanged

**Mobile (375px) — new features:**
- [ ] Landing hero: no animated cards, clean layout
- [ ] Dashboard: icon-only buttons, stacked search
- [ ] Editor: tab bar visible, edit/preview switching works
- [ ] Editor: FAB opens sidebar Sheet
- [ ] Editor: toolbar "more" dropdown works
- [ ] Editor: preview pinch-to-zoom works
- [ ] Interview room: proper height, avatar-only progress
- [ ] Interview controls: icon-only
- [ ] Interview report: stacked overview, export dropdown
- [ ] Templates: single column, mobile preview
- [ ] Preview/Share: bottom action bar

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: mobile adaptation final adjustments"
```
