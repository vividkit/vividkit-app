# Phase 5 — Zustand Stores Refactor

## Context
- Phase 4: `phase-04-typescript-ipc-wrappers.md` (provides typed IPC functions)
- Existing stores: `src/stores/` — 7 files, all in-memory mock data

## Overview
- **Priority:** P1
- **Status:** Pending
- **Description:** Refactor all 7 Zustand stores from in-memory mock data to IPC-backed persistence.

## Key Insights
- Current stores only have `add` actions — need `load`, `update`, `remove`
<!-- Red Team: Optimistic→pessimistic clarify — 2026-02-24 -->
- **Update pattern is pessimistic:** `await IPC call → on success, update store`. Never update store before IPC resolves. On error, store stays unchanged — no rollback needed.
- `load*` actions called on app init or route mount
- Keep store as cache layer — DB is source of truth
<!-- Red Team: Store error handling — 2026-02-24 -->
<!-- Updated: Validation Session 1 - shadcn/ui toast for error handling -->
- Every async store action MUST have try/catch + toast error notification (use **shadcn/ui toast** component — `npx shadcn@latest add toast` if not already installed)
- Every store interface MUST include `error: string | null` field

## Files to Modify
- `src/stores/project-store.ts` — Add load, update, remove + IPC calls
- `src/stores/deck-store.ts` — Add load, setActive, update, remove + IPC
- `src/stores/task-store.ts` — Add load, update, updateStatus, remove + IPC
- `src/stores/plan-store.ts` — Add load, remove + phase actions + IPC
- `src/stores/brainstorm-store.ts` — Add load, update session, insight CRUD + IPC
- `src/stores/worktree-store.ts` — Add load, update, remove + IPC
- `src/stores/settings-store.ts` — Add load, save + IPC

## Implementation Steps

<!-- Red Team: Optimistic→pessimistic clarify — 2026-02-24 -->
<!-- Red Team: Store error handling — 2026-02-24 -->
1. **Pattern for each store (pessimistic + error handling):**
```typescript
import { create } from 'zustand';
import { listProjects, createProject, deleteProject } from '@/lib/tauri';
import { toast } from '@/components/ui/toast'; // or project's toast util

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  loading: boolean;
  error: string | null;  // MANDATORY on every store
  loadProjects: () => Promise<void>;
  addProject: (args: CreateProjectArgs) => Promise<Project | null>;
  removeProject: (id: string) => Promise<void>;
  setActiveProject: (id: string) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProjectId: null,
  loading: false,
  error: null,
  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await listProjects();
      set({ projects, loading: false });
    } catch (e) {
      const msg = String(e);
      set({ loading: false, error: msg });
      toast.error(msg);
    }
  },
  addProject: async (args) => {
    try {
      const project = await createProject(args);
      // Pessimistic: update store only after IPC success
      set((s) => ({ projects: [...s.projects, project] }));
      return project;
    } catch (e) {
      const msg = String(e);
      set({ error: msg });
      toast.error(msg);
      return null;
    }
  },
  removeProject: async (id) => {
    try {
      await deleteProject(id);
      // Pessimistic: remove from store only after IPC success
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    } catch (e) {
      const msg = String(e);
      set({ error: msg });
      toast.error(msg);
    }
  },
}));
```

2. Refactor each store following same pattern:
   - Add `loading: boolean` and `error: string | null` state
   - `load*` async action — fetches from DB, replaces local state on success
   - `add*` action — calls IPC create, appends to local state only on success
   - `update*` action — calls IPC update, patches local state only on success
   - `remove*` action — calls IPC delete, filters local state only on success
   - Every async action: try/catch + `set({ error: msg })` + `toast.error(msg)`
   - Remove hardcoded mock data arrays

3. **Settings store** — special: load once on app init, save on change
4. **Plan store** — `loadPlans` includes nested phases from IPC response

## Todo
- [ ] Refactor `project-store.ts` — pessimistic IPC-backed CRUD + error/toast
- [ ] Refactor `deck-store.ts` — pessimistic IPC-backed CRUD + setActive + error/toast
- [ ] Refactor `task-store.ts` — pessimistic IPC-backed CRUD + status transitions + error/toast
- [ ] Refactor `plan-store.ts` — pessimistic IPC-backed with nested phases + error/toast
- [ ] Refactor `brainstorm-store.ts` — sessions + insights IPC + error/toast
- [ ] Refactor `worktree-store.ts` — pessimistic IPC-backed CRUD + error/toast
- [ ] Refactor `settings-store.ts` — load/save IPC + error/toast
- [ ] Remove all mock/hardcoded data
- [ ] Verify `error: string | null` present in every store interface

## Success Criteria
- All stores call IPC functions (no hardcoded data)
- All async actions are pessimistic (store updated only after IPC success)
- All async actions have try/catch + toast error notification
- All store interfaces include `error: string | null`
- Data persists between app restarts
- `loading` state used by UI for loading indicators
- Stores stay under 200 lines each
- Existing UI components render without errors (may show empty states)
