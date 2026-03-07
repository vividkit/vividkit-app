use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PhaseStatus {
    Pending,
    InProgress,
    Done,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Phase {
    pub id: String,
    pub plan_id: String,
    pub name: String,
    pub description: Option<String>,
    pub file_path: Option<String>,
    pub order_index: i32,
    pub status: PhaseStatus,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Plan {
    pub id: String,
    pub deck_id: String,
    pub name: String,
    pub report_path: Option<String>,
    pub plan_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
