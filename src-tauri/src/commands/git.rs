use serde::Serialize;

#[derive(Serialize)]
pub struct GitStatus {
    pub branch: String,
    pub changed_files: Vec<String>,
}

#[tauri::command]
pub async fn git_status(path: String) -> Result<GitStatus, String> {
    // TODO: implement with git2
    let _ = path;
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn git_commit(path: String, message: String) -> Result<String, String> {
    let _ = (path, message);
    Err("Not implemented".to_string())
}
