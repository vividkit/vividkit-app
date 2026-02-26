# Phase 1 — DB Module + Schema Migration

## Context
- Brainstorm: `plans/reports/brainstorm-260224-1104-mvp-completion-strategy.md`
- Roadmap: `docs/development-roadmap.md`
- Existing models: `src-tauri/src/models/` (project.rs, task.rs, config.rs — incomplete)

## Overview
- **Priority:** P1 (blocks all other phases)
- **Status:** Pending
- **Description:** Create rusqlite DB module with connection management, versioned migrations, and full schema for all models.

## Requirements
- SQLite file at `app_data_dir()/vividkit.db`
- WAL journal mode for concurrent reads
- Versioned migration system (simple `schema_version` table)
- All 10 tables created: projects, ccs_accounts, decks, key_insights, plans, phases, tasks, worktrees, brainstorm_sessions, app_settings

## Files to Create
- `src-tauri/src/db/mod.rs` — DB state struct, init function, connection pool
- `src-tauri/src/db/migrations.rs` — Migration runner + V1 schema SQL

## Files to Modify
- `src-tauri/src/lib.rs` — Add DB init in setup, register as managed state
- `Cargo.toml` — Add `uuid`, `r2d2`, `r2d2_sqlite` dependencies

<!-- Red Team: Mutex→connection pool — 2026-02-24 -->
<!-- Red Team: PRAGMA FK per-connection — 2026-02-24 -->

## Implementation Steps

<!-- Red Team: Mutex→connection pool — 2026-02-24 -->
1. Create `src-tauri/src/db/mod.rs`:
   - Use `r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>` instead of `Mutex<Connection>`
   - `DbState` wraps `r2d2::Pool<SqliteConnectionManager>`
   - `init_db(app_data_dir: PathBuf) -> Result<DbState, String>` — open/create DB, set WAL mode, run migrations
   - Pool allows concurrent readers without lock contention

<!-- Red Team: PRAGMA FK per-connection — 2026-02-24 -->
   - Set `PRAGMA foreign_keys = ON` via pool's `connection_customizer` callback (not once at init), so every connection from the pool has FK enforcement:
   ```rust
   #[derive(Debug)]
   struct ForeignKeyCustomizer;
   impl r2d2::CustomizeConnection<rusqlite::Connection, rusqlite::Error> for ForeignKeyCustomizer {
       fn on_acquire(&self, conn: &mut rusqlite::Connection) -> Result<(), rusqlite::Error> {
           conn.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")?;
           Ok(())
       }
   }
   // Use: SqliteConnectionManager::file(path).with_init(...)
   ```

<!-- Red Team: Migration transaction+INSERT OR IGNORE — 2026-02-24 -->
2. Create `src-tauri/src/db/migrations.rs`:
   - `schema_version` table: `CREATE TABLE IF NOT EXISTS schema_version (version INTEGER)`
   - `run_migrations(conn: &Connection) -> Result<(), String>`
   - Migration runner pseudo-code:
     ```
     let current_version = SELECT version FROM schema_version LIMIT 1 (default 0 if empty)
     if current_version >= TARGET_VERSION: return Ok(())
     if current_version > CURRENT_APP_VERSION: return Err("DB version newer than app — upgrade required")
     BEGIN EXCLUSIVE TRANSACTION
       run V1 migration SQL
       INSERT OR IGNORE INTO app_settings (id) VALUES (1)
       UPDATE schema_version SET version = 1 (or INSERT if empty)
     COMMIT
     ```
   - Wrap entire V1 migration in `BEGIN EXCLUSIVE TRANSACTION / COMMIT`
   - V1 migration with all 10 tables:

```sql
-- projects
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  git_path TEXT NOT NULL,
  ccs_connected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- ccs_accounts
CREATE TABLE ccs_accounts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

-- decks
CREATE TABLE decks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  based_on_insight_id TEXT, -- soft reference, no FK (circular dep with key_insights)
  created_at TEXT NOT NULL
);

-- key_insights
CREATE TABLE key_insights (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- plans
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_path TEXT,
  plan_path TEXT,
  created_at TEXT NOT NULL
);

-- phases
CREATE TABLE phases (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'custom',
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  plan_id TEXT REFERENCES plans(id),
  phase_id TEXT REFERENCES phases(id),
  worktree_name TEXT
);

-- worktrees (files_changed omitted — computed at runtime via git2)
-- Red Team: files_changed drop from schema — 2026-02-24
CREATE TABLE worktrees (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  branch TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  merged_at TEXT,
  created_at TEXT NOT NULL
);

-- brainstorm_sessions
CREATE TABLE brainstorm_sessions (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  report_path TEXT,
  status TEXT NOT NULL DEFAULT 'idle',
  created_at TEXT NOT NULL
);

-- app_settings (single row)
-- Red Team: activeProjectId in DB only — 2026-02-24
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  language TEXT NOT NULL DEFAULT 'en',
  theme TEXT NOT NULL DEFAULT 'dark',
  auto_save INTEGER NOT NULL DEFAULT 1,
  font_size INTEGER NOT NULL DEFAULT 14,
  default_branch TEXT NOT NULL DEFAULT 'main',
  worktrees_dir TEXT NOT NULL DEFAULT '.worktrees',
  command_providers TEXT NOT NULL DEFAULT '{}',
  last_active_project_id TEXT
);

-- FK Indexes
-- Red Team: FK indexes — 2026-02-24
CREATE INDEX idx_ccs_accounts_project ON ccs_accounts(project_id);
CREATE INDEX idx_decks_project ON decks(project_id);
CREATE INDEX idx_tasks_deck ON tasks(deck_id);
CREATE INDEX idx_plans_deck ON plans(deck_id);
CREATE INDEX idx_phases_plan ON phases(plan_id);
CREATE INDEX idx_brainstorm_deck ON brainstorm_sessions(deck_id);

-- Seed default settings row (INSERT OR IGNORE — safe to re-run)
INSERT OR IGNORE INTO app_settings (id) VALUES (1);
```

3. Update `src-tauri/src/lib.rs`:
   - `use db::DbState;`
   - In `setup()`: resolve `app_data_dir`, call `db::init_db()`, `app.manage(db_state)`
   - **Do NOT set PRAGMA here** — handled per-connection via pool customizer (see step 1)

<!-- Red Team: Mutex→connection pool — 2026-02-24 -->
4. Add to `Cargo.toml`:
   ```toml
   uuid = { version = "1", features = ["v4"] }
   r2d2 = "0.8"
   r2d2_sqlite = "0.22"
   ```

## Todo
- [ ] Create `db/mod.rs` with `DbState` (r2d2 pool) and `init_db`
- [ ] Create `db/migrations.rs` with V1 schema (EXCLUSIVE TRANSACTION)
- [ ] Update `lib.rs` — DB init + managed state (no PRAGMA in lib.rs)
- [ ] Add `uuid`, `r2d2`, `r2d2_sqlite` to Cargo.toml
- [ ] Verify app launches with DB created

## Success Criteria
- App starts → creates `vividkit.db` in app data dir
- All 10 tables exist with correct schema
- `schema_version` tracks version = 1
- `app_settings` has default row (INSERT OR IGNORE is idempotent)
- WAL mode enabled, foreign keys ON per-connection via pool customizer
- Migration is idempotent (safe to re-run)
- DB version > app version → returns error instead of running migration
