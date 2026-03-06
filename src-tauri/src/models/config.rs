use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[allow(dead_code)]
pub struct AppConfig {
    pub ai_provider: String,
    pub api_key: String,
    pub theme: String,
}
