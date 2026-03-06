use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[allow(dead_code)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub created_at: String,
}
