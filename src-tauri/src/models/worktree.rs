use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum WorktreeStatus {
    Active,
    Ready,
    Merged,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Worktree {
    pub id: String,
    pub project_id: String,
    pub task_id: Option<String>,
    pub branch: String,
    pub path: String,
    pub status: WorktreeStatus,
    pub files_changed: i32,
    pub merged_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
