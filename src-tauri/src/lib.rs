mod commands;
mod db;
mod models;

use tauri::Manager;

#[allow(clippy::disallowed_methods)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Initialize SQLite database at app data dir
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("app data dir: {e}"))?;
            let db_state =
                db::init_database(app_data_dir).map_err(|e| format!("init db: {e}"))?;
            app.manage(db_state);
            Ok(())
        })
        .manage(commands::ai::CcsProcessRegistry::default())
        .manage(commands::ai::SessionLogWatcher::default())
        .invoke_handler(tauri::generate_handler![
            // DB
            commands::db::check_db,
            // CCS
            commands::ccs::discover_ccs_profiles,
            commands::ccs::get_ccs_accounts,
            // Git
            commands::git::git_status,
            commands::git::git_commit,
            // AI / CCS process
            commands::ai::ai_complete,
            commands::ai::spawn_ccs,
            commands::ai::stop_ccs,
            commands::ai::send_ccs_input,
            commands::ai::resume_ccs_session,
            commands::ai::list_ccs_profiles,
            commands::ai::watch_session_log,
            commands::ai::stop_session_log_watch,
            // Filesystem
            commands::fs::list_directory,
            commands::fs::resolve_home_path,
            commands::fs::find_new_session_log,
            commands::fs::extract_report_path_from_jsonl,
            // Worktree
            commands::worktree::worktree_create,
            commands::worktree::worktree_cleanup,
            // Subagent
            commands::subagent::list_subagent_files,
            commands::subagent::parse_subagent_file,
            commands::subagent::resolve_subagents,
            // Project
            commands::project::create_project,
            commands::project::list_projects,
            commands::project::get_active_project,
            commands::project::set_active_project,
            commands::project::validate_git_repo,
            commands::project::init_git_repo,
            commands::project::list_decks,
            // Dashboard
            commands::dashboard::get_dashboard_stats,
            // Settings
            commands::settings::get_settings,
            commands::settings::update_settings,
            // Brainstorm
            commands::brainstorm::create_brainstorm_session,
            commands::brainstorm::update_brainstorm_session,
            commands::brainstorm::list_brainstorm_sessions,
            commands::brainstorm::get_brainstorm_session,
            commands::brainstorm::create_key_insight,
            commands::brainstorm::list_key_insights,
            commands::brainstorm::delete_key_insight,
            // Plan
            commands::plan::create_plan,
            commands::plan::create_phases,
            commands::plan::list_plans,
            commands::plan::get_plan,
            commands::plan::update_phase_status,
            commands::plan::read_plan_file,
            // Deck
            commands::deck::create_deck,
            commands::deck::set_active_deck,
            commands::deck::delete_deck,
            // Task
            commands::task::create_task,
            commands::task::list_tasks,
            commands::task::get_task,
            commands::task::update_task,
            commands::task::delete_task,
            commands::task::update_task_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
