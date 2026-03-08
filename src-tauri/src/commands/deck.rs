use crate::db::DbState;
use crate::models::deck::Deck;
use tauri::State;

fn row_to_deck(row: &rusqlite::Row<'_>) -> rusqlite::Result<Deck> {
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
}

#[tauri::command]
pub fn create_deck(
    db: State<'_, DbState>,
    project_id: String,
    name: String,
    description: Option<String>,
    based_on_insight_id: Option<String>,
    set_active: bool,
) -> Result<Deck, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let now = chrono::Utc::now().to_rfc3339();
    let deck_id = uuid::Uuid::new_v4().to_string();

    if set_active {
        conn.execute(
            "UPDATE decks SET is_active=0, updated_at=?1 WHERE project_id=?2",
            rusqlite::params![now, project_id],
        )
        .map_err(|e| format!("deactivate decks: {e}"))?;
    }

    let is_active = if set_active { 1i64 } else { 0i64 };
    conn.execute(
        "INSERT INTO decks (id, project_id, name, description, is_active, based_on_insight_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)",
        rusqlite::params![deck_id, project_id, name, description, is_active, based_on_insight_id, now],
    )
    .map_err(|e| format!("insert deck: {e}"))?;

    conn.query_row(
        "SELECT id, project_id, name, description, is_active, based_on_insight_id, created_at, updated_at
         FROM decks WHERE id=?1",
        rusqlite::params![deck_id],
        row_to_deck,
    )
    .map_err(|e| format!("fetch deck: {e}"))
}

#[tauri::command]
pub fn set_active_deck(
    db: State<'_, DbState>,
    project_id: String,
    deck_id: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE decks SET is_active=0, updated_at=?1 WHERE project_id=?2",
        rusqlite::params![now, project_id],
    )
    .map_err(|e| format!("deactivate decks: {e}"))?;

    conn.execute(
        "UPDATE decks SET is_active=1, updated_at=?1 WHERE id=?2",
        rusqlite::params![now, deck_id],
    )
    .map_err(|e| format!("activate deck: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn delete_deck(
    db: State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;

    // Get project_id and is_active for this deck
    let (project_id, is_active): (String, bool) = conn
        .query_row(
            "SELECT project_id, is_active FROM decks WHERE id=?1",
            rusqlite::params![id],
            |row| Ok((row.get(0)?, row.get::<_, i64>(1)? != 0)),
        )
        .map_err(|e| format!("find deck: {e}"))?;

    // Prevent deleting the last deck
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM decks WHERE project_id=?1",
            rusqlite::params![project_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("count decks: {e}"))?;

    if count <= 1 {
        return Err("Cannot delete the last deck".to_string());
    }

    conn.execute("DELETE FROM decks WHERE id=?1", rusqlite::params![id])
        .map_err(|e| format!("delete deck: {e}"))?;

    // If we deleted the active deck, activate the most recent remaining deck
    if is_active {
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE decks SET is_active=1, updated_at=?1
             WHERE project_id=?2 ORDER BY created_at ASC LIMIT 1",
            rusqlite::params![now, project_id],
        )
        .map_err(|e| format!("activate fallback deck: {e}"))?;
    }

    Ok(())
}
