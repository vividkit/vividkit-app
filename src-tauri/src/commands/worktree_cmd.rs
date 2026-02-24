use rusqlite::{params, Connection, OptionalExtension};
use tauri::State;
use uuid::Uuid;

use crate::db::DbState;
use crate::models::worktree::{to_worktree, Worktree, WorktreeStatus};

fn now_iso8601(conn: &Connection) -> Result<String, String> {
    conn.query_row("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')", [], |row| {
        row.get(0)
    })
    .map_err(|e| e.to_string())
}

fn fetch_worktree(conn: &Connection, id: &str) -> Result<Worktree, String> {
    let row = conn
        .query_row(
            "SELECT id, project_id, task_id, branch, status, merged_at, created_at
             FROM worktrees WHERE id = ?1",
            [id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                    row.get(6)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;

    let row = row.ok_or_else(|| format!("Worktree record not found: {id}"))?;
    to_worktree(row)
}

#[tauri::command]
pub fn create_worktree_record(
    db: State<'_, DbState>,
    project_id: String,
    task_id: String,
    branch: String,
) -> Result<Worktree, String> {
    let conn = db.get_conn()?;
    let id = Uuid::new_v4().to_string();
    let created_at = now_iso8601(&conn)?;

    conn.execute(
        "INSERT INTO worktrees (id, project_id, task_id, branch, status, merged_at, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, NULL, ?6)",
        params![
            id,
            project_id,
            task_id,
            branch,
            WorktreeStatus::Active.as_db_str(),
            created_at,
        ],
    )
    .map_err(|e| e.to_string())?;

    fetch_worktree(&conn, &id)
}

#[tauri::command]
pub fn list_worktree_records(
    db: State<'_, DbState>,
    project_id: String,
) -> Result<Vec<Worktree>, String> {
    let conn = db.get_conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, task_id, branch, status, merged_at, created_at
             FROM worktrees WHERE project_id = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([project_id], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
                row.get(6)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    rows.map(|row| row.map_err(|e| e.to_string()).and_then(to_worktree))
        .collect::<Result<Vec<_>, _>>()
}

#[tauri::command]
pub fn update_worktree_record(
    db: State<'_, DbState>,
    id: String,
    status: Option<WorktreeStatus>,
    merged_at: Option<String>,
) -> Result<Worktree, String> {
    let conn = db.get_conn()?;
    let current = fetch_worktree(&conn, &id)?;

    conn.execute(
        "UPDATE worktrees SET status = ?1, merged_at = ?2 WHERE id = ?3",
        params![
            status.unwrap_or(current.status).as_db_str(),
            merged_at.or(current.merged_at),
            &id,
        ],
    )
    .map_err(|e| e.to_string())?;

    fetch_worktree(&conn, &id)
}

#[tauri::command]
pub fn delete_worktree_record(db: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = db.get_conn()?;
    let deleted = conn
        .execute("DELETE FROM worktrees WHERE id = ?1", [id.clone()])
        .map_err(|e| e.to_string())?;

    if deleted == 0 {
        return Err(format!("Worktree record not found: {id}"));
    }

    Ok(())
}
