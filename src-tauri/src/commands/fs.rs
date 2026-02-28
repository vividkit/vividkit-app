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

/// Encode a cwd path the way Claude Code names its project directories:
/// leading slash stripped, remaining slashes replaced with dashes.
/// e.g. "/Users/foo/myproject" → "Users-foo-myproject"
fn encode_cwd_to_project_dir(cwd: &str) -> String {
    cwd.trim_start_matches('/')
        .replace('/', "-")
        .replace('\\', "-")
}

/// Poll `projects_dir` for a new `.jsonl` session log file that was created
/// (or last-modified) after `spawn_time_ms` (Unix milliseconds).
/// Returns the path of the first matching file found, or `None` after timeout.
/// Filters to the subdirectory matching `cwd` if provided.
///
/// This replaces the old mtime-based `find_latest_session_log` with an approach
/// that waits for a genuinely new file, avoiding stale results from prior sessions.
#[tauri::command]
pub async fn find_new_session_log(
    projects_dir: String,
    cwd: Option<String>,
    spawn_time_ms: u64,
) -> Result<Option<String>, String> {
    use std::fs;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    let dir = PathBuf::from(&projects_dir);
    if !dir.exists() {
        return Ok(None);
    }

    let target_prefix = cwd.as_deref().map(encode_cwd_to_project_dir);
    let spawn_time = UNIX_EPOCH + Duration::from_millis(spawn_time_ms);

    // Poll up to 10 seconds (100ms intervals × 100 attempts)
    for _ in 0..100 {
        if let Ok(entries) = fs::read_dir(&dir) {
            for project_entry in entries.flatten() {
                let project_path = project_entry.path();
                if !project_path.is_dir() {
                    continue;
                }

                // Filter to the matching project directory
                if let Some(prefix) = &target_prefix {
                    let dir_name = project_path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                    if !dir_name.contains(prefix.as_str()) {
                        continue;
                    }
                }

                if let Ok(files) = fs::read_dir(&project_path) {
                    for file_entry in files.flatten() {
                        let file_path = file_entry.path();
                        // Only .jsonl files; skip agent_ prefixed subagent logs
                        if file_path.extension().and_then(|e| e.to_str()) != Some("jsonl") {
                            continue;
                        }
                        if file_path.file_name().and_then(|n| n.to_str())
                            .map(|n| n.starts_with("agent_")).unwrap_or(false)
                        {
                            continue;
                        }
                        if let Ok(meta) = file_entry.metadata() {
                            if let Ok(modified) = meta.modified() {
                                // Accept file if it was modified after the spawn time
                                if modified > spawn_time {
                                    return Ok(Some(file_path.to_string_lossy().to_string()));
                                }
                            }
                        }
                    }
                }
            }
        }

        tokio::time::sleep(Duration::from_millis(100)).await;
    }

    Ok(None)
}

