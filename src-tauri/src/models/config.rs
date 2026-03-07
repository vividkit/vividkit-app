use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub id: String,
    pub key: String,
    pub value: String,
    pub updated_at: String,
}
