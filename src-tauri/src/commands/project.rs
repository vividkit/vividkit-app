use crate::db::DbState;
use crate::models::deck::Deck;
use crate::models::project::Project;
use tauri::State;

#[tauri::command]
pub fn create_project(
    db: State<'_, DbState>,
    name: String,
    description: Option<String>,
    git_path: String,
) -> Result<Project, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let now = chrono::Utc::now().to_rfc3339();
    let project_id = uuid::Uuid::new_v4().to_string();
    let deck_id = uuid::Uuid::new_v4().to_string();

    // Transaction: project + default deck must succeed together
    let tx = conn.unchecked_transaction().map_err(|e| format!("begin tx: {e}"))?;

    tx.execute(
        "INSERT INTO projects (id, name, description, git_path, ccs_connected, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, 0, ?5, ?5)",
        rusqlite::params![project_id, name, description, git_path, now],
    )
    .map_err(|e| format!("insert project: {e}"))?;

    tx.execute(
        "INSERT INTO decks (id, project_id, name, is_active, created_at, updated_at)
         VALUES (?1, ?2, 'Main', 1, ?3, ?3)",
        rusqlite::params![deck_id, project_id, now],
    )
    .map_err(|e| format!("insert default deck: {e}"))?;

    tx.commit().map_err(|e| format!("commit: {e}"))?;

    Ok(Project {
        id: project_id,
        name,
        description,
        git_path,
        ccs_connected: false,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn list_projects(db: State<'_, DbState>) -> Result<Vec<Project>, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, description, git_path, ccs_connected, created_at, updated_at
             FROM projects ORDER BY created_at DESC",
        )
        .map_err(|e| format!("prepare: {e}"))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                git_path: row.get(3)?,
                ccs_connected: row.get::<_, i64>(4)? != 0,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| format!("query: {e}"))?;

    let mut projects = Vec::new();
    for row in rows {
        projects.push(row.map_err(|e| format!("row: {e}"))?);
    }
    Ok(projects)
}

#[tauri::command]
pub fn get_active_project(db: State<'_, DbState>) -> Result<Option<Project>, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    // For v0.1: most recently created project is active
    let result = conn
        .query_row(
            "SELECT id, name, description, git_path, ccs_connected, created_at, updated_at
             FROM projects ORDER BY created_at DESC LIMIT 1",
            [],
            |row| {
                Ok(Project {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    git_path: row.get(3)?,
                    ccs_connected: row.get::<_, i64>(4)? != 0,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
        .ok();
    Ok(result)
}

#[tauri::command]
pub fn set_active_project(
    _db: State<'_, DbState>,
    _id: String,
) -> Result<(), String> {
    // For v0.1: no-op since we use first project as active
    // Will add active_project_id to a config table in v0.2
    Ok(())
}

#[tauri::command]
pub fn validate_git_repo(path: String) -> Result<bool, String> {
    let repo_path = std::path::PathBuf::from(&path);
    if !repo_path.exists() {
        return Ok(false);
    }
    match git2::Repository::open(&repo_path) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Initialize a new git repository at the given path
#[tauri::command]
pub fn init_git_repo(path: String) -> Result<bool, String> {
    let repo_path = std::path::PathBuf::from(&path);
    if !repo_path.exists() {
        return Err("Path does not exist".to_string());
    }
    git2::Repository::init(&repo_path)
        .map(|_| true)
        .map_err(|e| format!("git init: {e}"))
}

/// Get decks for a project
#[tauri::command]
pub fn list_decks(
    db: State<'_, DbState>,
    project_id: String,
) -> Result<Vec<Deck>, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, name, description, is_active, based_on_insight_id, created_at, updated_at
             FROM decks WHERE project_id = ?1 ORDER BY created_at ASC",
        )
        .map_err(|e| format!("prepare: {e}"))?;

    let rows = stmt
        .query_map([&project_id], |row| {
            Ok(Deck {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                is_active: row.get::<_, i64>(4)? != 0,
                based_on_insight_id: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| format!("query: {e}"))?;

    let mut decks = Vec::new();
    for row in rows {
        decks.push(row.map_err(|e| format!("row: {e}"))?);
    }
    Ok(decks)
}
