use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WorktreeStatus {
    Active,
    Ready,
    Merged,
}

impl WorktreeStatus {
    pub fn as_db_str(&self) -> &'static str {
        match self {
            Self::Active => "active",
            Self::Ready => "ready",
            Self::Merged => "merged",
        }
    }

    pub fn from_db_str(value: &str) -> Result<Self, String> {
        match value {
            "active" => Ok(Self::Active),
            "ready" => Ok(Self::Ready),
            "merged" => Ok(Self::Merged),
            _ => Err(format!("Invalid worktree status: {value}")),
        }
    }
}

pub fn to_worktree(
    row: (
        String,
        String,
        String,
        String,
        String,
        Option<String>,
        String,
    ),
) -> Result<Worktree, String> {
    Ok(Worktree {
        id: row.0,
        project_id: row.1,
        task_id: row.2,
        branch: row.3,
        status: WorktreeStatus::from_db_str(&row.4)?,
        files_changed: 0,
        merged_at: row.5,
        created_at: row.6,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Worktree {
    pub id: String,
    pub project_id: String,
    pub task_id: String,
    pub branch: String,
    pub status: WorktreeStatus,
    pub files_changed: i64,
    pub merged_at: Option<String>,
    pub created_at: String,
}
