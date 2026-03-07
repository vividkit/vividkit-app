use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum BrainstormStatus {
    Idle,
    Running,
    Completed,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BrainstormSession {
    pub id: String,
    pub deck_id: String,
    pub prompt: String,
    pub report_path: Option<String>,
    pub session_log_path: Option<String>,
    pub status: BrainstormStatus,
    pub created_at: String,
    pub updated_at: String,
}
