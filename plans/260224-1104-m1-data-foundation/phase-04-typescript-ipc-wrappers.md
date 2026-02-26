# Phase 4 — TypeScript IPC Wrappers

## Context
- Phases 2-3: Rust commands define signatures
- Phase 3 audit: 35 MVP commands total (12 from P2, 23 from P3)
- Existing: `src/lib/tauri.ts` has 5 wrappers (CCS + git + fs)
- Pattern: `invoke<T>(commandName, args)` with typed return

## Overview
- **Priority:** P1
- **Status:** Pending
- **Description:** Add typed invoke wrappers for all 35 MVP CRUD commands. Split into focused modules.

## Key Insights
- Current `tauri.ts` = 50 lines. Adding 35 commands → exceeds 200-line limit
- Split by domain: `tauri-project.ts`, `tauri-task.ts`, etc.
- Re-export from `tauri.ts` index for backward compat
<!-- Red Team: 35 commands YAGNI audit — 2026-02-24 -->
- **Only create wrappers for commands that Phase 5 stores actually call** — no speculative wrappers for deferred commands

## Files to Create
- `src/lib/tauri-project.ts` — project + ccs_account wrappers
- `src/lib/tauri-deck.ts` — deck wrappers
- `src/lib/tauri-task.ts` — task wrappers
- `src/lib/tauri-plan.ts` — plan + phase wrappers
- `src/lib/tauri-brainstorm.ts` — session + insight wrappers
- `src/lib/tauri-worktree.ts` — worktree record wrappers
- `src/lib/tauri-settings.ts` — settings wrappers

## Files to Modify
- `src/lib/tauri.ts` — Convert to barrel export (re-export all modules)

## Store Consumer Mapping

Wrappers to create, aligned with Phase 5 stores:

| Wrapper file | Functions | Consumed by store |
|---|---|---|
| `tauri-project.ts` | createProject, listProjects, getProject, updateProject, deleteProject | `project-store.ts` |
| `tauri-deck.ts` | createDeck, listDecks, setActiveDeck, updateDeck, deleteDeck | `deck-store.ts` |
| `tauri-task.ts` | createTask, listTasks, getTask, updateTask, updateTaskStatus, deleteTask | `task-store.ts` |
| `tauri-plan.ts` | createPlan, listPlans, getPlan, deletePlan, createPhase, updatePhaseStatus, deletePhase | `plan-store.ts` |
| `tauri-brainstorm.ts` | createBrainstormSession, listBrainstormSessions, updateBrainstormSession, createKeyInsight, listKeyInsights, deleteKeyInsight | `brainstorm-store.ts` |
| `tauri-worktree.ts` | createWorktreeRecord, listWorktreeRecords, updateWorktreeRecord, deleteWorktreeRecord | `worktree-store.ts` |
| `tauri-settings.ts` | getSettings, updateSettings | `settings-store.ts` |

## Implementation Steps

1. Create each domain file with typed wrappers. Pattern:
```typescript
import { invoke } from '@tauri-apps/api/core';
import type { Project } from '@/types';

export async function createProject(args: {
  name: string;
  description?: string;
  gitPath: string;
}): Promise<Project> {
  return invoke<Project>('create_project', args);
}
```

2. **CRITICAL:** Arg names in `invoke()` must match Rust `#[tauri::command]` param names exactly. Rust uses snake_case → Tauri auto-converts camelCase. So TS `gitPath` maps to Rust `git_path`.

3. Each file covers one entity's CRUD — see Store Consumer Mapping table above for exact function list.

4. Update `tauri.ts` → barrel export:
```typescript
export * from './tauri-project';
export * from './tauri-deck';
export * from './tauri-task';
export * from './tauri-plan';
export * from './tauri-brainstorm';
export * from './tauri-worktree';
export * from './tauri-settings';
export * from './tauri-ccs'; // rename existing CCS wrappers
```

## Todo
- [ ] Create 7 domain-specific IPC wrapper files (only MVP-required commands)
- [ ] Refactor existing `tauri.ts` CCS wrappers into `tauri-ccs.ts`
- [ ] Convert `tauri.ts` to barrel export
- [ ] Verify TS types match Rust command signatures
- [ ] TypeScript compile check passes

## Success Criteria
- All 35 MVP commands have typed wrappers
- No wrappers for deferred/unused commands
- No file exceeds 200 lines
- Existing CCS wrappers still work (no breaking change)
- TypeScript strict mode passes
