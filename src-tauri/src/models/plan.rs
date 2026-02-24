use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PhaseStatus {
    Pending,
    InProgress,
    Done,
}

impl PhaseStatus {
    pub fn as_db_str(&self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::InProgress => "in_progress",
            Self::Done => "done",
        }
    }

    pub fn from_db_str(value: &str) -> Result<Self, String> {
        match value {
            "pending" => Ok(Self::Pending),
            "in_progress" => Ok(Self::InProgress),
            "done" => Ok(Self::Done),
            _ => Err(format!("Invalid phase status: {value}")),
        }
    }
}

pub fn to_phase(
    row: (
        String,
        String,
        String,
        Option<String>,
        Option<String>,
        i64,
        String,
    ),
) -> Result<Phase, String> {
    Ok(Phase {
        id: row.0,
        plan_id: row.1,
        name: row.2,
        description: row.3,
        file_path: row.4,
        order: row.5,
        status: PhaseStatus::from_db_str(&row.6)?,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Phase {
    pub id: String,
    pub plan_id: String,
    pub name: String,
    pub description: Option<String>,
    pub file_path: Option<String>,
    pub order: i64,
    pub status: PhaseStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Plan {
    pub id: String,
    pub deck_id: String,
    pub name: String,
    pub report_path: Option<String>,
    pub plan_path: Option<String>,
    pub phases: Vec<Phase>,
    pub created_at: String,
}
