use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Deck {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub based_on_insight_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
