# Phase 00 — Global Tech Spec (D0)

## Overview
- **Priority:** P0
- **Status:** pending
- **Type:** Documentation only — no code changes
- **Goal:** Define DB schema SQL, shared TS types, Rust model structs, Tauri IPC contract for ALL models before any implementation begins.

## Key Insights
- 10 data models: Project, CcsAccount, Deck, KeyInsight, Plan, Phase, Task, Worktree, BrainstormSession, CookSession
- v0.1 cuts ValidationSession + RedTeamSession (deferred to v0.2)
- Plan model simplified: no validationStatus, redTeamStatus, redTeamReportPath
- Task states: backlog, todo, cooking, paused, review, done, failed

## Requirements

### DB Schema (SQLite via rusqlite)
Define CREATE TABLE statements for all 10 models with:
- UUID primary keys (TEXT), created_at/updated_at (TEXT ISO8601)
- Foreign keys with ON DELETE CASCADE where appropriate
- Indexes on frequently queried columns (projectId, deckId, status)

### Rust Model Structs
- Serde structs in `src-tauri/src/models/` matching DB schema
- All derive `Serialize, Deserialize, Clone, Debug`
- Field names snake_case in Rust, camelCase via `#[serde(rename_all = "camelCase")]`

### TypeScript Interfaces
- Interfaces in `src/types/` matching Rust structs
- One file per domain (already exist, need updating)

### Tauri IPC Contract
- Command signatures for each module (function name, params, return type)
- Document in spec file, implement in later phases

## Related Code Files

**MODIFY:**
- `src/types/project.ts` — add missing fields
- `src/types/task.ts` — add cook-related fields, status enum
- `src/types/brainstorm.ts` — add sessionLogPath, status
- `src/types/plan.ts` — simplify (remove validation/redTeam)
- `src/types/deck.ts` — verify fields
- `src/types/worktree.ts` — add taskId, mergedAt
- `src-tauri/src/models/project.rs` — add all fields
- `src-tauri/src/models/task.rs` — add status enum, cook fields
- `src-tauri/src/models/config.rs` — verify settings fields

**CREATE:**
- `src/types/cook-session.ts` — CookSession interface
- `src/types/ccs-account.ts` — CcsAccount interface
- `src/types/key-insight.ts` — KeyInsight interface
- `src-tauri/src/models/deck.rs` — Deck struct
- `src-tauri/src/models/plan.rs` — Plan + Phase structs
- `src-tauri/src/models/brainstorm.rs` — BrainstormSession struct
- `src-tauri/src/models/cook_session.rs` — CookSession struct
- `src-tauri/src/models/worktree.rs` — Worktree struct
- `src-tauri/src/models/key_insight.rs` — KeyInsight struct
- `src-tauri/src/models/ccs_account.rs` — CcsAccount struct

## Implementation Steps

1. Draft full SQLite schema SQL (all 10 tables) in the spec doc
2. Define Rust structs for each model with serde annotations
3. Update all TypeScript interfaces to match Rust structs exactly
4. Create new TS type files for missing models (CookSession, CcsAccount, KeyInsight)
5. Create new Rust model files for missing models
6. Update `src-tauri/src/models/mod.rs` exports
7. Update `src/types/index.ts` barrel exports
8. Document IPC command signatures per module (name, args, return)
9. Update `docs/system-architecture.md` — remove Validate/RedTeam references

## Todo List
- [ ] SQLite schema SQL for all 10 tables
- [ ] Rust model structs (10 files)
- [ ] TypeScript interfaces (10 files)
- [ ] IPC contract signatures documented
- [ ] models/mod.rs + types/index.ts updated
- [ ] system-architecture.md updated

## Success Criteria
- All 10 model structs compile in Rust
- All TS interfaces have no type errors
- DB schema SQL is valid SQLite syntax
- IPC contract covers all CRUD operations per module

## Risk Assessment
- Schema changes later will require migration files — keep schema minimal for v0.1
- Field naming mismatch between Rust/TS — use serde rename_all consistently

## Next Steps
- Phase 01 (Foundation) uses this schema to create actual migrations
