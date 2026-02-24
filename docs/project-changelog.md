# Project Changelog — VividKit Desktop

## 2026-02-24

### Added
- M1 Data Foundation backend persistence layer:
  - SQLite DB bootstrap on app startup via `db::init_db(app_data_dir)`.
  - Connection pool with PRAGMA initialization (`foreign_keys=ON`, `journal_mode=WAL`).
  - Versioned migration baseline (`schema_version`, v1 schema, seed row for `app_settings`).
- New Rust command modules for M1 data domains:
  - `project`, `deck`, `task`, `plan`, `brainstorm`, `worktree_cmd`, `settings`, `ccs_profile`.
- Dynamic CCS profile listing command registration:
  - `list_ccs_profiles` backend command is available in invoke handler.
- TypeScript domain IPC wrapper split under `src/lib/tauri-*.ts` and barrel export via `src/lib/tauri.ts`.

### Changed
- Zustand stores were refactored from mock/in-memory flows to real IPC-backed CRUD for core M1 domains:
  - `project-store`, `deck-store`, `task-store`, `plan-store`, `brainstorm-store`, `worktree-store`, `settings-store`.
- App initialization now loads persisted settings/projects and restores `lastActiveProjectId` when available.
- Follow-up hardening after Wave 5 review: `settings-store` now serializes settings writes with a mutation queue and applies safer patch merge logic to avoid lost updates under concurrent writes (Task #17 completed).

### Quality Gates
- Wave 5 test gate: PASS (`cargo check`, `npm run build`).
- Wave 5 code review gate: PASS (no release blocker for M1 Data Foundation).
- Review follow-up closure: High settings lost-update finding resolved in Task #17.

### Known Issues / Follow-up
- **Medium:** dynamic `list_ccs_profiles` backend capability is available, but settings UI consumer still uses hardcoded profile list.
