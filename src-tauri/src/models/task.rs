use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[allow(dead_code)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub status: String,
    pub project_id: String,
}
