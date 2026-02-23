use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;

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
    let _ = request;
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn spawn_ccs(
    app: AppHandle,
    profile: String,
    command: String,
    cwd: String,
) -> Result<(), String> {
    let shell = app.shell();

    let mut args: Vec<String> = vec![];
    if !profile.is_empty() && profile != "default" {
        args.push(profile.clone());
    }
    args.push(command.clone());

    let args_ref: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

    let (mut rx, _child) = shell
        .command("ccs")
        .args(&args_ref)
        .current_dir(&cwd)
        .spawn()
        .map_err(|e| e.to_string())?;

    while let Some(event) = rx.recv().await {
        match event {
            tauri_plugin_shell::process::CommandEvent::Stdout(chunk) => {
                let _ = app.emit("ccs_output", String::from_utf8_lossy(&chunk).to_string());
            }
            tauri_plugin_shell::process::CommandEvent::Stderr(chunk) => {
                let _ = app.emit("ccs_output", String::from_utf8_lossy(&chunk).to_string());
            }
            tauri_plugin_shell::process::CommandEvent::Terminated(payload) => {
                let _ = app.emit("ccs_done", payload.code.unwrap_or(-1));
                break;
            }
            _ => {}
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn list_ccs_profiles() -> Result<Vec<String>, String> {
    Err("Not implemented".to_string())
}
