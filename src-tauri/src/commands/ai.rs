use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AiRequest {
    pub prompt: String,
    pub model: String,
}

#[derive(Serialize)]
pub struct AiResponse {
    pub content: String,
}

#[tauri::command]
pub async fn ai_complete(request: AiRequest) -> Result<AiResponse, String> {
    // TODO: implement HTTP call via reqwest
    let _ = request;
    Err("Not implemented".to_string())
}
