# Phase 01 — Foundation (M0)

## Overview
- **Priority:** P0
- **Status:** pending
- **Goal:** SQLite init + migrations, CCS profile discovery, app layout finalization, connect stores to real DB.

## Key Insights
- CCS profiles discovered by parsing `~/.ccs/config.yaml` + scanning `~/.ccs/*.settings.json` — NOT via CLI
- OAuth accounts at `~/.ccs/instances/{name}/settings.json`
- rusqlite already in Cargo.toml, just needs init code
- 8 Zustand stores exist but use fake data — need to wire to invoke()

## Requirements
- SQLite database created on first launch at app data dir
- All 10 tables created via migration SQL
- CCS profile discovery returns list of CcsAccount objects
- Stores fetch real data via IPC on app load
- App layout sidebar shows project switcher placeholder

## Architecture

```
App launch → init_db() → run migrations → discover_ccs_profiles()
                                            ↓
                                    save accounts to DB
                                            ↓
                              Frontend loads via invoke() into stores
```

## Related Code Files

**CREATE:**
- `src-tauri/src/commands/db.rs` — init_db, run_migrations commands
- `src-tauri/src/commands/ccs.rs` — discover_ccs_profiles, get_ccs_accounts
- `src-tauri/src/db.rs` — SQLite connection pool/manager

**MODIFY:**
- `src-tauri/src/lib.rs` — register new commands, manage DB state
- `src-tauri/src/commands/mod.rs` — export db, ccs modules
- `src/lib/tauri.ts` — add typed wrappers for db/ccs commands
- `src/stores/project-store.ts` — fetch from DB via invoke
- `src/stores/deck-store.ts` — fetch from DB
- `src/stores/settings-store.ts` — fetch from DB
- `src/components/layout/sidebar.tsx` — project switcher placeholder

## Implementation Steps

<!-- Updated: Validation Session 1 - WAL mode, schema_version migration, CCS banner -->
1. Create `src-tauri/src/db.rs` — init SQLite, connection helper with `tauri::api::path::app_data_dir`
   - Enable WAL mode: `PRAGMA journal_mode=WAL;` on connection open
   - Create `schema_version` table: `CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY, applied_at TEXT)`
   - Migration runner: read SQL files from embedded resources, apply missing versions sequentially
2. Create `src-tauri/src/commands/db.rs` — `init_db` command that runs migration runner (creates all 10 tables as version 1)
3. Write migration SQL as versioned files: `migrations/001_initial_schema.sql` matching Phase 00 schema
4. Register DB state in `lib.rs` as managed Tauri state (`Mutex<Connection>`)
5. Create `src-tauri/src/commands/ccs.rs`:
   - `discover_ccs_profiles()` — parse `~/.ccs/config.yaml` (serde_yaml), scan `*.settings.json`
   - `get_ccs_accounts()` — read from DB
   - Merge: config.yaml profiles override file-based profiles
6. Register all new commands in `lib.rs` invoke_handler
7. Add typed wrappers in `src/lib/tauri.ts` for: initDb, discoverCcsProfiles, getCcsAccounts
8. Update stores to call invoke() on app init (useEffect in App.tsx or layout)
9. Call `init_db` + `discover_ccs_profiles` on app startup (Tauri setup hook or first render)

## Todo List
- [ ] db.rs — SQLite connection manager
- [ ] commands/db.rs — init_db + migrations
- [ ] commands/ccs.rs — profile discovery
- [ ] lib.rs — register commands + DB state
- [ ] tauri.ts — typed wrappers
- [ ] Stores wired to real DB
- [ ] App startup sequence (init → discover → load)

## Success Criteria
- `init_db` creates SQLite file with all 10 tables
- `discover_ccs_profiles` returns profiles from user's ~/.ccs/
- Stores populate from DB on app launch
- No `.unwrap()` in Rust code

## Risk Assessment
- `~/.ccs/config.yaml` may not exist if CCS not installed — return empty list + frontend shows install banner with link
- serde_yaml parsing: add as Cargo dependency if missing

## Next Steps
- M1 (Brainstorm), M2 (Onboarding), M3 (Dashboard), M7 (Tasks), M10 (Settings) can start after this
