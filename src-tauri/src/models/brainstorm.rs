use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BrainstormStatus {
    Idle,
    Running,
    Completed,
}

impl BrainstormStatus {
    pub fn as_db_str(&self) -> &'static str {
        match self {
            Self::Idle => "idle",
            Self::Running => "running",
            Self::Completed => "completed",
        }
    }

    pub fn from_db_str(value: &str) -> Result<Self, String> {
        match value {
            "idle" => Ok(Self::Idle),
            "running" => Ok(Self::Running),
            "completed" => Ok(Self::Completed),
            _ => Err(format!("Invalid brainstorm status: {value}")),
        }
    }
}

pub fn to_session(
    row: (String, String, String, Option<String>, String, String),
) -> Result<BrainstormSession, String> {
    Ok(BrainstormSession {
        id: row.0,
        deck_id: row.1,
        prompt: row.2,
        report_path: row.3,
        status: BrainstormStatus::from_db_str(&row.4)?,
        created_at: row.5,
    })
}

pub fn to_insight(row: (String, String, String, String, String, String)) -> KeyInsight {
    KeyInsight {
        id: row.0,
        project_id: row.1,
        deck_id: row.2,
        title: row.3,
        report_path: row.4,
        created_at: row.5,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrainstormSession {
    pub id: String,
    pub deck_id: String,
    pub prompt: String,
    pub report_path: Option<String>,
    pub status: BrainstormStatus,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyInsight {
    pub id: String,
    pub project_id: String,
    pub deck_id: String,
    pub title: String,
    pub report_path: String,
    pub created_at: String,
}
