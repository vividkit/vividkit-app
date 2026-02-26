use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CcsAccountStatus {
    Active,
    Paused,
    Exhausted,
}

impl CcsAccountStatus {
    pub fn from_db(value: &str) -> Result<Self, String> {
        match value {
            "active" => Ok(Self::Active),
            "paused" => Ok(Self::Paused),
            "exhausted" => Ok(Self::Exhausted),
            _ => Err(format!("Invalid ccs account status: {value}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CcsAccount {
    pub id: String,
    pub project_id: String,
    pub provider: String,
    pub email: String,
    pub status: CcsAccountStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub git_path: String,
    pub ccs_connected: bool,
    pub ccs_accounts: Vec<CcsAccount>,
    pub created_at: String,
}
