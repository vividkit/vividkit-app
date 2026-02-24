use rusqlite::{params, Connection, OptionalExtension};
use tauri::State;
use uuid::Uuid;

use crate::db::DbState;
use crate::models::brainstorm::{
    to_insight, to_session, BrainstormSession, BrainstormStatus, KeyInsight,
};

fn now_iso8601(conn: &Connection) -> Result<String, String> {
    conn.query_row("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')", [], |row| {
        row.get(0)
    })
    .map_err(|e| e.to_string())
}

fn fetch_session(conn: &Connection, id: &str) -> Result<BrainstormSession, String> {
    let row = conn
        .query_row(
            "SELECT id, deck_id, prompt, report_path, status, created_at
             FROM brainstorm_sessions WHERE id = ?1",
            [id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;

    let row = row.ok_or_else(|| format!("Brainstorm session not found: {id}"))?;
    to_session(row)
}

#[tauri::command]
pub fn create_brainstorm_session(
    db: State<'_, DbState>,
    deck_id: String,
    prompt: String,
) -> Result<BrainstormSession, String> {
    let conn = db.get_conn()?;
    let id = Uuid::new_v4().to_string();
    let created_at = now_iso8601(&conn)?;

    conn.execute(
        "INSERT INTO brainstorm_sessions (id, deck_id, prompt, report_path, status, created_at)
         VALUES (?1, ?2, ?3, NULL, ?4, ?5)",
        params![
            id,
            deck_id,
            prompt,
            BrainstormStatus::Idle.as_db_str(),
            created_at,
        ],
    )
    .map_err(|e| e.to_string())?;

    fetch_session(&conn, &id)
}

#[tauri::command]
pub fn list_brainstorm_sessions(
    db: State<'_, DbState>,
    deck_id: String,
) -> Result<Vec<BrainstormSession>, String> {
    let conn = db.get_conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, deck_id, prompt, report_path, status, created_at
             FROM brainstorm_sessions WHERE deck_id = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([deck_id], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    rows.map(|row| row.map_err(|e| e.to_string()).and_then(to_session))
        .collect::<Result<Vec<_>, _>>()
}

#[tauri::command]
pub fn update_brainstorm_session(
    db: State<'_, DbState>,
    id: String,
    status: Option<BrainstormStatus>,
    report_path: Option<String>,
) -> Result<BrainstormSession, String> {
    let conn = db.get_conn()?;
    let current = fetch_session(&conn, &id)?;

    conn.execute(
        "UPDATE brainstorm_sessions SET status = ?1, report_path = ?2 WHERE id = ?3",
        params![
            status.unwrap_or(current.status).as_db_str(),
            report_path.or(current.report_path),
            &id,
        ],
    )
    .map_err(|e| e.to_string())?;

    fetch_session(&conn, &id)
}

#[tauri::command]
pub fn create_key_insight(
    db: State<'_, DbState>,
    project_id: String,
    deck_id: String,
    title: String,
    report_path: String,
) -> Result<KeyInsight, String> {
    let conn = db.get_conn()?;
    let id = Uuid::new_v4().to_string();
    let created_at = now_iso8601(&conn)?;

    conn.execute(
        "INSERT INTO key_insights (id, project_id, deck_id, title, report_path, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, project_id, deck_id, title, report_path, created_at],
    )
    .map_err(|e| e.to_string())?;

    Ok(to_insight((
        id,
        project_id,
        deck_id,
        title,
        report_path,
        created_at,
    )))
}

#[tauri::command]
pub fn list_key_insights(
    db: State<'_, DbState>,
    deck_id: String,
) -> Result<Vec<KeyInsight>, String> {
    let conn = db.get_conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, deck_id, title, report_path, created_at
             FROM key_insights WHERE deck_id = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([deck_id], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    rows.map(|row| row.map(to_insight).map_err(|e| e.to_string()))
        .collect::<Result<Vec<_>, _>>()
}

#[tauri::command]
pub fn delete_key_insight(db: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = db.get_conn()?;
    let deleted = conn
        .execute("DELETE FROM key_insights WHERE id = ?1", [id.clone()])
        .map_err(|e| e.to_string())?;

    if deleted == 0 {
        return Err(format!("Key insight not found: {id}"));
    }

    Ok(())
}
