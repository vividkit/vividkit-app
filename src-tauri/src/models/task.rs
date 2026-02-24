use serde::{Deserialize, Serialize};

pub type TaskRow = (
    String,
    String,
    String,
    String,
    Option<String>,
    String,
    String,
    Option<String>,
    Option<String>,
    Option<String>,
);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Backlog,
    Todo,
    InProgress,
    Done,
}

impl TaskStatus {
    pub fn as_db_str(&self) -> &'static str {
        match self {
            Self::Backlog => "backlog",
            Self::Todo => "todo",
            Self::InProgress => "in_progress",
            Self::Done => "done",
        }
    }

    pub fn from_db_str(value: &str) -> Result<Self, String> {
        match value {
            "backlog" => Ok(Self::Backlog),
            "todo" => Ok(Self::Todo),
            "in_progress" => Ok(Self::InProgress),
            "done" => Ok(Self::Done),
            _ => Err(format!("Invalid task status: {value}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskPriority {
    Low,
    Medium,
    High,
}

impl TaskPriority {
    pub fn as_db_str(&self) -> &'static str {
        match self {
            Self::Low => "low",
            Self::Medium => "medium",
            Self::High => "high",
        }
    }

    pub fn from_db_str(value: &str) -> Result<Self, String> {
        match value {
            "low" => Ok(Self::Low),
            "medium" => Ok(Self::Medium),
            "high" => Ok(Self::High),
            _ => Err(format!("Invalid task priority: {value}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskType {
    Generated,
    Custom,
}

impl TaskType {
    pub fn as_db_str(&self) -> &'static str {
        match self {
            Self::Generated => "generated",
            Self::Custom => "custom",
        }
    }

    pub fn from_db_str(value: &str) -> Result<Self, String> {
        match value {
            "generated" => Ok(Self::Generated),
            "custom" => Ok(Self::Custom),
            _ => Err(format!("Invalid task type: {value}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub deck_id: String,
    pub r#type: TaskType,
    pub name: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub plan_id: Option<String>,
    pub phase_id: Option<String>,
    pub worktree_name: Option<String>,
}

pub fn to_task(row: TaskRow) -> Result<Task, String> {
    Ok(Task {
        id: row.0,
        deck_id: row.1,
        r#type: TaskType::from_db_str(&row.2)?,
        name: row.3,
        description: row.4,
        status: TaskStatus::from_db_str(&row.5)?,
        priority: TaskPriority::from_db_str(&row.6)?,
        plan_id: row.7,
        phase_id: row.8,
        worktree_name: row.9,
    })
}
