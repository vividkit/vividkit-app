//! Subagent models for IPC between Rust and TypeScript.
//! Matches types in src/types/subagent.ts

use serde::{Deserialize, Serialize};

/// Aggregated metrics for a subagent session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMetrics {
    pub duration_ms: u64,
    pub total_tokens: u64,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cache_read_tokens: u64,
    pub cache_creation_tokens: u64,
    pub message_count: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cost_usd: Option<f64>,
}

/// Team metadata for team member subagents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamInfo {
    pub team_name: String,
    pub member_name: String,
    pub member_color: String,
}

/// Main session impact tokens
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MainSessionImpact {
    pub call_tokens: u64,
    pub result_tokens: u64,
    pub total_tokens: u64,
}

/// Raw subagent data returned from file parsing
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct RawSubagentData {
    pub id: String,
    pub file_path: String,
    pub raw_messages: String, // JSONL content as string
    pub start_time: String,   // ISO 8601
    pub end_time: String,     // ISO 8601
    pub duration_ms: u64,
    pub message_count: usize,
    pub first_user_message: Option<String>,
    pub is_warmup: bool,
    pub is_compact: bool,
}
