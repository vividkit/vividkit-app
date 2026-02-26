# Development Roadmap — VividKit Desktop

## Product Vision

GUI companion that makes **Claude Code CLI + CCS** accessible to everyone.
Core mechanic: Rust spawns PTY `ccs [profile]`, streamed via xterm.js. UI hides CLI complexity.

---

## MVP Scope

5 modules across 13 routes. Single-user, local-first, offline-capable.

### Routes

| Route | Module | Status |
|-------|--------|--------|
| `/onboarding` | Onboarding | 🟡 UI prototype |
| `/` | Dashboard | 🟡 UI prototype |
| `/decks` | Project Deck | 🟡 UI prototype |
| `/brainstorm` | Brainstorm | 🟡 UI prototype |
| `/brainstorm/:id` | Brainstorm Report | 🟡 UI prototype |
| `/generate-plan` | Generate Plan | 🟡 UI prototype |
| `/plans` | Plans | 🟡 UI prototype |
| `/plans/:id` | Plan Review | 🟡 UI prototype |
| `/tasks` | Tasks | 🟡 UI prototype |
| `/cook/:taskId` | Cook Standalone | 🟡 UI prototype |
| `/worktrees` | Worktrees | 🟡 UI prototype |
| `/settings` | Settings | 🟡 UI prototype |
| `/new-project` | New Project | 🟡 UI prototype |

### Completion Status

| Layer | Status |
|-------|--------|
| UI Components | 🟡 ~80% (routes/components largely present; some flows still prototype/hardcoded) |
| CCS PTY Integration | ✅ Production-ready (ai.rs) |
| SQLite Persistence | ✅ M1 foundation implemented (r2d2 pool + v1 migration + SQLite schema) |
| Git Operations (git2) | ❌ Stubs only |
| Worktree CRUD | 🟡 Persistence CRUD implemented (`worktree_cmd`); git lifecycle wiring still partial |
| Store → IPC Integration | 🟡 Core stores wired to Tauri IPC (project/deck/task/plan/brainstorm/worktree/settings); some UI consumers still prototype |
| i18n Keys | 🟡 Structure ready, keys incomplete |

---

## Data Models

| Model | Key Fields |
|-------|-----------|
| `Project` | id, name, gitPath, ccsConnected, ccsAccounts[] |
| `CcsAccount` | provider, email, status (active/paused/exhausted) |
| `Deck` | id, projectId, name, isActive |
| `KeyInsight` | id, projectId, deckId, title, reportPath |
| `Plan` | id, deckId, name, reportPath, planPath, phases[] |
| `Phase` | id, planId, name, description, filePath, order, done |
| `Task` | id, deckId, type, name, status, priority, planId?, phaseId?, worktreeName? |
| `Worktree` | id, projectId, taskId, branch, status, filesChanged, mergedAt? |
| `BrainstormSession` | id, deckId, prompt, reportPath, status |

**Enums:**
- Task status: `backlog → todo → in_progress → done`
- Task type: `generated` (from Plan phases) | `custom` (user-created)
- Task priority: `low | medium | high`
- Worktree status: `active → ready → merged`
- CCS account status: `active | paused | exhausted`

---

## Milestones

### M1 — Data Foundation ✅ Complete (Wave 5 gate passed)
**Goal:** SQLite persistence + Rust CRUD commands + stores wired to IPC.
**Ref:** `plans/260224-1104-m1-data-foundation/plan.md`

- [x] SQLite schema: versioned migration for all 9 models (v1 migration + schema_version)
- [x] Rust CRUD commands: project, deck, task, plan, phase, brainstorm, worktree, key-insight, settings
- [x] Tauri IPC wrappers: typed invoke functions for all CRUD ops
- [x] Zustand stores refactor: replace mock data with IPC calls
- [x] App initialization: DB setup on first launch, load active project

**Wave 5 quality gates:** Test gate PASS (`cargo check`, `npm run build`), review gate PASS (no release blocker).
**Post-gate follow-up:** High-priority settings lost-update race was fixed in Task #17 (`settings-store` mutation queue + safer patch merge).

### M2 — Core Workflows ⬜ Not Started
**Goal:** Wire real CCS PTY into brainstorm/cook. Plan generation + phase tracking.
**Depends on:** M1

- [ ] Brainstorm terminal → real CCS session → save report to disk + DB
- [ ] Plan generation via CCS → parse phases → persist to DB
- [ ] Task auto-generation from plan phases
- [ ] Cook terminal → real CCS execution per task
- [ ] Cook progress: real output streaming (replace mock progress)

### M3 — Git & Worktree Integration ⬜ Not Started
**Goal:** git2 operations: status, commit, diff, worktree lifecycle.
**Depends on:** M1, partially M2

- [ ] git2: `git_status`, `git_diff`, `git_commit`
- [ ] git2: `worktree_create`, `worktree_list`, `worktree_remove`
- [ ] git2: `worktree_merge` (merge/squash/rebase strategies)
- [ ] Wire worktree UI to real git2 commands
- [ ] Cook flow: create worktree → execute → show diff → merge

### M4 — Onboarding + Settings + Polish ⬜ Not Started
**Goal:** First-run wizard, settings persistence, error handling, release prep.
**Depends on:** M1-M3

- [ ] Onboarding wizard: real CCS detect + git repo picker + project creation
- [ ] Settings: persist to DB, load on app start
- [ ] Error boundaries on all routes
- [ ] Empty states for all list views
- [ ] Toast notifications system-wide
- [ ] Offline resilience (CCS/git not installed → guide)
- [ ] Cross-platform testing (macOS, Windows, Linux)
- [ ] App icon + metadata + build pipeline

---

## Key User Journey

```
Onboarding → Dashboard → Decks (set active)
  → Brainstorm (AI session via ccs)
    → Generate Plan (ccs produces plan)
      → Plan Review (phases checklist)
        → Tasks (cook each phase via ccs)
          → Worktrees (merge when done)
```
