---
title: "VividKit MVP v0.1 Implementation Plan"
description: "13-phase plan: Foundation through Polish for VividKit Desktop MVP"
status: pending
priority: P1
effort: 40h
branch: main
tags: [mvp, full-stack, tauri, react, sqlite, streamview]
created: 2026-03-07
---

# VividKit MVP v0.1 — Implementation Plan

## Phase Overview

| # | Phase | Milestone | Status | Effort | Depends On |
|---|-------|-----------|--------|--------|------------|
| 00 | [Global Tech Spec](phase-00-global-tech-spec.md) | D0 | pending | 2h | — |
| 01 | [Foundation](phase-01-foundation.md) | M0 | pending | 4h | D0 |
| 02 | [Brainstorm](phase-02-brainstorm.md) | M1 | pending | 5h | M0 |
| 03 | [Onboarding](phase-03-onboarding.md) | M2 | pending | 3h | M0 |
| 04 | [Dashboard](phase-04-dashboard.md) | M3 | pending | 2h | M0 |
| 05 | [Decks + Project Switcher](phase-05-decks-project-switcher.md) | M4 | pending | 3h | M0, M2 |
| 06 | [Generate Plan](phase-06-generate-plan.md) | M5 | pending | 3h | M1 |
| 07 | [Plans List + Review](phase-07-plans-list-review.md) | M6 | pending | 3h | M5 |
| 08 | [Tasks](phase-08-tasks.md) | M7 | pending | 4h | M0 |
| 09 | [Cook](phase-09-cook.md) | M8 | pending | 5h | M7 |
| 10 | [Worktrees](phase-10-worktrees.md) | M9 | pending | 3h | M8 |
| 11 | [Settings](phase-11-settings.md) | M10 | pending | 2h | M0 |
| 12 | [Polish + Release](phase-12-polish-release.md) | M11 | pending | 3h | All |

## Dependency Graph

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

## Parallel Opportunities

- M1 + M2 + M3 + M7 + M10 can all start after M0
- M5 depends on M1; M4 depends on M2; M8 depends on M7; M9 depends on M8
- M6 depends on M5

## Key Decisions

1. **CCS profile discovery**: Parse `~/.ccs/config.yaml` + scan `~/.ccs/*.settings.json` — no CLI commands
2. **Single cook only** in v0.1 — no parallel cooking
3. **No Validate Plan / Red-Team** — deferred to v0.2
4. **No drag-drop kanban** — status change via buttons only
5. **StreamView reuse**: All AI screens use existing `ccs-stream/` components
6. **Cook = resume**: Worktree + JSONL session log persist on disk

## Validation Log

### Session 1 — 2026-03-07
**Trigger:** Pre-implementation validation of MVP v0.1 plan
**Questions asked:** 7

#### Questions & Answers

1. **[Architecture]** DB connection management: Plan chọn `Mutex<Connection>` (single connection). Với app single-user local-first, approach nào?
   - Options: Mutex<Connection> | r2d2 connection pool | Mutex<Connection> + WAL mode
   - **Answer:** Mutex<Connection> + WAL mode
   - **Rationale:** WAL enables concurrent reads immediately. Easy to migrate to pool later (1-2h refactor). Best balance of simplicity + capability for v0.1.

2. **[Assumptions]** CCS profile discovery: Nếu CCS chưa cài, app nên xử lý thế nào?
   - Options: Empty list + banner | Force onboarding | Manual profile input
   - **Answer:** Empty list + banner
   - **Rationale:** Non-blocking UX. App remains usable for exploration; banner guides CCS install.

3. **[Risks]** Single cook enforcement: Stop existing cook trước khi start mới có thể mất data. Xử lý sao?
   - Options: Confirm dialog | Auto-pause, no stop | Block until done
   - **Answer:** Confirm dialog
   - **Rationale:** User stays in control. Explicit confirmation prevents accidental data loss.

4. **[Architecture]** Project/Deck switching re-scope: Khi switch, tất cả stores cần refresh. Cơ chế nào?
   - Options: Global context event | Store dependency chain | React context + useEffect
   - **Answer:** Global context event
   - **Rationale:** Centralized, decoupled. Each store subscribes independently, easy to extend.

5. **[Architecture]** DB: Mutex<Connection> + WAL mode confirmed.
   - Options: Mutex + WAL | r2d2 pool ngay
   - **Answer:** Mutex + WAL
   - **Rationale:** Confirmed. Simple start, WAL for concurrent reads, pool upgrade path clear.

6. **[Scope]** Schema migration strategy: Khi schema thay đổi ở v0.2, approach nào?
   - Options: Version number + SQL files | Drop & recreate | refinery crate
   - **Answer:** Version number + SQL files
   - **Rationale:** Lightweight, no external deps. schema_version table + sequential SQL files. Sufficient for v0.1→v0.2 transition.

7. **[Architecture]** Task state machine: 7 states, enforce transitions ở đâu?
   - Options: Rust only | Both Rust + Frontend | Rust + DB constraint
   - **Answer:** Rust only
   - **Rationale:** Single source of truth in Rust. Frontend just calls and handles errors. Keeps frontend simple.

#### Confirmed Decisions
- DB: Mutex<Connection> + WAL mode — simple, concurrent reads, easy pool upgrade
- CCS missing: empty list + install banner — non-blocking
- Cook enforcement: confirm dialog before stopping existing cook
- Context switch: global event emitter — decoupled store refresh
- Migrations: version number + SQL files — lightweight, no crate deps
- Task state machine: Rust-only enforcement — single source of truth

#### Action Items
- [ ] Phase 01: Add WAL mode pragma to init_db()
- [ ] Phase 01: Add schema_version table + migration runner
- [ ] Phase 01: Add CCS-not-found banner component
- [ ] Phase 05: Implement global context-changed event emitter
- [ ] Phase 08: Task state machine validation in Rust only
- [ ] Phase 09: Confirm dialog before stopping existing cook

#### Impact on Phases
- Phase 01: Add WAL pragma, schema_version table, migration runner, CCS banner
- Phase 05: Global context event for project/deck switching
- Phase 08: State machine enforcement in Rust commands only
- Phase 09: Confirm dialog UX for single cook enforcement
