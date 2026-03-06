# VividKit MVP v0.1 — Roadmap & Milestones (Brainstorm Report)

> **Date:** 2026-03-07
> **Type:** Brainstorm Report
> **Status:** Agreed
> **Input:** `plans/reports/mvp-prd-brainstorm.md`

---

## 1. Problem Statement

PRD brainstorm (1552 LOC) defines 16 routes, 12+ data models, 9 phases. Scope too large for agent-driven implementation — each phase risks exceeding 200K token context window. Need: clear milestone breakdown + doc strategy BEFORE implementation.

---

## 2. Decisions Confirmed

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Validate Plan + Red-Team | **Cut from v0.1** -> v0.2 | Complex conversational AI + QuestionCard; not core flow |
| Parallel cooking | **Single cook only** in v0.1 | No multi-session registry needed; simplifies UI + Rust |
| Doc strategy | **Integrated Tech Spec per-module** | PRD + Tech Spec (DB + API + edge cases + component states + ADR) in one file per module |
| Milestone size | **1 milestone = 1 module/screen** | ~3-5 Rust files + ~5-10 TS files = fits agent context |
| Priority order | **Reorder: Brainstorm first** | StreamView already built; validates core value earliest |

---

## 3. MVP v0.1 Scope (Trimmed)

### Routes (13, down from 16)

| Route | Module | Priority |
|-------|--------|----------|
| `/onboarding` | Onboarding | P0 |
| `/` | Dashboard | P0 |
| `/decks` | Decks | P0 |
| `/brainstorm` | Brainstorm | P0 |
| `/brainstorm/:id` | Brainstorm Report | P1 |
| `/generate-plan` | Generate Plan | P0 |
| `/plans` | Plans List | P1 |
| `/plans/:id` | Plan Review | P1 |
| `/tasks` | Tasks | P0 |
| `/cook/:taskId` | Cook Standalone | P0 |
| `/worktrees` | Worktrees | P1 |
| `/settings` | Settings | P0 |
| `/new-project` | New Project | P1 |

**Removed from v0.1:** `/validate-plan/:id`, `/red-team/:id`

### Data Models (10, removed 2)

Kept: Project, CcsAccount, Deck, KeyInsight, Plan, Phase, Task, Worktree, BrainstormSession, CookSession.
Removed: ValidationSession, RedTeamSession (v0.2).
Simplified Plan model: drop `validationStatus`, `redTeamStatus`, `redTeamReportPath`.

### Simplified Cook Flow

- 1 task cooking at a time (no parallel)
- No profile locking logic
- No `N cooking` counter in Kanban header
- Cook Sheet opens => any existing cook stops first
- Parallel cooking deferred to v0.2

---

## 4. Doc Strategy — Pre-Implementation

### What to produce BEFORE coding

For each milestone, create an **Integrated Technical Spec** containing:

```
{module}-tech-spec.md
  1. Overview (1-2 paragraphs)
  2. DB Schema (CREATE TABLE SQL)
  3. Tauri Commands (function signatures + Result types)
  4. IPC Contract (TypeScript invoke wrappers)
  5. Component Tree (React component hierarchy)
  6. State Management (Zustand store shape)
  7. Edge Cases & Error Handling
  8. Component States (idle/loading/error/empty/populated)
  9. ADR (decisions made, alternatives rejected)
  10. i18n Keys (new keys needed)
```

### Production order

| Doc | Scope | When |
|-----|-------|------|
| `global-tech-spec.md` | DB schema (all tables), shared types, IPC layer | Before M0 |
| `{module}-tech-spec.md` | Per-module spec | Before each milestone |

### Where to save

```
plans/260307-0039-mvp-roadmap/
  specs/
    global-tech-spec.md
    brainstorm-tech-spec.md
    onboarding-tech-spec.md
    ...
```

---

## 5. Milestone Roadmap

### Pre-Phase: Doc Sprint (D0)

**Goal:** Global Technical Spec — DB schema SQL for ALL models, shared TypeScript types, Tauri IPC contract signatures.

**Deliverables:**
- `global-tech-spec.md` — complete SQLite schema, Rust model structs, TS interfaces
- Update `docs/system-architecture.md` with revised data flow (no Validate/RedTeam)

**Why first:** Every module depends on DB schema + IPC types. Define once, reference everywhere.

---

### M0: Foundation

**Goal:** SQLite init + migrations, CCS detection, app layout finalization.

**Scope:**
- Rust: `commands/db.rs` — init SQLite, run migrations (all tables)
- Rust: `commands/ccs.rs` — `ccs detect` parse, save accounts to DB
- Rust: `models/` — all Serde structs matching DB schema
- TS: `lib/tauri.ts` — typed wrappers for new commands
- TS: `stores/` — connect stores to real DB via invoke()

**Files:** ~4 Rust + ~6 TS
**Depends on:** D0 (global-tech-spec)

---

### M1: Brainstorm (Core Value)

**Goal:** AI ideation via StreamView — validate the core product promise.

**Scope:**
- TS: Brainstorm page — StreamView + profile selector + input area
- TS: Post-completion actions (View Report, Save Insight)
- TS: Session persistence — save `sessionLogPath` to BrainstormSession via DB
- TS: Key Insights Dialog
- Rust: `commands/brainstorm.rs` — CRUD for BrainstormSession, KeyInsight
- Per-module spec: `brainstorm-tech-spec.md`

**Files:** ~2 Rust + ~8 TS
**Depends on:** M0
**Critical:** This milestone validates StreamView + CCS integration end-to-end.

---

### M2: Onboarding

**Goal:** First-run wizard. User exits with git repo + CCS detected + project created.

**Scope:**
- TS: 4-step wizard (Welcome, Git, AI Tools, Project)
- TS: Git setup — local repo picker via Tauri dialog
- Rust: `commands/project.rs` — create project, auto-create default deck
- Rust: Git validation (is valid repo?)
- Per-module spec: `onboarding-tech-spec.md`

**Files:** ~2 Rust + ~6 TS
**Depends on:** M0

---

### M3: Dashboard

**Goal:** Project overview + quick actions.

**Scope:**
- TS: Stats cards (tasks by status, worktree count) — invoke() for aggregate queries
- TS: Quick actions grid — navigation to all major routes
- Rust: `commands/dashboard.rs` — aggregate queries (task counts, worktree counts)
- Per-module spec: `dashboard-tech-spec.md`

**Files:** ~1 Rust + ~4 TS
**Depends on:** M0

---

### M4: Decks + Project Switcher

**Goal:** Deck management + project switching.

**Scope:**
- TS: Decks page — deck list, active toggle, create dialog
- TS: Sidebar project switcher dropdown
- TS: New Project page (`/new-project`)
- Rust: `commands/deck.rs` — CRUD, set active
- Per-module spec: `decks-tech-spec.md`

**Files:** ~1 Rust + ~7 TS
**Depends on:** M0, M2 (project creation flow)

---

### M5: Generate Plan

**Goal:** Plan generation from brainstorm output via StreamView.

**Scope:**
- TS: Generate Plan page — pipeline progress indicator + StreamView
- TS: Completion action -> navigate to Plan Review (skip Validate for v0.1)
- Rust: `commands/plan.rs` — create Plan, create Phases from parsed output
- Per-module spec: `generate-plan-tech-spec.md`

**Files:** ~1 Rust + ~5 TS
**Depends on:** M1 (Brainstorm creates context for plan)

---

### M6: Plans List + Review

**Goal:** Plan cards list, phase checklist, markdown preview.

**Scope:**
- TS: Plans list page — cards with phase progress bar
- TS: Plan Review page — phases checklist + markdown preview toggle
- TS: Cook Sheet slide-out (reusable, connects to Cook in M8)
- Per-module spec: `plans-review-tech-spec.md`

**Files:** ~1 Rust + ~6 TS
**Depends on:** M5

---

### M7: Tasks

**Goal:** Task CRUD, list + kanban views.

**Scope:**
- TS: Task list view — status/priority badges + Cook button
- TS: Kanban view — 4 columns (Backlog, Todo, In Progress, Done)
- TS: Add Task dialog
- TS: Task detail slide-out
- Rust: `commands/task.rs` — CRUD, status transitions
- Drag & drop: DISABLED for MVP (status change via buttons only)
- Per-module spec: `tasks-tech-spec.md`

**Files:** ~1 Rust + ~8 TS
**Depends on:** M0

---

### M8: Cook

**Goal:** Cook execution — StreamView in sheet + standalone page.

**Scope:**
- TS: Cook Sheet (slide-out panel) — StreamView + profile selector + stop button
- TS: Cook Standalone (`/cook/:taskId`) — full-page + progress + controls
- TS: Changed files summary (worktree diff)
- TS: Preview Changes dialog (file tree + diff panel)
- Rust: `commands/cook.rs` — CookSession CRUD, session-to-task linking
- Single cook only: opening cook on new task stops any existing session
- Per-module spec: `cook-tech-spec.md`

**Files:** ~1 Rust + ~8 TS
**Depends on:** M7 (tasks), M0 (worktree stubs)

---

### M9: Worktrees

**Goal:** Git worktree lifecycle management.

**Scope:**
- TS: Worktree list (grouped by status: Active, Ready, Merged)
- TS: Merge dialog (strategy selector + options)
- TS: Delete confirmation dialog
- Rust: `commands/worktree.rs` — create, list, merge, cleanup (git2)
- Per-module spec: `worktrees-tech-spec.md`

**Files:** ~1 Rust + ~5 TS
**Depends on:** M8 (cook creates worktrees)

---

### M10: Settings

**Goal:** App configuration — 4 tabs.

**Scope:**
- TS: General tab (language, theme, default IDE, updates, about)
- TS: AI & Commands tab (profiles list, command-provider mapping)
- TS: Git tab (default branch, naming pattern, worktree dir, auto-cleanup)
- TS: Editor tab (diff theme, font, StreamView options)
- CCS Test Console: already built, just hide behind dev mode
- Rust: `commands/settings.rs` — persist settings to DB
- Per-module spec: `settings-tech-spec.md`

**Files:** ~1 Rust + ~6 TS
**Depends on:** M0

---

### M11: Polish & Release

**Goal:** Production-ready quality.

**Scope:**
- Error boundaries on all routes
- Empty states for all list views
- Toast notification system
- Offline resilience (CCS not installed -> install guide)
- Cross-platform testing (macOS, Windows, Linux)
- App icon + Tauri metadata
- Build pipeline (GitHub Actions)
- i18n parity sweep (all keys in vi + en)

**Files:** ~scattered edits
**Depends on:** All milestones complete

---

## 6. Dependency Graph

```
D0 (Global Tech Spec)
 |
 v
M0 (Foundation)
 |
 +---> M1 (Brainstorm) ---> M5 (Generate Plan) ---> M6 (Plans)
 |
 +---> M2 (Onboarding) ---> M4 (Decks)
 |
 +---> M3 (Dashboard)
 |
 +---> M7 (Tasks) ---> M8 (Cook) ---> M9 (Worktrees)
 |
 +---> M10 (Settings)
 |
 v
M11 (Polish)
```

**Parallel opportunities:**
- M2 + M3 can run in parallel (both depend only on M0)
- M1 can start immediately after M0 (highest priority)
- M7 + M10 can run in parallel
- M5 depends on M1; M8 depends on M7

---

## 7. Estimated Scope Per Milestone

| Milestone | Rust Files | TS Files | Est. Complexity |
|-----------|-----------|----------|-----------------|
| D0 | 0 | 0 | Doc only |
| M0 | 4 | 6 | Medium (SQLite + migrations) |
| M1 | 2 | 8 | High (core value, E2E validation) |
| M2 | 2 | 6 | Low-Medium |
| M3 | 1 | 4 | Low |
| M4 | 1 | 7 | Medium |
| M5 | 1 | 5 | Medium |
| M6 | 1 | 6 | Medium |
| M7 | 1 | 8 | Medium |
| M8 | 1 | 8 | High (StreamView + worktree + diff) |
| M9 | 1 | 5 | Medium (git2 integration) |
| M10 | 1 | 6 | Low-Medium |
| M11 | 0 | scattered | Low |
| **Total** | **~16** | **~69** | — |

---

## 8. v0.2 Backlog (Deferred)

| Feature | Reason Deferred |
|---------|----------------|
| Validate Plan (`/validate-plan/:id`) | Complex conversational AI + QuestionCard |
| Red-Team Scan (`/red-team/:id`) | Optional security audit, not core flow |
| Parallel cooking (multiple tasks) | Multi-session registry, profile locking |
| Drag & drop in Kanban | Nice-to-have UX, not functional blocker |
| Session search/analytics | Post-MVP feature |

---

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tech Spec delays implementation | Medium | Keep specs concise (<200 LOC each), agent can draft |
| M1 (Brainstorm) fails E2E validation | High | StreamView + CCS already proven in Test Console; M1 reuses same components |
| git2 integration in M9 | Medium | Keep worktree commands simple; fallback to `git` CLI if git2 blocks |
| DB schema changes mid-implementation | Medium | Global schema defined in D0; use migration versioning |
| Single cook limitation frustrates users | Low | Clear UX messaging; v0.2 parallel cook planned |

---

## 10. Success Metrics (MVP v0.1)

1. New user onboards and runs first AI brainstorm session in <5 min
2. Brainstorm -> Generate Plan -> Tasks flow works end-to-end
3. Cook executes task via StreamView, shows changed files, merge works
4. All 13 routes functional
5. App builds on macOS (primary), Windows + Linux (secondary)
6. StreamView smooth with 500+ entries

---

## 11. Next Steps

1. **Create implementation plan** via `/ck:plan` with this roadmap as context
2. **D0 first:** Generate `global-tech-spec.md` (DB schema + shared types + IPC contract)
3. **M0 execution:** Foundation milestone
4. **M1 execution:** Brainstorm — validate core value proposition

---

## Resolved Questions (from follow-up discussion)

### Q1: Brainstorm insight persistence
**Approach:** `BrainstormSession.sessionLogPath` + `status` (completed/archived). JSONL session log = source of truth, markdown report = derived artifact. Both persistent on disk. From `/brainstorm/:id`, user can: "Continue Session" (resume CCS in same context), "Create Plan", or "Save as Key Insight".

### Q2: Cook session resume
**Answer:** Resume, not fresh start. Each cook = 1 isolated worktree (code persists on disk) + 1 JSONL session log (persistent). Reopen cook = reload existing session log in StreamView + option to trigger new CCS command in same worktree directory.

### Q3: CCS profile discovery
**Answer:** Do NOT use `ccs detect` or `ccs list` CLI commands. Instead, Rust backend directly parses:
1. `~/.ccs/config.yaml` — `profiles` (API profiles) + `accounts` (OAuth/subscription accounts)
2. `~/.ccs/*.settings.json` — file-based API profiles (scan directory)
3. OAuth account settings at `~/.ccs/instances/{name}/settings.json`
4. Merge: config.yaml overrides file-based profiles

Reference: `happy-ccs.mjs` from `thieung/dev-toolbox` implements this exact pattern.

### Q4: ClaudeKit structure (for VividKit command mapping)
Skills = slash commands (`/plan`, `/cook`, `/brainstorm`), each = prompt template + optional scripts at `~/.claude/skills/*/SKILL.md`. VividKit's "Command -> Provider Mapping" in Settings maps these skill names to CCS profiles. Categories: core, plan, cook, review, test, fix, brainstorm, docs, git, team, frontend, backend, infra.

## Remaining Unresolved Questions

1. **Plan phase auto-creation:** When plan is generated by AI, how does VividKit parse the plan.md to extract phases? Regex? Structured output from CCS? Needs clarification in generate-plan-tech-spec.
