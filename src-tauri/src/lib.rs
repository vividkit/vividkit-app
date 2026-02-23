mod commands;
mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::git::git_status,
            commands::git::git_commit,
            commands::ai::ai_complete,
            commands::ai::spawn_ccs,
            commands::ai::list_ccs_profiles,
            commands::fs::list_directory,
            commands::worktree::worktree_create,
            commands::worktree::worktree_cleanup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
