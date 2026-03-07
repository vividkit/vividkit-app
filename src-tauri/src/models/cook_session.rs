use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CookStatus {
    Idle,
    Running,
    Paused,
    Completed,
    Failed,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CookSession {
    pub id: String,
    pub task_id: String,
    pub worktree_id: Option<String>,
    pub ccs_profile: String,
    pub session_log_path: Option<String>,
    pub status: CookStatus,
    pub started_at: Option<String>,
    pub finished_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
