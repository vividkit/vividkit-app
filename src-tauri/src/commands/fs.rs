use serde::Serialize;
use std::path::PathBuf;
use std::io::BufRead;

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
    let home = dirs::home_dir().ok_or_else(|| "Unable to resolve home directory".to_string())?;
    let resolved = home.join(&relative);
    Ok(resolved.to_string_lossy().into_owned())
}

/// Encode a cwd path the way Claude Code names its project directories:
/// leading slash stripped, remaining slashes replaced with dashes.
/// e.g. "/Users/foo/myproject" → "Users-foo-myproject"
fn encode_cwd_to_project_dir(cwd: &str) -> String {
    cwd.trim_start_matches('/')
        .replace(['/', '\\'], "-")
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
    use std::time::{Duration, UNIX_EPOCH};

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

/// Parse a JSONL session log (and its subagent logs) to find the report file path.
/// Scans all lines for any absolute path containing "plans/reports/" ending in ".md".
/// Works regardless of which tool (Write, Bash, Edit) was used to create the report.
/// Also scans subagent JSONL files in the session's `subagents/` directory.
/// Returns the last matching report path found (most likely the final report), or None.
#[tauri::command]
pub fn extract_report_path_from_jsonl(jsonl_path: String) -> Result<Option<String>, String> {
    let main_path = PathBuf::from(&jsonl_path);

    // Collect all JSONL files to scan: main session + subagents
    let mut files_to_scan = vec![main_path.clone()];

    // Check for subagents directory: {session_id}/subagents/*.jsonl
    let session_id = main_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("");
    if let Some(parent) = main_path.parent() {
        let subagents_dir = parent.join(session_id).join("subagents");
        if subagents_dir.is_dir() {
            if let Ok(entries) = std::fs::read_dir(&subagents_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|e| e.to_str()) == Some("jsonl") {
                        files_to_scan.push(path);
                    }
                }
            }
        }
    }

    let mut last_match: Option<String> = None;

    for file_path in &files_to_scan {
        let file = match std::fs::File::open(file_path) {
            Ok(f) => f,
            Err(_) => continue,
        };
        let reader = std::io::BufReader::new(file);

        for line in reader.lines() {
            let line = match line {
                Ok(l) => l,
                Err(_) => continue,
            };
            if !line.contains("plans/reports/") {
                continue;
            }
            // Extract path: find "plans/reports/" then expand left/right
            let mut search_from = 0;
            while let Some(idx) = line[search_from..].find("plans/reports/") {
                let abs_idx = search_from + idx;
                let path_start = line[..abs_idx]
                    .rfind(|c: char| c == '"' || c == '\'' || c == ' ' || c == '\\')
                    .map(|i| i + 1)
                    .unwrap_or(0);
                let after_reports = abs_idx + "plans/reports/".len();
                if let Some(md_offset) = line[after_reports..].find(".md") {
                    let path_end = after_reports + md_offset + 3;
                    let candidate = &line[path_start..path_end];
                    if candidate.starts_with('/') && !candidate.contains(' ') {
                        last_match = Some(candidate.to_string());
                    }
                }
                search_from = abs_idx + 1;
            }
        }
    }
    Ok(last_match)
}
