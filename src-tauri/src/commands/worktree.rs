use serde::Serialize;

#[derive(Serialize)]
pub struct WorktreeInfo {
    pub path: String,
    pub branch: String,
}

#[tauri::command]
pub async fn worktree_create(project_path: String, branch: String) -> Result<WorktreeInfo, String> {
    let _ = (project_path, branch);
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn worktree_cleanup(path: String) -> Result<(), String> {
    let _ = path;
    Err("Not implemented".to_string())
}
