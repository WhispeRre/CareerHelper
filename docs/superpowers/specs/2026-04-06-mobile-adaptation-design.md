# Mobile Adaptation Design Spec

## Overview

Full-site responsive mobile adaptation for careerhelper. Pure responsive approach using Tailwind CSS breakpoints — same components adapt based on screen size. Desktop experience remains unchanged.

**Breakpoint:** `md (768px)` — below this is mobile.
**Approach:** Responsive CSS + minimal JS logic via `useMediaQuery` hook.
**Constraint:** Zero regressions on desktop.

---

## 1. Infrastructure & Shared

### 1.1 `useIsMobile` Hook

New file: `src/hooks/use-media-query.ts`

- `useIsMobile()` returns `boolean` based on `(max-width: 767px)`
- SSR default: `false` (renders desktop, hydrates to mobile if needed)
- Used only where CSS alone can't handle the logic (e.g., Tab state in Editor)

### 1.2 Header Adjustments

File: `src/components/layout/header.tsx`

- Existing `md:hidden` / `md:flex` pattern is kept
- Ensure all interactive elements >= 44px touch target on mobile
- Settings & UserMenu merge into the existing Sheet drawer on mobile

### 1.3 Global Spacing

- Mobile: `px-4` base padding
- Desktop: keep existing `sm:px-6 lg:px-8` gradient

### 1.4 Dialog -> Sheet Pattern

On mobile, all `Dialog` components that contain forms or multi-step flows should render as `Sheet` (`side="bottom"`) instead. This applies to:
- Export dialog
- Import dialog
- Share dialog
- JD analysis dialog
- Custom interviewer dialog
- New resume dialog

Implementation: wrapper component or conditional rendering based on `useIsMobile()`.

---

## 2. Editor (Core Change)

### 2.1 Desktop Layout (unchanged)

```
[Toolbar - 48px height]
[Sidebar 256px | Canvas flex-1 | Preview Panel]
```

### 2.2 Mobile Layout

```
[Toolbar - simplified icons]
[Tab Bar: Edit | Preview]
[Active Tab Content - full width]
[FAB: sidebar drawer trigger - bottom-left]
```

### 2.3 Editor Toolbar (`editor-toolbar.tsx`)

- Mobile: hide all text labels (extend existing `hidden sm:inline` pattern)
- Group secondary actions (export, share, translate, grammar check, cover letter) into a "more" dropdown menu
- AI chat button remains visible
- Toolbar scrolls horizontally if needed: `overflow-x-auto`

### 2.4 Editor Sidebar (`editor-sidebar.tsx`)

- Desktop: keep `w-56` fixed sidebar
- Mobile: hide sidebar entirely, render as `Sheet` (side="left") triggered by a FAB
- FAB position: `fixed bottom-4 left-4 z-40`, 48px round button with list icon
- dnd-kit drag-and-drop works with touch events natively — no changes needed

### 2.5 Mobile Tab Bar (new component)

New file: `src/components/editor/editor-mobile-tab-bar.tsx`

- Only renders below `md` breakpoint: `md:hidden`
- Two tabs: "Edit" (pencil icon + label) and "Preview" (eye icon + label)
- State stored in `editor-store`: `mobileActiveTab: 'edit' | 'preview'`
- Sticky below toolbar

### 2.6 Tab Content Switching

- Both `editor-canvas` and `editor-preview-panel` stay mounted (preserve state)
- Toggle visibility with `hidden` class based on `mobileActiveTab`
- Desktop: both always visible, tab bar hidden (`md:hidden`)

### 2.7 Editor Canvas (`editor-canvas.tsx`)

- Mobile: remove horizontal padding, full-width editing
- Section spacing: reduce from current to `space-y-3` on mobile
- Form fields: normal responsive stacking (already works)

### 2.8 Editor Preview Panel (`editor-preview-panel.tsx`)

- Mobile: full-width display when active tab
- Enable pinch-to-zoom: `touch-action: pan-x pan-y pinch-zoom` on the preview container
- No chrome/controls overlay — clean preview

### 2.9 Section Wrapper (`section-wrapper.tsx`)

- Collapse/expand controls: ensure touch-friendly size (>= 44px)
- Drag handle: larger touch area on mobile

---

## 3. Dashboard

### 3.1 Search & Toolbar (`dashboard/page.tsx`)

- Mobile: search input full-width on its own row
- Action buttons (new, import): icon-only on mobile, in a horizontal row below search
- Default to list view on mobile (more space-efficient)

### 3.2 Resume Grid (`resume-grid.tsx`)

- Already responsive: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`
- No changes needed

### 3.3 Resume Card Actions

- Mobile: card actions accessible via long-press context menu or "..." dropdown
- Ensure action buttons have adequate touch targets

### 3.4 New Resume Dialog

- Mobile: render as bottom Sheet instead of centered Dialog

---

## 4. Interview Module

### 4.1 Lobby (`interview-lobby.tsx`)

- Grid already responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- No changes needed

### 4.2 Setup (`interview-setup.tsx`)

- Already `max-w-2xl` centered, naturally full-width on mobile
- Interviewer picker: already has `overflow-x-auto` horizontal scroll
- Custom interviewer dialog: render as bottom Sheet on mobile

### 4.3 Interview Room (`interview-room.tsx`)

- Height: change to `calc(100dvh - 120px)` on mobile for better viewport handling (address bar)
- Desktop keeps `calc(100vh - 180px)`

### 4.4 Progress Bar (`progress-bar.tsx`)

- Mobile: hide interviewer names, show only avatar dots + divider lines
- Keeps the clickable navigation functionality

### 4.5 Control Bar (`control-bar.tsx`)

- Mobile: hide button text labels, icon-only with Tooltip
- Maintain all functionality

### 4.6 Message Input (`message-input.tsx`)

- Already well-sized: `min-h-[44px]` textarea, adequate touch targets
- No changes needed

### 4.7 Report View (`interview-report.tsx`)

- Report Overview: mobile switches to `flex-col` (score circle above info)
- Radar Chart: reduce height from 350px to 280px on mobile
- Export buttons: collapse into dropdown menu on mobile
- Round evaluations: full-width cards, no changes needed

---

## 5. Landing Page

### 5.1 Hero Section

- Already responsive typography and button layout
- Animated cards: hide on mobile (`hidden md:flex`) to prevent overflow

### 5.2 Features & Templates Sections

- Already responsive grids, no changes needed

### 5.3 Footer

- Mobile: link columns stack vertically

### 5.4 Landing Header

- Already has mobile Sheet menu — no changes needed

---

## 6. Other Pages

### 6.1 Preview / Share Pages

- Mobile: full-width resume display
- Enable pinch-to-zoom on preview container
- Fixed bottom action bar (download/share buttons)

### 6.2 Auth / Login

- Already `max-w-md` centered, naturally full-width on mobile
- No changes needed

### 6.3 LinkedIn Photo

- Form and preview areas stack vertically on mobile
- Photo preview adapts to screen width

### 6.4 Templates Page

- Template grid: `grid-cols-1` on mobile
- Template preview: full-screen on mobile with fixed "Use Template" button at bottom

---

## 7. Testing Strategy

- Manual testing at 375px (iPhone SE), 390px (iPhone 14), 768px (iPad) viewports
- Verify all pages at each breakpoint
- Confirm desktop (1280px+) has zero visual regressions
- Test touch interactions: drag-and-drop in editor sidebar, pinch-to-zoom in preview
- Test with mobile browser address bar show/hide (dvh vs vh)

---

## 8. Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/use-media-query.ts` | `useIsMobile()` hook |
| `src/components/editor/editor-mobile-tab-bar.tsx` | Mobile tab switcher for editor |

## 9. Files to Modify (estimated)

| File | Change |
|------|--------|
| `src/components/layout/header.tsx` | Touch targets, mobile menu consolidation |
| `src/components/editor/editor-toolbar.tsx` | Mobile icon-only mode, "more" dropdown |
| `src/components/editor/editor-sidebar.tsx` | Conditional Sheet on mobile + FAB trigger |
| `src/components/editor/editor-canvas.tsx` | Mobile padding/spacing |
| `src/components/editor/editor-preview-panel.tsx` | Mobile pinch-to-zoom |
| `src/components/editor/section-wrapper.tsx` | Touch-friendly controls |
| `src/app/[locale]/editor/[id]/page.tsx` | Integrate mobile tab bar and layout |
| `src/stores/editor-store.ts` | Add `mobileActiveTab` state |
| `src/app/[locale]/dashboard/page.tsx` | Mobile toolbar layout, default list view |
| `src/components/dashboard/resume-card.tsx` | Mobile action patterns |
| `src/components/interview/interview-room.tsx` | Mobile height (dvh) |
| `src/components/interview/progress-bar.tsx` | Mobile avatar-only mode |
| `src/components/interview/control-bar.tsx` | Mobile icon-only mode |
| `src/components/interview/interview-report.tsx` | Mobile flex-col, chart height |
| `src/components/interview/report-overview.tsx` | Mobile vertical layout |
| `src/components/landing/hero-section.tsx` | Hide animated cards on mobile |
| `src/app/[locale]/preview/[id]/page.tsx` | Pinch-to-zoom, bottom action bar |
| `src/app/[locale]/share/[token]/page.tsx` | Same as preview |
| `src/app/[locale]/templates/page.tsx` | Mobile grid + preview |
