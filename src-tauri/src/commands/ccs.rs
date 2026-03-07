use crate::db::DbState;
use crate::models::ccs_account::{AccountStatus, CcsAccount};
use serde::Deserialize;
use std::collections::HashMap;
use tauri::State;

/// Parsed CCS config.yaml structure
#[derive(Deserialize, Default)]
struct CcsConfig {
    #[serde(default)]
    profiles: HashMap<String, CcsProfileEntry>,
}

#[derive(Deserialize)]
struct CcsProfileEntry {
    provider: Option<String>,
    email: Option<String>,
}

/// Discover CCS profiles from ~/.ccs/config.yaml + ~/.ccs/instances/*/settings.json
#[tauri::command]
pub fn discover_ccs_profiles(db: State<'_, DbState>) -> Result<Vec<CcsAccount>, String> {
    let ccs_dir = dirs::home_dir()
        .ok_or_else(|| "cannot resolve home dir".to_string())?
        .join(".ccs");

    let mut accounts: Vec<CcsAccount> = Vec::new();
    let now = chrono::Utc::now().to_rfc3339();

    // 1. Parse config.yaml if exists
    let config_path = ccs_dir.join("config.yaml");
    if config_path.exists() {
        let content =
            std::fs::read_to_string(&config_path).map_err(|e| format!("read config.yaml: {e}"))?;
        if let Ok(config) = serde_yaml::from_str::<CcsConfig>(&content) {
            for (name, entry) in config.profiles {
                accounts.push(CcsAccount {
                    id: uuid::Uuid::new_v4().to_string(),
                    project_id: None,
                    provider: entry.provider.unwrap_or_else(|| "unknown".to_string()),
                    name: name.clone(),
                    email: entry.email,
                    status: AccountStatus::Active,
                    config_path: Some(config_path.to_string_lossy().to_string()),
                    created_at: now.clone(),
                    updated_at: now.clone(),
                });
            }
        }
    }

    // 2. Scan instances directories
    let instances_dir = ccs_dir.join("instances");
    if instances_dir.exists() {
        if let Ok(entries) = std::fs::read_dir(&instances_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_dir() {
                    continue;
                }
                let instance_name = path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                // Skip if already found via config.yaml
                if accounts.iter().any(|a| a.name == instance_name) {
                    continue;
                }

                let settings_path = path.join("settings.json");
                if settings_path.exists() {
                    accounts.push(CcsAccount {
                        id: uuid::Uuid::new_v4().to_string(),
                        project_id: None,
                        provider: instance_name.clone(),
                        name: instance_name,
                        email: None,
                        status: AccountStatus::Active,
                        config_path: Some(settings_path.to_string_lossy().to_string()),
                        created_at: now.clone(),
                        updated_at: now.clone(),
                    });
                }
            }
        }
    }

    // 3. Upsert discovered accounts to DB by name
    save_accounts_to_db(&db, &accounts)?;

    Ok(accounts)
}

/// Get all CCS accounts from DB
#[tauri::command]
pub fn get_ccs_accounts(db: State<'_, DbState>) -> Result<Vec<CcsAccount>, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, provider, name, email, status, config_path, created_at, updated_at
             FROM ccs_accounts",
        )
        .map_err(|e| format!("prepare: {e}"))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(CcsAccount {
                id: row.get(0)?,
                project_id: row.get(1)?,
                provider: row.get(2)?,
                name: row.get(3)?,
                email: row.get(4)?,
                status: parse_account_status(&row.get::<_, String>(5)?),
                config_path: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|e| format!("query: {e}"))?;

    let mut accounts = Vec::new();
    for row in rows {
        accounts.push(row.map_err(|e| format!("row: {e}"))?);
    }
    Ok(accounts)
}

/// Upsert by name — update provider/email/config_path if account already exists
fn save_accounts_to_db(db: &State<'_, DbState>, accounts: &[CcsAccount]) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    for account in accounts {
        conn.execute(
            "INSERT INTO ccs_accounts (id, project_id, provider, name, email, status, config_path, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(name) DO UPDATE SET
               provider = excluded.provider,
               email = excluded.email,
               config_path = excluded.config_path,
               updated_at = excluded.updated_at",
            rusqlite::params![
                account.id,
                account.project_id,
                account.provider,
                account.name,
                account.email,
                format!("{:?}", account.status).to_lowercase(),
                account.config_path,
                account.created_at,
                account.updated_at,
            ],
        )
        .map_err(|e| format!("upsert account: {e}"))?;
    }
    Ok(())
}

fn parse_account_status(s: &str) -> AccountStatus {
    match s {
        "paused" => AccountStatus::Paused,
        "exhausted" => AccountStatus::Exhausted,
        _ => AccountStatus::Active,
    }
}
