use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    io::Write,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc, Mutex,
    },
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Emitter, Manager, State};

const CCS_RUN_EVENT: &str = "ccs_run_event";
static RUN_COUNTER: AtomicU64 = AtomicU64::new(1);
const EXIT_WATCHER_POLL_INTERVAL: Duration = Duration::from_millis(120);
const EXIT_WATCHER_GRACE_PERIOD: Duration = Duration::from_millis(350);
const EXIT_WATCHER_MAX_ERRORS: u8 = 5;

#[derive(Serialize, Deserialize)]
pub struct AiRequest {
    pub prompt: String,
    pub model: String,
}
#[derive(Serialize)]
pub struct AiResponse {
    pub content: String,
}

// PTY-based process entry
// NOTE: slave MUST be kept alive until child exits — dropping slave early breaks child stdin on macOS
struct PtyRun {
    writer: Box<dyn Write + Send>,
    child: Box<dyn portable_pty::Child + Send + Sync>,
    _slave: Box<dyn portable_pty::SlavePty + Send>,
}

#[derive(Default)]
pub struct CcsProcessRegistry {
    runs: Mutex<HashMap<String, PtyRun>>,
}

#[derive(Serialize)]
pub struct CcsSpawnResult {
    pub run_id: String,
    pub pid: Option<u32>,
}
#[derive(Serialize)]
pub struct CcsStopResult {
    pub run_id: String,
    pub stopped: bool,
    pub already_stopped: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum CcsRunEventKind {
    Stdout,
    Stderr,
    Terminated,
    Error,
}

#[derive(Serialize, Clone)]
pub struct CcsRunEventPayload {
    pub run_id: String,
    pub kind: CcsRunEventKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chunk: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[tauri::command]
pub async fn ai_complete(request: AiRequest) -> Result<AiResponse, String> {
    let _ = request;
    Err("Not implemented".to_string())
}

fn generate_run_id() -> String {
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    format!("ccs-{ts}-{}", RUN_COUNTER.fetch_add(1, Ordering::Relaxed))
}

fn build_extended_path() -> Result<String, String> {
    let mut paths: Vec<PathBuf> = Vec::new();
    if let Some(current) = std::env::var_os("PATH") {
        paths.extend(std::env::split_paths(&current));
    }
    if let Some(home) = std::env::var_os("HOME").or_else(|| std::env::var_os("USERPROFILE")) {
        let home = PathBuf::from(home);
        paths.extend([
            home.join(".bun/bin"),
            home.join(".cargo/bin"),
            home.join(".npm-global/bin"),
        ]);
    }
    #[cfg(target_os = "macos")]
    paths.extend([
        PathBuf::from("/usr/local/bin"),
        PathBuf::from("/opt/homebrew/bin"),
    ]);
    std::env::join_paths(paths)
        .map(|joined| joined.to_string_lossy().into_owned())
        .map_err(|e| e.to_string())
}

#[cfg(not(target_os = "windows"))]
fn kill_process_by_pid(pid: u32) -> Result<(), String> {
    let status = std::process::Command::new("kill")
        .args(["-TERM", &pid.to_string()])
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() { return Ok(()); }
    let status = std::process::Command::new("kill")
        .args(["-KILL", &pid.to_string()])
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("kill -KILL failed for pid {pid}"))
    }
}

#[cfg(target_os = "windows")]
fn kill_process_by_pid(pid: u32) -> Result<(), String> {
    let status = std::process::Command::new("taskkill")
        .args(["/PID", &pid.to_string(), "/T", "/F"])
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("taskkill failed for pid {pid}"))
    }
}

fn emit_ccs_run_event(
    app: &AppHandle,
    run_id: &str,
    kind: CcsRunEventKind,
    chunk: Option<String>,
    code: Option<i32>,
    message: Option<String>,
) {
    let _ = app.emit(
        CCS_RUN_EVENT,
        CcsRunEventPayload {
            run_id: run_id.to_string(),
            kind,
            chunk,
            code,
            message,
        },
    );
}

fn emit_terminated_once(
    app: &AppHandle,
    run_id: &str,
    code: i32,
    emitted: &AtomicBool,
) -> bool {
    if emitted.swap(true, Ordering::AcqRel) {
        return false;
    }
    emit_ccs_run_event(
        app,
        run_id,
        CcsRunEventKind::Terminated,
        None,
        Some(code),
        None,
    );
    true
}

fn cleanup_ccs_run(app: &AppHandle, run_id: &str) {
    if let Some(registry) = app.try_state::<CcsProcessRegistry>() {
        if let Ok(mut runs) = registry.runs.lock() {
            runs.remove(run_id);
        }
    }
}

enum CcsRunState {
    Running,
    Exited(i32),
    Missing,
}

fn get_ccs_run_state(app: &AppHandle, run_id: &str) -> Result<CcsRunState, String> {
    let registry = app
        .try_state::<CcsProcessRegistry>()
        .ok_or_else(|| "CCS process registry unavailable".to_string())?;
    let mut runs = registry
        .runs
        .lock()
        .map_err(|_| "Failed to lock CCS process registry".to_string())?;
    let entry = match runs.get_mut(run_id) {
        Some(entry) => entry,
        None => return Ok(CcsRunState::Missing),
    };
    let status = entry.child.try_wait().map_err(|e| e.to_string())?;
    Ok(match status {
        Some(s) => CcsRunState::Exited(s.exit_code() as i32),
        None => CcsRunState::Running,
    })
}

#[tauri::command]
pub async fn spawn_ccs(
    app: AppHandle,
    process_registry: State<'_, CcsProcessRegistry>,
    profile: String,
    command: String,
    cwd: String,
) -> Result<CcsSpawnResult, String> {
    let run_id = generate_run_id();
    let extended_path = build_extended_path()?;

    // Build ccs args
    let mut ccs_args: Vec<String> = Vec::new();
    if !profile.is_empty() && profile != "default" {
        ccs_args.push(profile.clone());
    }
    ccs_args.push("--dangerously-skip-permissions".to_string());
    ccs_args.push(command.clone());

    // Log full command for debugging
    eprintln!("[CCS spawn] run_id={run_id} program=ccs args={ccs_args:?} cwd={cwd}");

    // Open PTY
    let pty_system = NativePtySystem::default();
    let pty_pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Failed to open PTY: {e}"))?;

    // Build command for PTY
    let mut cmd = CommandBuilder::new("ccs");
    for arg in &ccs_args {
        cmd.arg(arg);
    }
    cmd.env("PATH", &extended_path);
    cmd.env("TERM", "xterm-256color");
    cmd.cwd(&cwd);

    // Destructure PTY pair — slave MUST be kept alive (not dropped) until child exits
    let (master, slave) = (pty_pair.master, pty_pair.slave);

    // Spawn child in PTY slave
    let child = slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn CCS: {e}"))?;

    let pid = child.process_id();

    // Get PTY master reader and writer
    let writer = master
        .take_writer()
        .map_err(|e| format!("Failed to get PTY writer: {e}"))?;
    let mut reader = master
        .try_clone_reader()
        .map_err(|e| format!("Failed to get PTY reader: {e}"))?;

    // Store writer, child, and slave (slave must outlive child) in registry
    {
        let mut runs = process_registry
            .runs
            .lock()
            .map_err(|_| "Failed to lock CCS process registry".to_string())?;
        runs.insert(run_id.clone(), PtyRun { writer, child, _slave: slave });
    }

    // Spawn reader task
    let app_handle = app.clone();
    let run_id_for_task = run_id.clone();
    let terminated_emitted = Arc::new(AtomicBool::new(false));
    let reader_terminated_emitted = Arc::clone(&terminated_emitted);
    std::thread::spawn(move || {
        eprintln!("[CCS reader] started run_id={run_id_for_task}");
        let mut buf = [0u8; 4096];
        let mut warned_closed_while_running = false;
        loop {
            match reader.read(&mut buf) {
                Ok(0) => {
                    eprintln!("[CCS reader] EOF run_id={run_id_for_task}");
                    match get_ccs_run_state(&app_handle, &run_id_for_task) {
                        Ok(CcsRunState::Exited(code)) => {
                            let _ = emit_terminated_once(
                                &app_handle,
                                &run_id_for_task,
                                code,
                                reader_terminated_emitted.as_ref(),
                            );
                            break;
                        }
                        Ok(CcsRunState::Running) => {
                            if !warned_closed_while_running {
                                eprintln!(
                                    "[CCS reader] EOF but process still running, keep run alive run_id={run_id_for_task}"
                                );
                                warned_closed_while_running = true;
                            }
                            std::thread::sleep(std::time::Duration::from_millis(100));
                            continue;
                        }
                        Ok(CcsRunState::Missing) => {
                            eprintln!(
                                "[CCS reader] run missing after EOF, stop reader run_id={run_id_for_task}"
                            );
                            break;
                        }
                        Err(err) => {
                            emit_ccs_run_event(
                                &app_handle,
                                &run_id_for_task,
                                CcsRunEventKind::Error,
                                None,
                                None,
                                Some(format!("Failed to check CCS process status after EOF: {err}")),
                            );
                            std::thread::sleep(std::time::Duration::from_millis(50));
                            continue;
                        }
                    }
                }
                Ok(n) => {
                    warned_closed_while_running = false;
                    let chunk = String::from_utf8_lossy(&buf[..n]).to_string();
                    eprintln!("[CCS reader] stdout chunk len={n} run_id={run_id_for_task}");
                    emit_ccs_run_event(
                        &app_handle,
                        &run_id_for_task,
                        CcsRunEventKind::Stdout,
                        Some(chunk),
                        None,
                        None,
                    );
                }
                Err(e) => {
                    let os_code = e.raw_os_error();
                    let is_eio = os_code.map_or(false, |code| code == 5); // EIO = 5
                    eprintln!("[CCS reader] error code={os_code:?} is_eio={is_eio} run_id={run_id_for_task}");
                    if is_eio {
                        match get_ccs_run_state(&app_handle, &run_id_for_task) {
                            Ok(CcsRunState::Exited(code)) => {
                                let _ = emit_terminated_once(
                                    &app_handle,
                                    &run_id_for_task,
                                    code,
                                    reader_terminated_emitted.as_ref(),
                                );
                                break;
                            }
                            Ok(CcsRunState::Running) => {
                                if !warned_closed_while_running {
                                    eprintln!(
                                        "[CCS reader] EIO but process still running, keep run alive run_id={run_id_for_task}"
                                    );
                                    warned_closed_while_running = true;
                                }
                                std::thread::sleep(std::time::Duration::from_millis(100));
                                continue;
                            }
                            Ok(CcsRunState::Missing) => {
                                eprintln!(
                                    "[CCS reader] run missing after EIO, stop reader run_id={run_id_for_task}"
                                );
                                break;
                            }
                            Err(err) => {
                                emit_ccs_run_event(
                                    &app_handle,
                                    &run_id_for_task,
                                    CcsRunEventKind::Error,
                                    None,
                                    None,
                                    Some(format!(
                                        "Failed to check CCS process status after EIO: {err}"
                                    )),
                                );
                                std::thread::sleep(std::time::Duration::from_millis(50));
                                continue;
                            }
                        }
                    }
                    // EAGAIN/EWOULDBLOCK = no data yet, retry
                    let is_retry = os_code.map_or(false, |code| code == 4 || code == 11 || code == 35);
                    if is_retry {
                        warned_closed_while_running = false;
                        std::thread::sleep(std::time::Duration::from_millis(10));
                        continue;
                    }
                    warned_closed_while_running = false;
                    emit_ccs_run_event(
                        &app_handle,
                        &run_id_for_task,
                        CcsRunEventKind::Error,
                        None,
                        None,
                        Some(format!("PTY read error: {e}")),
                    );
                    // Unknown PTY read errors can be transient on some platforms.
                    // Keep run alive to preserve stop/stdin operations.
                    std::thread::sleep(std::time::Duration::from_millis(50));
                    continue;
                }
            }
        }
        cleanup_ccs_run(&app_handle, &run_id_for_task);
    });
    // PTY EOF/EIO is not guaranteed on every platform while keeping the slave alive.
    // Poll child exit independently so frontend always receives a terminated event.
    let app_handle = app.clone();
    let run_id_for_task = run_id.clone();
    let watcher_terminated_emitted = Arc::clone(&terminated_emitted);
    std::thread::spawn(move || {
        eprintln!("[CCS exit watcher] started run_id={run_id_for_task}");
        let mut exit_observed_at: Option<Instant> = None;
        let mut last_exit_code: i32 = 0;
        let mut consecutive_errors: u8 = 0;
        loop {
            match get_ccs_run_state(&app_handle, &run_id_for_task) {
                Ok(CcsRunState::Running) => {
                    exit_observed_at = None;
                    consecutive_errors = 0;
                    std::thread::sleep(EXIT_WATCHER_POLL_INTERVAL);
                }
                Ok(CcsRunState::Exited(code)) => {
                    consecutive_errors = 0;
                    match exit_observed_at {
                        Some(observed_at) if last_exit_code == code => {
                            if observed_at.elapsed() < EXIT_WATCHER_GRACE_PERIOD {
                                std::thread::sleep(Duration::from_millis(80));
                                continue;
                            }
                        }
                        _ => {
                            exit_observed_at = Some(Instant::now());
                            last_exit_code = code;
                            std::thread::sleep(Duration::from_millis(80));
                            continue;
                        }
                    }
                    let _ = emit_terminated_once(
                        &app_handle,
                        &run_id_for_task,
                        code,
                        watcher_terminated_emitted.as_ref(),
                    );
                    cleanup_ccs_run(&app_handle, &run_id_for_task);
                    break;
                }
                Ok(CcsRunState::Missing) => {
                    if !watcher_terminated_emitted.load(Ordering::Acquire) {
                        emit_ccs_run_event(
                            &app_handle,
                            &run_id_for_task,
                            CcsRunEventKind::Error,
                            None,
                            None,
                            Some("CCS run disappeared before terminated event".to_string()),
                        );
                    }
                    break;
                }
                Err(err) => {
                    consecutive_errors = consecutive_errors.saturating_add(1);
                    if consecutive_errors == 1 || consecutive_errors % EXIT_WATCHER_MAX_ERRORS == 0
                    {
                        emit_ccs_run_event(
                            &app_handle,
                            &run_id_for_task,
                            CcsRunEventKind::Error,
                            None,
                            None,
                            Some(format!(
                                "Failed to poll CCS process state (attempt {}): {err}",
                                consecutive_errors
                            )),
                        );
                    }
                    std::thread::sleep(EXIT_WATCHER_POLL_INTERVAL);
                }
            }
        }
    });

    Ok(CcsSpawnResult {
        run_id,
        pid: pid.map(|p| p as u32),
    })
}

#[tauri::command]
pub async fn stop_ccs(
    app: AppHandle,
    process_registry: State<'_, CcsProcessRegistry>,
    run_id: String,
) -> Result<CcsStopResult, String> {
    let mut runs = process_registry
        .runs
        .lock()
        .map_err(|_| "Failed to lock CCS process registry".to_string())?;
    if let Some(mut entry) = runs.remove(&run_id) {
        let pid = entry.child.process_id();
        eprintln!("[CCS stop] killing run_id={run_id} pid={pid:?}");
        // Use OS-level kill — portable-pty kill() is not reliable on macOS
        let stopped = if let Some(pid) = pid {
            kill_process_by_pid(pid).is_ok() || entry.child.kill().is_ok()
        } else {
            entry.child.kill().is_ok()
        };
        eprintln!("[CCS stop] stopped={stopped} run_id={run_id}");
        if !stopped {
            runs.insert(run_id.clone(), entry);
        }
        // Drop lock before emitting to avoid deadlock with PTY reader thread
        drop(runs);
        if stopped {
            emit_ccs_run_event(&app, &run_id, CcsRunEventKind::Terminated, None, Some(-1), None);
        }
        return Ok(CcsStopResult {
            run_id,
            stopped,
            already_stopped: false,
        });
    }
    eprintln!("[CCS stop] run_id={run_id} not found in registry (already stopped)");
    Ok(CcsStopResult {
        run_id,
        stopped: false,
        already_stopped: true,
    })
}

#[tauri::command]
pub async fn send_ccs_input(
    process_registry: State<'_, CcsProcessRegistry>,
    run_id: String,
    data: String,
) -> Result<(), String> {
    if data.is_empty() {
        return Ok(());
    }
    eprintln!("[CCS stdin] run_id={run_id} data_len={}", data.len());
    let mut runs = process_registry
        .runs
        .lock()
        .map_err(|_| "Failed to lock CCS process registry".to_string())?;
    let entry = runs
        .get_mut(&run_id)
        .ok_or_else(|| "CCS run not found".to_string())?;
    entry
        .writer
        .write_all(data.as_bytes())
        .map_err(|e| e.to_string())?;
    entry.writer.flush().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn resume_ccs_session(
    session_id: String,
    prompt: String,
    cwd: String,
) -> Result<String, String> {
    let trimmed = prompt.trim().to_string();
    if trimmed.is_empty() {
        return Ok(String::new());
    }
    let extended_path = build_extended_path()?;
    tokio::task::spawn_blocking(move || {
        let output = std::process::Command::new("claude")
            .arg("--dangerously-skip-permissions")
            .arg("--resume")
            .arg(session_id)
            .arg("-p")
            .arg(trimmed)
            .current_dir(cwd)
            .env("PATH", extended_path)
            .output()
            .map_err(|e| e.to_string())?;
        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            if stderr.is_empty() {
                Err(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                Err(stderr)
            }
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_ccs_profiles() -> Result<Vec<String>, String> {
    Err("Not implemented".to_string())
}

pub struct SessionLogWatcher {
    watchers: Mutex<HashMap<String, Arc<AtomicBool>>>,
}

impl Default for SessionLogWatcher {
    fn default() -> Self {
        Self {
            watchers: Mutex::new(HashMap::new()),
        }
    }
}

#[tauri::command]
pub async fn watch_session_log(
    app: AppHandle,
    state: State<'_, SessionLogWatcher>,
    session_id: String,
    path: String,
) -> Result<(), String> {
    let cancel = Arc::new(AtomicBool::new(false));
    {
        let mut watchers = state.watchers.lock().map_err(|_| "lock error")?;
        if let Some(old) = watchers.get(&session_id) {
            old.store(true, Ordering::Relaxed);
        }
        watchers.insert(session_id.clone(), cancel.clone());
    }

    let app_clone = app.clone();
    let session_id_clone = session_id.clone();

    std::thread::spawn(move || {
        use std::fs::File;
        use std::io::{BufRead, BufReader};

        let file = match File::open(&path) {
            Ok(f) => f,
            Err(e) => {
                let _ = app_clone.emit("ccs_session_log_error", format!("Cannot open {path}: {e}"));
                return;
            }
        };

        let mut reader = BufReader::new(file);
        let mut line = String::new();
        loop {
            if cancel.load(Ordering::Relaxed) {
                break;
            }

            line.clear();
            match reader.read_line(&mut line) {
                Ok(0) => {
                    std::thread::sleep(std::time::Duration::from_millis(100));
                }
                Ok(_) => {
                    let trimmed = line
                        .trim_end_matches('\n')
                        .trim_end_matches('\r')
                        .to_string();
                    if !trimmed.is_empty() {
                        let _ = app_clone.emit(
                            "ccs_session_log_line",
                            serde_json::json!({
                                "session_id": session_id_clone,
                                "line": trimmed
                            }),
                        );
                    }
                }
                Err(_) => {
                    std::thread::sleep(std::time::Duration::from_millis(200));
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_session_log_watch(
    state: State<'_, SessionLogWatcher>,
    session_id: String,
) -> Result<(), String> {
    let mut watchers = state.watchers.lock().map_err(|_| "lock error")?;
    if let Some(cancel) = watchers.remove(&session_id) {
        cancel.store(true, Ordering::Relaxed);
    }
    Ok(())
}
