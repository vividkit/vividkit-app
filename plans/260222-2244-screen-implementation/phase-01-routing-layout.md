---
phase: 01
title: "Routing & Shared Layout"
status: completed
effort: 2h
depends_on: []
---

# Phase 01: Routing & Shared Layout

## Overview

Set up React Router v6 with all 13 routes. Implement AppLayout (sidebar + header), AppSidebar with project switcher and nav, AppHeader with AI status.

## Related Code Files

### Files to Create
- `src/main.tsx` — wrap with `<BrowserRouter>`
- `src/router.tsx` — route definitions
- `src/components/layout/app-layout.tsx` — flex container (sidebar + outlet)
- `src/components/layout/app-sidebar.tsx` — collapsible sidebar
- `src/components/layout/app-header.tsx` — title, AI status, theme toggle
- `src/components/layout/index.ts` — re-exports

### Files to Modify
- `src/App.tsx` — replace default content with `<RouterProvider>`

## Implementation Steps

### 1. Update src/main.tsx
Wrap app with router. react-router-dom v7 uses `createBrowserRouter` + `RouterProvider`.

### 2. Create src/router.tsx
```tsx
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout'

// Lazy-load each screen to keep bundle small
const Onboarding = lazy(() => import('@/pages/onboarding'))
const Dashboard = lazy(() => import('@/pages/dashboard'))
// ... all 13 routes
```

Route structure:
```
/onboarding              → OnboardingPage (no layout)
/new-project             → NewProjectPage (AppLayout, no header)
/                        → DashboardPage (AppLayout)
/decks                   → DecksPage (AppLayout)
/brainstorm              → BrainstormPage (AppLayout)
/brainstorm/:id          → BrainstormReportPage (AppLayout)
/generate-plan           → GeneratePlanPage (AppLayout)
/plans                   → PlansPage (AppLayout)
/plans/:id               → PlanReviewPage (AppLayout)
/tasks                   → TasksPage (AppLayout)
/cook/:taskId            → CookPage (AppLayout)
/worktrees               → WorktreesPage (AppLayout)
/settings                → SettingsPage (AppLayout)
```

Create placeholder page components in `src/pages/` (one file per screen).

### 3. AppLayout (app-layout.tsx)
```tsx
// flex min-h-screen
// <AppSidebar /> + <main flex-1 overflow-auto><Outlet /></main>
```
Under 80 lines. Accept optional `noHeader` prop.

### 4. AppSidebar (app-sidebar.tsx)
- Collapsed state: 60px wide, icons + tooltips
- Expanded: 240px with labels
- Top: Project Switcher dropdown
- Main nav: Dashboard, Brainstorm, Tasks (badge "5"), Plans, Decks, Worktrees
- Bottom: Settings, Help
- Icons: lucide-react
- Active route: `bg-accent text-accent-foreground border border-primary/20`

Keep under 150 lines — extract nav items to a constant array.

### 5. AppHeader (app-header.tsx)
- Left: page title + optional subtitle prop
- Right: AI status (pulsing green dot + "AI Connected"), theme toggle (Sun/Moon), Bell, user avatar
- Under 60 lines

### 6. Placeholder pages (src/pages/)
Each page: single file, returns `<div>PageName</div>` placeholder. Will be filled in subsequent phases.

Files: `onboarding.tsx`, `dashboard.tsx`, `decks.tsx`, `brainstorm.tsx`, `brainstorm-report.tsx`, `generate-plan.tsx`, `plans.tsx`, `plan-review.tsx`, `tasks.tsx`, `cook.tsx`, `worktrees.tsx`, `settings.tsx`, `new-project.tsx`

## Todo List

- [ ] Install react-router-dom (if not done in structure update)
- [ ] Create src/router.tsx with all routes (lazy loaded)
- [ ] Update src/App.tsx to use RouterProvider
- [ ] Create app-layout.tsx
- [ ] Create app-sidebar.tsx (collapsible)
- [ ] Create app-header.tsx
- [ ] Create 13 placeholder page files in src/pages/
- [ ] Verify all routes render without TS errors
- [ ] Test sidebar collapse toggle

## Success Criteria

- All 13 routes render (placeholder content ok)
- Sidebar collapses/expands
- Active nav item highlighted correctly
- No TypeScript errors
- `npx tsc --noEmit` passes
