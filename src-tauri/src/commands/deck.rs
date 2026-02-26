use rusqlite::{params, OptionalExtension};
use tauri::State;
use uuid::Uuid;

use crate::{db::DbState, models::deck::Deck};

fn now_iso8601(conn: &rusqlite::Connection) -> Result<String, String> {
    conn.query_row("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')", [], |row| {
        row.get(0)
    })
    .map_err(|e| e.to_string())
}

fn load_deck(conn: &rusqlite::Connection, id: &str) -> Result<Deck, String> {
    conn.query_row(
        "SELECT id, project_id, name, description, is_active, based_on_insight_id, created_at FROM decks WHERE id = ?1",
        params![id],
        |row| {
            let is_active: i64 = row.get(4)?;
            Ok(Deck {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                is_active: is_active != 0,
                based_on_insight_id: row.get(5)?,
                created_at: row.get(6)?,
            })
        },
    )
    .optional()
    .map_err(|e| e.to_string())?
    .ok_or_else(|| format!("Deck not found: {id}"))
}

#[tauri::command]
pub fn create_deck(
    state: State<'_, DbState>,
    project_id: String,
    name: String,
    description: Option<String>,
    based_on_insight_id: Option<String>,
) -> Result<Deck, String> {
    let conn = state.get_conn()?;
    let id = Uuid::new_v4().to_string();
    let created_at = now_iso8601(&conn)?;
    conn.execute(
        "INSERT INTO decks (id, project_id, name, description, is_active, based_on_insight_id, created_at) VALUES (?1, ?2, ?3, ?4, 0, ?5, ?6)",
        params![id, project_id, name, description, based_on_insight_id, created_at],
    )
    .map_err(|e| e.to_string())?;
    load_deck(&conn, &id)
}

#[tauri::command]
pub fn list_decks(state: State<'_, DbState>, project_id: String) -> Result<Vec<Deck>, String> {
    let conn = state.get_conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, name, description, is_active, based_on_insight_id, created_at FROM decks WHERE project_id = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![project_id]).map_err(|e| e.to_string())?;
    let mut decks = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let is_active: i64 = row.get(4).map_err(|e| e.to_string())?;
        decks.push(Deck {
            id: row.get(0).map_err(|e| e.to_string())?,
            project_id: row.get(1).map_err(|e| e.to_string())?,
            name: row.get(2).map_err(|e| e.to_string())?,
            description: row.get(3).map_err(|e| e.to_string())?,
            is_active: is_active != 0,
            based_on_insight_id: row.get(5).map_err(|e| e.to_string())?,
            created_at: row.get(6).map_err(|e| e.to_string())?,
        });
    }
    Ok(decks)
}

#[tauri::command]
pub fn set_active_deck(state: State<'_, DbState>, id: String) -> Result<Deck, String> {
    let conn = state.get_conn()?;
    conn.execute_batch("BEGIN IMMEDIATE TRANSACTION;")
        .map_err(|e| e.to_string())?;

    let result = (|| {
        let exists = conn
            .query_row(
                "SELECT project_id FROM decks WHERE id = ?1",
                params![&id],
                |row| row.get::<_, String>(0),
            )
            .optional()
            .map_err(|e| e.to_string())?;
        if exists.is_none() {
            return Err(format!("Deck not found: {id}"));
        }

        conn.execute(
            "UPDATE decks SET is_active = 0 WHERE project_id = (SELECT project_id FROM decks WHERE id = ?1)",
            params![&id],
        )
        .map_err(|e| e.to_string())?;
        conn.execute("UPDATE decks SET is_active = 1 WHERE id = ?1", params![&id])
            .map_err(|e| e.to_string())?;
        load_deck(&conn, &id)
    })();

    match result {
        Ok(deck) => {
            conn.execute_batch("COMMIT;").map_err(|e| e.to_string())?;
            Ok(deck)
        }
        Err(error) => {
            let _ = conn.execute_batch("ROLLBACK;");
            Err(error)
        }
    }
}

#[tauri::command]
pub fn update_deck(
    state: State<'_, DbState>,
    id: String,
    name: Option<String>,
    description: Option<String>,
) -> Result<Deck, String> {
    let conn = state.get_conn()?;
    let current = load_deck(&conn, &id)?;
    conn.execute(
        "UPDATE decks SET name = ?1, description = ?2 WHERE id = ?3",
        params![
            name.unwrap_or(current.name),
            description.or(current.description),
            &id
        ],
    )
    .map_err(|e| e.to_string())?;
    load_deck(&conn, &id)
}

#[tauri::command]
pub fn delete_deck(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = state.get_conn()?;
    let affected = conn
        .execute("DELETE FROM decks WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err("Deck not found".to_string());
    }
    Ok(())
}
