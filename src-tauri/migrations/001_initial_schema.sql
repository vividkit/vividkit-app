-- VividKit MVP v0.1 — Initial Schema
-- 10 tables: projects, ccs_accounts, decks, key_insights, plans, phases, tasks, worktrees, brainstorm_sessions, cook_sessions

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    git_path TEXT NOT NULL,
    ccs_connected INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ccs_accounts (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    provider TEXT NOT NULL,
    name TEXT NOT NULL UNIQUE,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    config_path TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS decks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 0,
    based_on_insight_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS key_insights (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    deck_id TEXT NOT NULL,
    title TEXT NOT NULL,
    report_path TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    name TEXT NOT NULL,
    report_path TEXT,
    plan_path TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS phases (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    task_type TEXT NOT NULL DEFAULT 'custom',
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'backlog',
    priority TEXT NOT NULL DEFAULT 'medium',
    plan_id TEXT,
    phase_id TEXT,
    worktree_id TEXT,
    cook_session_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL,
    FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS worktrees (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    task_id TEXT,
    branch TEXT NOT NULL,
    path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    files_changed INTEGER NOT NULL DEFAULT 0,
    merged_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS brainstorm_sessions (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    report_path TEXT,
    session_log_path TEXT,
    status TEXT NOT NULL DEFAULT 'idle',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cook_sessions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    worktree_id TEXT,
    ccs_profile TEXT NOT NULL,
    session_log_path TEXT,
    status TEXT NOT NULL DEFAULT 'idle',
    started_at TEXT,
    finished_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (worktree_id) REFERENCES worktrees(id) ON DELETE SET NULL
);

-- Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_ccs_accounts_project ON ccs_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_decks_project ON decks(project_id);
CREATE INDEX IF NOT EXISTS idx_key_insights_deck ON key_insights(deck_id);
CREATE INDEX IF NOT EXISTS idx_plans_deck ON plans(deck_id);
CREATE INDEX IF NOT EXISTS idx_phases_plan ON phases(plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deck ON tasks(deck_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_worktrees_project ON worktrees(project_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_deck ON brainstorm_sessions(deck_id);
CREATE INDEX IF NOT EXISTS idx_cook_sessions_task ON cook_sessions(task_id);
