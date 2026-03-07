use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct KeyInsight {
    pub id: String,
    pub project_id: String,
    pub deck_id: String,
    pub title: String,
    pub report_path: String,
    pub created_at: String,
}
