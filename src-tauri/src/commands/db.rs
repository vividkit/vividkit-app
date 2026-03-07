use crate::db::DbState;
use tauri::State;

/// Check DB is initialized and return table count for health check
#[tauri::command]
pub fn check_db(db: State<'_, DbState>) -> Result<i64, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("check db: {e}"))?;
    Ok(count)
}
