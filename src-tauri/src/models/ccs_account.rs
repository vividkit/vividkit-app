use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AccountStatus {
    Active,
    Paused,
    Exhausted,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CcsAccount {
    pub id: String,
    pub project_id: Option<String>,
    pub provider: String,
    pub name: String,
    pub email: Option<String>,
    pub status: AccountStatus,
    pub config_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
