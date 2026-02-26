---
title: "M1 — Data Foundation"
description: "SQLite persistence + Rust CRUD commands + Zustand stores wired to IPC"
status: pending
priority: P1
effort: 16h
branch: mvp
tags: [backend, database, infrastructure]
created: 2026-02-24
---

# M1 — Data Foundation

## Overview

Replace all mock/in-memory data with SQLite persistence via rusqlite. Create Rust CRUD commands for all 9 data models + settings. Wire Zustand stores to Tauri IPC.

**Current state:** UI prototype with mock data. Only real backend = CCS PTY (ai.rs). No DB code exists despite `rusqlite` in Cargo.toml.

## Key Decisions

- **DB location:** `app_data_dir()` via `tauri::Manager` — standard Tauri approach
- **CCS accounts:** Separate table (normalized), FK to project
- **Migrations:** Inline SQL in Rust (KISS — no external .sql files)
- **Settings:** Single row in SQLite `app_settings` table
- **IDs:** UUID v4 strings (consistent with existing TS types)
- **Timestamps:** ISO 8601 strings (SQLite TEXT, no chrono dependency needed)

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | DB module + schema migration | Pending | 3h | [phase-01](./phase-01-db-module-and-schema.md) |
| 2 | Core entity commands (project, ccs_account, deck, settings) | Pending | 3h | [phase-02](./phase-02-core-entity-commands.md) |
| 3 | Content entity commands (task, plan, phase, brainstorm, insight, worktree) | Pending | 3h | [phase-03](./phase-03-content-entity-commands.md) |
| 4 | TypeScript IPC wrappers | Pending | 2h | [phase-04](./phase-04-typescript-ipc-wrappers.md) |
| 5 | Zustand stores refactor | Pending | 3h | [phase-05](./phase-05-zustand-stores-refactor.md) |
| 6 | App initialization + integration | Pending | 2h | [phase-06](./phase-06-app-init-and-integration.md) |

## Dependencies

- Phase 1 → all others depend on DB module
- Phase 2-3 → can be done sequentially (shared DB patterns)
- Phase 4 → depends on 2-3 (needs Rust command signatures)
- Phase 5 → depends on 4 (needs TS wrappers)
- Phase 6 → depends on all

## Architecture

```
React Store → invoke() → Rust Command → rusqlite → SQLite file
     ↑                                                    │
     └──────────── Result<T, String> ◄────────────────────┘
```

## Risks

| Risk | Mitigation |
|------|------------|
| Schema mismatch TS ↔ Rust | Align models with existing TS types first |
| DB file corruption | WAL mode + proper connection handling |
| Migration ordering | Single versioned migration table |

## Red Team Review

<!-- Red Team: Red Team Review section — 2026-02-24 -->

### Session — 2026-02-24
**Findings:** 15 (14 accepted, 1 rejected)
**Severity:** 5 Critical, 7 High, 3 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Mutex→connection pool | Critical | Accept | Phase 1 |
| 2 | PRAGMA FK per-connection | Critical | Accept | Phase 1 |
| 3 | Migration transaction+INSERT OR IGNORE | Critical | Accept | Phase 1 |
| 4 | git_path validation | Critical | Accept | Phase 2 |
| 5 | report_path sandboxing | Critical | Reject | — |
| 6 | 35 commands YAGNI audit | High | Accept | Phase 3 |
| 7 | Rust enums for status/priority | High | Accept | Phase 2, 3 |
| 8 | N+1 query list_projects | High | Accept | Phase 2 |
| 9 | set_active_deck transaction | High | Accept | Phase 2 |
| 10 | useAppInit error handling | High | Accept | Phase 6 |
| 11 | Store error handling | High | Accept | Phase 5 |
| 12 | activeProjectId in DB only | High | Accept | Phase 1, 6 |
| 13 | FK indexes | Medium | Accept | Phase 1 |
| 14 | files_changed drop from schema | Medium | Accept | Phase 1 |
| 15 | Optimistic→pessimistic clarify | Medium | Accept | Phase 5 |

## Validation Log

### Session 1 — 2026-02-24
**Trigger:** Initial plan validation before implementation
**Questions asked:** 5

#### Questions & Answers

1. **[Architecture]** UUID generation: Rust backend hay Frontend TS tạo ID trước khi gửi qua IPC?
   - Options: Rust backend tạo UUID | Frontend tạo UUID trước | Hybrid
   - **Answer:** Rust backend tạo UUID
   - **Rationale:** Backend is single source of truth. Consistent with pessimistic pattern — frontend sends data, backend creates ID + timestamp.

2. **[Scope]** CcsProvider enum: danh sách providers có đủ không?
   - Options: Giữ 4+OpenRouter | Match TS types | String thay enum
   - **Answer:** Dynamic scan ~/.ccs/ at runtime
   - **Custom input:** Analyze cách lấy profiles tại happy-ccs.mjs — profiles discovered from ~/.ccs/config.yaml + *.settings.json + instances/
   - **Rationale:** CCS profiles are user-configured, not fixed. Hardcoded enum would break for custom profiles. `CcsAccount.provider` stays as String (profile name). Add `list_ccs_profiles` Rust command that scans ~/.ccs/ directory.

3. **[Testing]** M1 không có automated tests. Thêm Rust integration tests?
   - Options: Manual smoke test đủ | Basic Rust tests | Full test suite
   - **Answer:** Manual smoke test là đủ cho M1
   - **Rationale:** M1 focus on foundation. Tests added in later milestones.

4. **[Dependencies]** Toast notification system cho Phase 5 error handling?
   - Options: shadcn/ui toast | sonner | Custom
   - **Answer:** Dùng shadcn/ui toast
   - **Rationale:** Consistent with existing design system. No extra dependency.

5. **[Scope]** CCS profiles dynamic vs hardcoded enum?
   - Options: Dynamic scan | Hardcoded + fallback | Hardcoded only
   - **Answer:** Dynamic scan ~/.ccs/ at runtime
   - **Rationale:** Profiles are user-configured via config.yaml + settings files. Enum would limit flexibility.

#### Confirmed Decisions
- UUID: Rust backend generates (via `uuid::Uuid::new_v4()`)
- CCS profiles: Dynamic discovery, `provider` field stays String (not enum)
- Testing: Manual smoke test for M1
- Toast: shadcn/ui toast component
- Timestamps: Rust backend generates ISO 8601 strings

#### Action Items
- [ ] Remove `CcsProvider` enum from Phase 2 — use String for provider field
- [ ] Add `list_ccs_profiles` command to Phase 2 — scans ~/.ccs/ for profiles
- [ ] Add shadcn/ui toast setup note to Phase 5
- [ ] Clarify in Phase 2+3: backend generates UUID + timestamp, not frontend

#### Impact on Phases
- Phase 2: Remove CcsProvider enum, keep CcsAccountStatus enum. Add list_ccs_profiles command. Clarify UUID generation in backend.
- Phase 3: No change (enums for task/phase status still valid)
- Phase 5: Add note about shadcn/ui toast dependency for error handling
