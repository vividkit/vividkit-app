use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AppConfig {
    pub ai_provider: String,
    pub api_key: String,
    pub theme: String,
}
