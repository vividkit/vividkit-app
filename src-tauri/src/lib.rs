mod commands;
mod db;
mod models;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(commands::ai::CcsProcessRegistry::default())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            let db_state = db::init_db(app_data_dir)
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
            app.manage(db_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::git::git_status,
            commands::git::git_commit,
            commands::ai::ai_complete,
            commands::ai::spawn_ccs,
            commands::ai::stop_ccs,
            commands::ai::send_ccs_input,
            commands::ccs_profile::list_ccs_profiles,
            commands::fs::list_directory,
            commands::fs::resolve_home_path,
            commands::worktree::worktree_create,
            commands::worktree::worktree_cleanup,
            commands::project::create_project,
            commands::project::list_projects,
            commands::project::get_project,
            commands::project::update_project,
            commands::project::delete_project,
            commands::deck::create_deck,
            commands::deck::list_decks,
            commands::deck::set_active_deck,
            commands::deck::update_deck,
            commands::deck::delete_deck,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::plan::create_plan,
            commands::plan::list_plans,
            commands::plan::get_plan,
            commands::plan::delete_plan,
            commands::plan::create_phase,
            commands::plan::update_phase_status,
            commands::plan::delete_phase,
            commands::task::create_task,
            commands::task::list_tasks,
            commands::task::get_task,
            commands::task::update_task,
            commands::task::update_task_status,
            commands::task::delete_task,
            commands::brainstorm::create_brainstorm_session,
            commands::brainstorm::list_brainstorm_sessions,
            commands::brainstorm::update_brainstorm_session,
            commands::brainstorm::create_key_insight,
            commands::brainstorm::list_key_insights,
            commands::brainstorm::delete_key_insight,
            commands::worktree_cmd::create_worktree_record,
            commands::worktree_cmd::list_worktree_records,
            commands::worktree_cmd::update_worktree_record,
            commands::worktree_cmd::delete_worktree_record,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
