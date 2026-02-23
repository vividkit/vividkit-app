use serde::Serialize;
use std::path::PathBuf;

#[derive(Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

#[tauri::command]
pub async fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let _ = path;
    Err("Not implemented".to_string())
}

/// Resolve a path relative to home directory.
/// Frontend passes e.g. "projects/foo/bar" → returns absolute path string.
/// Path resolution is always done in Rust per cross-platform rules.
#[tauri::command]
pub fn resolve_home_path(relative: String) -> Result<String, String> {
    let home = std::env::var("HOME").map_err(|e| e.to_string())?;
    let resolved = PathBuf::from(home).join(&relative);
    resolved
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid path encoding".to_string())
}
