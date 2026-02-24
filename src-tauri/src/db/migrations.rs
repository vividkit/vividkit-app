use rusqlite::{Connection, OptionalExtension};

const TARGET_SCHEMA_VERSION: i64 = 1;

const V1_SCHEMA_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  git_path TEXT NOT NULL,
  ccs_connected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ccs_accounts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS decks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  based_on_insight_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS key_insights (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_path TEXT,
  plan_path TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phases (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS tasks (
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

CREATE TABLE IF NOT EXISTS worktrees (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  branch TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  merged_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS brainstorm_sessions (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  report_path TEXT,
  status TEXT NOT NULL DEFAULT 'idle',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
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

CREATE INDEX IF NOT EXISTS idx_ccs_accounts_project ON ccs_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_decks_project ON decks(project_id);
CREATE INDEX IF NOT EXISTS idx_key_insights_project ON key_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_key_insights_deck ON key_insights(deck_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deck ON tasks(deck_id);
CREATE INDEX IF NOT EXISTS idx_tasks_plan ON tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_plans_deck ON plans(deck_id);
CREATE INDEX IF NOT EXISTS idx_phases_plan ON phases(plan_id);
CREATE INDEX IF NOT EXISTS idx_worktrees_project ON worktrees(project_id);
CREATE INDEX IF NOT EXISTS idx_worktrees_task ON worktrees(task_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_deck ON brainstorm_sessions(deck_id);

INSERT OR IGNORE INTO app_settings (id) VALUES (1);
"#;

pub fn run_migrations(conn: &Connection) -> Result<(), String> {
    ensure_schema_version_table(conn)?;

    let current_version = current_schema_version(conn)?;
    if current_version > TARGET_SCHEMA_VERSION {
        return Err(format!(
            "Database schema version {current_version} is newer than app supported version {TARGET_SCHEMA_VERSION}."
        ));
    }

    if current_version >= TARGET_SCHEMA_VERSION {
        return Ok(());
    }

    conn.execute_batch("BEGIN EXCLUSIVE TRANSACTION;")
        .map_err(|e| e.to_string())?;

    if let Err(error) = apply_v1(conn).and_then(|_| set_schema_version(conn, TARGET_SCHEMA_VERSION)) {
        let _ = conn.execute_batch("ROLLBACK;");
        return Err(error);
    }

    conn.execute_batch("COMMIT;").map_err(|e| {
        let _ = conn.execute_batch("ROLLBACK;");
        e.to_string()
    })
}

fn ensure_schema_version_table(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_version (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            version INTEGER NOT NULL
        );",
    )
    .map_err(|e| e.to_string())
}

fn current_schema_version(conn: &Connection) -> Result<i64, String> {
    conn.query_row("SELECT version FROM schema_version WHERE id = 1", [], |row| {
        row.get(0)
    })
    .optional()
    .map_err(|e| e.to_string())
    .map(|version| version.unwrap_or(0))
}

fn set_schema_version(conn: &Connection, version: i64) -> Result<(), String> {
    conn.execute(
        "INSERT INTO schema_version (id, version) VALUES (1, ?1)
         ON CONFLICT(id) DO UPDATE SET version = excluded.version",
        [version],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

fn apply_v1(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(V1_SCHEMA_SQL).map_err(|e| e.to_string())
}
