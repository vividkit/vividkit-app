mod commands;
mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(commands::ai::CcsProcessRegistry::default())
        .manage(commands::ai::SessionLogWatcher::default())
        .invoke_handler(tauri::generate_handler![
            commands::git::git_status,
            commands::git::git_commit,
            commands::ai::ai_complete,
            commands::ai::spawn_ccs,
            commands::ai::stop_ccs,
            commands::ai::send_ccs_input,
            commands::ai::resume_ccs_session,
            commands::ai::list_ccs_profiles,
            commands::ai::watch_session_log,
            commands::ai::stop_session_log_watch,
            commands::fs::list_directory,
            commands::fs::resolve_home_path,
            commands::fs::find_new_session_log,
            commands::worktree::worktree_create,
            commands::worktree::worktree_cleanup,
            commands::subagent::list_subagent_files,
            commands::subagent::parse_subagent_file,
            commands::subagent::resolve_subagents,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
