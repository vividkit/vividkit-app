use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf, sync::{atomic::{AtomicU64, Ordering}, Mutex}, time::{SystemTime, UNIX_EPOCH}};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_shell::{process::CommandEvent, ShellExt};

const CCS_RUN_EVENT: &str = "ccs_run_event";
static RUN_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Serialize, Deserialize)]
pub struct AiRequest { pub prompt: String, pub model: String }
#[derive(Serialize)]
pub struct AiResponse { pub content: String }
#[derive(Default)]
pub struct CcsProcessRegistry { runs: Mutex<HashMap<String, u32>> }
#[derive(Serialize)]
pub struct CcsSpawnResult { pub run_id: String, pub pid: Option<u32> }
#[derive(Serialize)]
pub struct CcsStopResult { pub run_id: String, pub stopped: bool, pub already_stopped: bool }

#[derive(Serialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum CcsRunEventKind { Stdout, Stderr, Terminated, Error }

#[derive(Serialize, Clone)]
pub struct CcsRunEventPayload {
    pub run_id: String,
    pub kind: CcsRunEventKind,
    #[serde(skip_serializing_if = "Option::is_none")] pub chunk: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")] pub code: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")] pub message: Option<String>,
}

#[tauri::command]
pub async fn ai_complete(request: AiRequest) -> Result<AiResponse, String> { let _ = request; Err("Not implemented".to_string()) }

fn generate_run_id() -> String {
    let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis();
    format!("ccs-{ts}-{}", RUN_COUNTER.fetch_add(1, Ordering::Relaxed))
}

fn build_extended_path() -> Result<String, String> {
    let mut paths: Vec<PathBuf> = Vec::new();
    if let Some(current) = std::env::var_os("PATH") { paths.extend(std::env::split_paths(&current)); }
    if let Some(home) = std::env::var_os("HOME").or_else(|| std::env::var_os("USERPROFILE")) {
        let home = PathBuf::from(home);
        paths.extend([home.join(".bun/bin"), home.join(".cargo/bin"), home.join(".npm-global/bin")]);
    }
    #[cfg(target_os = "macos")]
    paths.extend([PathBuf::from("/usr/local/bin"), PathBuf::from("/opt/homebrew/bin")]);
    std::env::join_paths(paths).map(|joined| joined.to_string_lossy().into_owned()).map_err(|e| e.to_string())
}

fn emit_ccs_run_event(app: &AppHandle, run_id: &str, kind: CcsRunEventKind, chunk: Option<String>, code: Option<i32>, message: Option<String>) {
    let _ = app.emit(CCS_RUN_EVENT, CcsRunEventPayload { run_id: run_id.to_string(), kind, chunk, code, message });
}

#[cfg(target_os = "windows")]
fn kill_process_by_pid(pid: u32) -> Result<(), String> {
    let pid_string = pid.to_string();
    let status = std::process::Command::new("taskkill")
        .args(["/PID", pid_string.as_str(), "/T", "/F"])
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() { Ok(()) } else { Err(format!("Failed to kill pid {pid}")) }
}

#[cfg(not(target_os = "windows"))]
fn kill_process_by_pid(pid: u32) -> Result<(), String> {
    let pid_string = pid.to_string();
    let status = std::process::Command::new("kill")
        .args(["-TERM", pid_string.as_str()])
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        return Ok(());
    }
    let force_status = std::process::Command::new("kill")
        .args(["-KILL", pid_string.as_str()])
        .status()
        .map_err(|e| e.to_string())?;
    if force_status.success() { Ok(()) } else { Err(format!("Failed to kill pid {pid}")) }
}

fn cleanup_ccs_run(app: &AppHandle, run_id: &str) {
    if let Some(registry) = app.try_state::<CcsProcessRegistry>() {
        if let Ok(mut runs) = registry.runs.lock() { runs.remove(run_id); }
    }
}

#[tauri::command]
pub async fn spawn_ccs(
    app: AppHandle,
    process_registry: State<'_, CcsProcessRegistry>,
    profile: String,
    command: String,
    cwd: String,
) -> Result<CcsSpawnResult, String> {
    let mut args = Vec::with_capacity(2);
    if !profile.is_empty() && profile != "default" { args.push(profile); }
    args.push(command);
    let args_ref: Vec<&str> = args.iter().map(String::as_str).collect();
    let run_id = generate_run_id();

    let (mut rx, child) = app.shell().command("ccs").args(args_ref).env("PATH", build_extended_path()?).current_dir(&cwd).spawn().map_err(|e| e.to_string())?;
    let pid = child.pid();
    process_registry.runs.lock().map_err(|_| "Failed to lock CCS process registry".to_string())?.insert(run_id.clone(), pid);

    let app_handle = app.clone();
    let run_id_for_task = run_id.clone();
    tauri::async_runtime::spawn(async move {
        let emit = |kind, chunk, code, message| emit_ccs_run_event(&app_handle, &run_id_for_task, kind, chunk, code, message);
        let mut terminal_emitted = false;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(chunk) => emit(CcsRunEventKind::Stdout, Some(String::from_utf8_lossy(&chunk).to_string()), None, None),
                CommandEvent::Stderr(chunk) => emit(CcsRunEventKind::Stderr, Some(String::from_utf8_lossy(&chunk).to_string()), None, None),
                CommandEvent::Terminated(payload) => { emit(CcsRunEventKind::Terminated, None, payload.code, None); terminal_emitted = true; break; }
                CommandEvent::Error(message) => { emit(CcsRunEventKind::Error, None, None, Some(message)); terminal_emitted = true; break; }
                _ => {}
            }
        }
        if !terminal_emitted { emit(CcsRunEventKind::Error, None, None, Some("CCS process event stream ended unexpectedly".to_string())); }
        cleanup_ccs_run(&app_handle, &run_id_for_task);
    });

    Ok(CcsSpawnResult { run_id, pid: Some(pid) })
}

#[tauri::command]
pub async fn stop_ccs(process_registry: State<'_, CcsProcessRegistry>, run_id: String) -> Result<CcsStopResult, String> {
    let mut runs = process_registry.runs.lock().map_err(|_| "Failed to lock CCS process registry".to_string())?;
    if let Some(pid) = runs.get(&run_id).copied() {
        let stopped = kill_process_by_pid(pid).is_ok();
        if stopped {
            runs.remove(&run_id);
        }
        return Ok(CcsStopResult { run_id, stopped, already_stopped: false });
    }
    Ok(CcsStopResult { run_id, stopped: false, already_stopped: true })
}

#[tauri::command]
pub async fn list_ccs_profiles() -> Result<Vec<String>, String> { Err("Not implemented".to_string()) }
