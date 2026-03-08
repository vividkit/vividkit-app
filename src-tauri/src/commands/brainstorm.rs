use crate::db::DbState;
use crate::models::brainstorm::BrainstormSession;
use crate::models::key_insight::KeyInsight;
use tauri::State;

#[tauri::command]
pub fn create_brainstorm_session(
    db: State<'_, DbState>,
    deck_id: String,
    prompt: String,
) -> Result<BrainstormSession, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let now = chrono::Utc::now().to_rfc3339();
    let id = uuid::Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO brainstorm_sessions (id, deck_id, prompt, status, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'running', ?4, ?4)",
        rusqlite::params![id, deck_id, prompt, now],
    )
    .map_err(|e| format!("insert brainstorm session: {e}"))?;

    Ok(BrainstormSession {
        id,
        deck_id,
        prompt,
        report_path: None,
        session_log_path: None,
        status: crate::models::brainstorm::BrainstormStatus::Running,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_brainstorm_session(
    db: State<'_, DbState>,
    id: String,
    status: Option<String>,
    session_log_path: Option<String>,
    report_path: Option<String>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let now = chrono::Utc::now().to_rfc3339();

    // Build dynamic SET clause
    let mut sets = vec!["updated_at = ?1".to_string()];
    let mut param_idx = 2u32;
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = vec![Box::new(now)];

    if let Some(ref s) = status {
        sets.push(format!("status = ?{param_idx}"));
        params.push(Box::new(s.clone()));
        param_idx += 1;
    }
    if let Some(ref p) = session_log_path {
        sets.push(format!("session_log_path = ?{param_idx}"));
        params.push(Box::new(p.clone()));
        param_idx += 1;
    }
    if let Some(ref r) = report_path {
        sets.push(format!("report_path = ?{param_idx}"));
        params.push(Box::new(r.clone()));
        param_idx += 1;
    }

    // id is last param
    let sql = format!(
        "UPDATE brainstorm_sessions SET {} WHERE id = ?{param_idx}",
        sets.join(", ")
    );
    params.push(Box::new(id));

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    conn.execute(&sql, param_refs.as_slice())
        .map_err(|e| format!("update brainstorm session: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn list_brainstorm_sessions(
    db: State<'_, DbState>,
    deck_id: String,
) -> Result<Vec<BrainstormSession>, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let mut stmt = conn
        .prepare(
            "SELECT id, deck_id, prompt, report_path, session_log_path, status, created_at, updated_at
             FROM brainstorm_sessions WHERE deck_id = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| format!("prepare: {e}"))?;

    let rows = stmt
        .query_map([&deck_id], |row| {
            Ok(BrainstormSession {
                id: row.get(0)?,
                deck_id: row.get(1)?,
                prompt: row.get(2)?,
                report_path: row.get(3)?,
                session_log_path: row.get(4)?,
                status: parse_brainstorm_status(&row.get::<_, String>(5)?),
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| format!("query: {e}"))?;

    let mut sessions = Vec::new();
    for row in rows {
        sessions.push(row.map_err(|e| format!("row: {e}"))?);
    }
    Ok(sessions)
}

#[tauri::command]
pub fn get_brainstorm_session(
    db: State<'_, DbState>,
    id: String,
) -> Result<Option<BrainstormSession>, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let result = conn
        .query_row(
            "SELECT id, deck_id, prompt, report_path, session_log_path, status, created_at, updated_at
             FROM brainstorm_sessions WHERE id = ?1",
            [&id],
            |row| {
                Ok(BrainstormSession {
                    id: row.get(0)?,
                    deck_id: row.get(1)?,
                    prompt: row.get(2)?,
                    report_path: row.get(3)?,
                    session_log_path: row.get(4)?,
                    status: parse_brainstorm_status(&row.get::<_, String>(5)?),
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            },
        )
        .ok();
    Ok(result)
}

// --- Key Insights ---

#[tauri::command]
pub fn create_key_insight(
    db: State<'_, DbState>,
    project_id: String,
    deck_id: String,
    title: String,
    report_path: String,
) -> Result<KeyInsight, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let now = chrono::Utc::now().to_rfc3339();
    let id = uuid::Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO key_insights (id, project_id, deck_id, title, report_path, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![id, project_id, deck_id, title, report_path, now],
    )
    .map_err(|e| format!("insert key insight: {e}"))?;

    Ok(KeyInsight {
        id,
        project_id,
        deck_id,
        title,
        report_path,
        created_at: now,
    })
}

#[tauri::command]
pub fn list_key_insights(
    db: State<'_, DbState>,
    deck_id: String,
) -> Result<Vec<KeyInsight>, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, deck_id, title, report_path, created_at
             FROM key_insights WHERE deck_id = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| format!("prepare: {e}"))?;

    let rows = stmt
        .query_map([&deck_id], |row| {
            Ok(KeyInsight {
                id: row.get(0)?,
                project_id: row.get(1)?,
                deck_id: row.get(2)?,
                title: row.get(3)?,
                report_path: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| format!("query: {e}"))?;

    let mut insights = Vec::new();
    for row in rows {
        insights.push(row.map_err(|e| format!("row: {e}"))?);
    }
    Ok(insights)
}

#[tauri::command]
pub fn delete_key_insight(
    db: State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    conn.execute("DELETE FROM key_insights WHERE id = ?1", [&id])
        .map_err(|e| format!("delete key insight: {e}"))?;
    Ok(())
}

fn parse_brainstorm_status(s: &str) -> crate::models::brainstorm::BrainstormStatus {
    match s {
        "running" => crate::models::brainstorm::BrainstormStatus::Running,
        "completed" => crate::models::brainstorm::BrainstormStatus::Completed,
        _ => crate::models::brainstorm::BrainstormStatus::Idle,
    }
}
