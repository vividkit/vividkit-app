use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub language: String,
    pub theme: String,
    pub auto_save: bool,
    pub font_size: i64,
    pub default_branch: String,
    pub worktrees_dir: String,
    pub command_providers: HashMap<String, String>,
    pub last_active_project_id: Option<String>,
}
