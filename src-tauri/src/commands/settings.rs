use std::collections::HashMap;

use rusqlite::params;
use tauri::State;

use crate::{db::DbState, models::settings::AppSettings};

fn parse_command_providers(raw: String) -> Result<HashMap<String, String>, String> {
    serde_json::from_str(&raw)
        .map_err(|e| format!("Invalid app_settings.command_providers JSON: {e}"))
}

fn load_settings(conn: &rusqlite::Connection) -> Result<AppSettings, String> {
    conn.query_row(
        "SELECT language, theme, auto_save, font_size, default_branch, worktrees_dir, command_providers, last_active_project_id FROM app_settings WHERE id = 1",
        [],
        |row| {
            let auto_save: i64 = row.get(2)?;
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                auto_save != 0,
                row.get::<_, i64>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
                row.get::<_, Option<String>>(7)?,
            ))
        },
    )
    .map_err(|e| e.to_string())
    .and_then(|tuple| {
        Ok(AppSettings {
            language: tuple.0,
            theme: tuple.1,
            auto_save: tuple.2,
            font_size: tuple.3,
            default_branch: tuple.4,
            worktrees_dir: tuple.5,
            command_providers: parse_command_providers(tuple.6)?,
            last_active_project_id: tuple.7,
        })
    })
}

#[tauri::command]
pub fn get_settings(state: State<'_, DbState>) -> Result<AppSettings, String> {
    let conn = state.get_conn()?;
    load_settings(&conn)
}

#[tauri::command]
pub fn update_settings(
    state: State<'_, DbState>,
    settings: AppSettings,
) -> Result<AppSettings, String> {
    let conn = state.get_conn()?;
    let command_providers_json =
        serde_json::to_string(&settings.command_providers).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE app_settings
         SET language = ?1,
             theme = ?2,
             auto_save = ?3,
             font_size = ?4,
             default_branch = ?5,
             worktrees_dir = ?6,
             command_providers = ?7,
             last_active_project_id = ?8
         WHERE id = 1",
        params![
            settings.language,
            settings.theme,
            if settings.auto_save { 1_i64 } else { 0_i64 },
            settings.font_size,
            settings.default_branch,
            settings.worktrees_dir,
            command_providers_json,
            settings.last_active_project_id,
        ],
    )
    .map_err(|e| e.to_string())?;

    load_settings(&conn)
}
