use crate::db::DbState;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub language: String,
    pub theme: String,
    pub auto_save: bool,
    pub font_size: i64,
    pub default_branch: String,
    pub worktrees_dir: String,
    pub command_providers: HashMap<String, String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "vi".to_string(),
            theme: "light".to_string(),
            auto_save: true,
            font_size: 14,
            default_branch: "main".to_string(),
            worktrees_dir: ".worktrees".to_string(),
            command_providers: HashMap::new(),
        }
    }
}

#[tauri::command]
pub fn get_settings(db: State<'_, DbState>) -> Result<AppSettings, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;

    let json: Option<String> = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = 'app'",
            [],
            |r| r.get(0),
        )
        .ok();

    match json {
        Some(j) => serde_json::from_str(&j).map_err(|e| format!("parse settings: {e}")),
        None => Ok(AppSettings::default()),
    }
}

#[tauri::command]
pub fn update_settings(
    db: State<'_, DbState>,
    settings: AppSettings,
) -> Result<AppSettings, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );",
    )
    .map_err(|e| format!("create settings table: {e}"))?;

    let json = serde_json::to_string(&settings).map_err(|e| format!("serialize: {e}"))?;

    conn.execute(
        "INSERT INTO app_settings (key, value) VALUES ('app', ?1)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [&json],
    )
    .map_err(|e| format!("upsert settings: {e}"))?;

    Ok(settings)
}
