//! Tauri commands for subagent file discovery and parsing.
//! Used by CCS Test Console to render subagent executions.

use crate::models::subagent::RawSubagentData;
use std::fs;
use std::path::PathBuf;

/// List subagent JSONL files in a session's subagents directory.
/// Returns sorted list of absolute file paths matching `agent-*.jsonl`.
#[tauri::command]
pub fn list_subagent_files(session_dir: String) -> Result<Vec<String>, String> {
    let subagents_dir = PathBuf::from(&session_dir).join("subagents");

    if !subagents_dir.exists() {
        return Ok(Vec::new());
    }

    let mut files: Vec<String> = fs::read_dir(&subagents_dir)
        .map_err(|e| format!("Failed to read subagents directory: {}", e))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            let path = entry.path();
            let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            path.extension().and_then(|e| e.to_str()) == Some("jsonl")
                && name.starts_with("agent-")
        })
        .map(|entry| entry.path().to_string_lossy().to_string())
        .collect();

    files.sort();
    Ok(files)
}

/// Parse a single subagent JSONL file into RawSubagentData.
/// Extracts timing, message count, and filters warmup/compact files.
#[tauri::command]
pub fn parse_subagent_file(file_path: String) -> Result<RawSubagentData, String> {
    let path = PathBuf::from(&file_path);

    // Restrict reads to session subagents directory
    let parent_is_subagents = path
        .parent()
        .and_then(|p| p.file_name())
        .and_then(|n| n.to_str())
        .map(|name| name == "subagents")
        .unwrap_or(false);
    if !parent_is_subagents {
        return Err("Invalid subagent file location".to_string());
    }

    // Extract agent ID from filename: agent-{id}.jsonl
    let id = path
        .file_name()
        .and_then(|n| n.to_str())
        .and_then(|name| name.strip_prefix("agent-"))
        .and_then(|name| name.strip_suffix(".jsonl"))
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid subagent filename format".to_string())?;

    // Check if compact file (starts with "acompact")
    let is_compact = id.starts_with("acompact");

    // Read file content
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read subagent file: {}", e))?;

    let lines: Vec<&str> = content.lines().filter(|l| !l.is_empty()).collect();
    let message_count = lines.len();

    // Parse first and last timestamps
    let (start_time, end_time, first_user_message, is_warmup) = parse_subagent_metadata(&lines)?;

    // Calculate duration
    let duration_ms = if let (Ok(start), Ok(end)) = (
        chrono::DateTime::parse_from_rfc3339(&start_time),
        chrono::DateTime::parse_from_rfc3339(&end_time),
    ) {
        (end - start).num_milliseconds().max(0) as u64
    } else {
        0
    };

    Ok(RawSubagentData {
        id,
        file_path,
        raw_messages: content,
        start_time,
        end_time,
        duration_ms,
        message_count,
        first_user_message,
        is_warmup,
        is_compact,
    })
}

/// Parse all subagent files in a session directory.
/// Returns only non-warmup, non-compact subagents sorted by start time.
#[tauri::command]
pub fn resolve_subagents(session_dir: String) -> Result<Vec<RawSubagentData>, String> {
    let files = list_subagent_files(session_dir)?;

    let mut subagents: Vec<RawSubagentData> = Vec::new();

    for path in files {
        match parse_subagent_file(path.clone()) {
            Ok(subagent) => {
                if !subagent.is_warmup && !subagent.is_compact {
                    subagents.push(subagent);
                }
            }
            Err(err) => {
                eprintln!("[subagent] failed to parse {}: {}", path, err);
            }
        }
    }

    // Stable deterministic ordering for renderer parity
    subagents.sort_by(|a, b| a.start_time.cmp(&b.start_time).then_with(|| a.id.cmp(&b.id)));

    Ok(subagents)
}

/// Parse metadata from JSONL lines: first/last timestamp, first user message, warmup detection.
fn parse_subagent_metadata(
    lines: &[&str],
) -> Result<(String, String, Option<String>, bool), String> {
    let mut first_timestamp: Option<String> = None;
    let mut last_timestamp: Option<String> = None;
    let mut first_user_message: Option<String> = None;
    let mut is_warmup = false;

    for line in lines {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
            // Extract timestamp
            if let Some(ts) = json.get("timestamp").and_then(|t| t.as_str()) {
                if first_timestamp.is_none() {
                    first_timestamp = Some(ts.to_string());
                }
                last_timestamp = Some(ts.to_string());
            }

            // Check for first user message and warmup
            if json.get("type").and_then(|t| t.as_str()) == Some("user") {
                if let Some(msg) = json.get("message") {
                    // Check if this is the first user message
                    if first_user_message.is_none() {
                        // Extract text content
                        if let Some(content) = msg.get("content") {
                            let text = extract_text_content(content);
                            first_user_message = Some(text.clone());

                            // Check for warmup (first message is "Warmup")
                            if text.trim() == "Warmup" {
                                is_warmup = true;
                            }
                        }
                    }
                }
            }
        }
    }

    let start = first_timestamp.unwrap_or_default();
    let end = last_timestamp.unwrap_or_default();

    Ok((start, end, first_user_message, is_warmup))
}

/// Extract text content from a message content field (string or array).
fn extract_text_content(content: &serde_json::Value) -> String {
    match content {
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Array(blocks) => blocks
            .iter()
            .filter_map(|block| {
                if block.get("type").and_then(|t| t.as_str()) == Some("text") {
                    block.get("text").and_then(|t| t.as_str())
                } else {
                    None
                }
            })
            .collect::<Vec<_>>()
            .join("\n"),
        _ => String::new(),
    }
}
