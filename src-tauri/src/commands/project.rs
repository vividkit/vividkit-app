use std::{collections::HashMap, path::PathBuf};

use git2::Repository;
use rusqlite::{params, OptionalExtension};
use tauri::State;
use uuid::Uuid;

use crate::{
    db::DbState,
    models::project::{CcsAccount, CcsAccountStatus, Project},
};

fn now_iso8601(conn: &rusqlite::Connection) -> Result<String, String> {
    conn.query_row("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')", [], |row| {
        row.get(0)
    })
    .map_err(|e| e.to_string())
}

fn canonical_git_repo_path(git_path: &str) -> Result<String, String> {
    let canonical = std::fs::canonicalize(PathBuf::from(git_path))
        .map_err(|e| format!("Invalid git_path: {e}"))?;
    Repository::open(&canonical).map_err(|e| format!("git_path is not a git repository: {e}"))?;
    canonical
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "git_path contains invalid UTF-8".to_string())
}

fn load_accounts(
    conn: &rusqlite::Connection,
    project_filter: Option<&str>,
) -> Result<Vec<CcsAccount>, String> {
    let mut accounts = Vec::new();
    let sql = if project_filter.is_some() {
        "SELECT id, project_id, provider, email, status FROM ccs_accounts WHERE project_id = ?1"
    } else {
        "SELECT id, project_id, provider, email, status FROM ccs_accounts"
    };
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let mut rows = if let Some(project_id) = project_filter {
        stmt.query(params![project_id]).map_err(|e| e.to_string())?
    } else {
        stmt.query([]).map_err(|e| e.to_string())?
    };

    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let status_raw: String = row.get(4).map_err(|e| e.to_string())?;
        accounts.push(CcsAccount {
            id: row.get(0).map_err(|e| e.to_string())?,
            project_id: row.get(1).map_err(|e| e.to_string())?,
            provider: row.get(2).map_err(|e| e.to_string())?,
            email: row.get(3).map_err(|e| e.to_string())?,
            status: CcsAccountStatus::from_db(&status_raw)?,
        });
    }

    Ok(accounts)
}

fn load_project(conn: &rusqlite::Connection, id: &str) -> Result<Project, String> {
    let project = conn
        .query_row(
            "SELECT id, name, description, git_path, ccs_connected, created_at FROM projects WHERE id = ?1",
            params![id],
            |row| {
                let ccs_connected: i64 = row.get(4)?;
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, String>(3)?,
                    ccs_connected != 0,
                    row.get::<_, String>(5)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Project not found: {id}"))?;

    Ok(Project {
        id: project.0,
        name: project.1,
        description: project.2,
        git_path: project.3,
        ccs_connected: project.4,
        ccs_accounts: load_accounts(conn, Some(id))?,
        created_at: project.5,
    })
}

#[tauri::command]
pub fn create_project(
    state: State<'_, DbState>,
    name: String,
    description: Option<String>,
    git_path: String,
) -> Result<Project, String> {
    let conn = state.get_conn()?;
    let project_id = Uuid::new_v4().to_string();
    let created_at = now_iso8601(&conn)?;
    let canonical_path = canonical_git_repo_path(&git_path)?;

    conn.execute(
        "INSERT INTO projects (id, name, description, git_path, ccs_connected, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![project_id, name, description, canonical_path, 0_i64, created_at],
    )
    .map_err(|e| e.to_string())?;

    load_project(&conn, &project_id)
}

#[tauri::command]
pub fn list_projects(state: State<'_, DbState>) -> Result<Vec<Project>, String> {
    let conn = state.get_conn()?;
    let mut projects = Vec::new();

    let mut stmt = conn
        .prepare("SELECT id, name, description, git_path, ccs_connected, created_at FROM projects ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let ccs_connected: i64 = row.get(4).map_err(|e| e.to_string())?;
        projects.push(Project {
            id: row.get(0).map_err(|e| e.to_string())?,
            name: row.get(1).map_err(|e| e.to_string())?,
            description: row.get(2).map_err(|e| e.to_string())?,
            git_path: row.get(3).map_err(|e| e.to_string())?,
            ccs_connected: ccs_connected != 0,
            ccs_accounts: Vec::new(),
            created_at: row.get(5).map_err(|e| e.to_string())?,
        });
    }

    let mut grouped_accounts: HashMap<String, Vec<CcsAccount>> = HashMap::new();
    for account in load_accounts(&conn, None)? {
        grouped_accounts
            .entry(account.project_id.clone())
            .or_default()
            .push(account);
    }

    for project in &mut projects {
        project.ccs_accounts = grouped_accounts.remove(&project.id).unwrap_or_default();
    }

    Ok(projects)
}

#[tauri::command]
pub fn get_project(state: State<'_, DbState>, id: String) -> Result<Project, String> {
    let conn = state.get_conn()?;
    load_project(&conn, &id)
}

#[tauri::command]
pub fn update_project(
    state: State<'_, DbState>,
    id: String,
    name: Option<String>,
    description: Option<String>,
) -> Result<Project, String> {
    let conn = state.get_conn()?;
    let current = load_project(&conn, &id)?;
    let next_name = name.unwrap_or(current.name);
    let next_description = description.or(current.description);

    conn.execute(
        "UPDATE projects SET name = ?1, description = ?2 WHERE id = ?3",
        params![next_name, next_description, id],
    )
    .map_err(|e| e.to_string())?;

    load_project(&conn, &id)
}

#[tauri::command]
pub fn delete_project(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = state.get_conn()?;
    let affected = conn
        .execute("DELETE FROM projects WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err("Project not found".to_string());
    }
    Ok(())
}
