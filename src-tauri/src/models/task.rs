use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Backlog,
    Todo,
    Cooking,
    Paused,
    Review,
    Done,
    Failed,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskPriority {
    Low,
    Medium,
    High,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskType {
    Generated,
    Custom,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub deck_id: String,
    pub task_type: TaskType,
    pub name: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub plan_id: Option<String>,
    pub phase_id: Option<String>,
    pub worktree_id: Option<String>,
    pub cook_session_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
