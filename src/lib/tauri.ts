import { invoke } from '@tauri-apps/api/core'

export type CcsRunEventKind = 'stdout' | 'stderr' | 'terminated' | 'error'

export interface CcsRunEventPayload {
  run_id: string
  kind: CcsRunEventKind
  chunk?: string
  code?: number
  message?: string
}

export interface SpawnCcsResult {
  run_id: string
  pid: number | null
}

export interface StopCcsResult {
  run_id: string
  stopped: boolean
  already_stopped: boolean
}

export interface SpawnCcsArgs {
  [key: string]: unknown
  profile: string
  command: string
  cwd: string
}

export async function gitStatus(path: string): Promise<unknown> {
  return invoke('git_status', { path })
}

export async function resolveHomePath(relative: string): Promise<string> {
  return invoke<string>('resolve_home_path', { relative })
}

export async function spawnCcs(args: SpawnCcsArgs): Promise<SpawnCcsResult> {
  return invoke<SpawnCcsResult>('spawn_ccs', args)
}

export async function stopCcs(runId: string): Promise<StopCcsResult> {
  return invoke<StopCcsResult>('stop_ccs', { runId }).catch((e) => {
    console.error('[stopCcs] error:', e, { runId })
    throw e
  })
}

export async function sendCcsInput(runId: string, data: string): Promise<void> {
  return invoke<void>('send_ccs_input', { runId, data }).catch((e) => {
    console.error('[sendCcsInput] error:', e, { runId, data })
    throw e
  })
}

export async function resumeCcsSession(
  sessionId: string,
  prompt: string,
  cwd: string,
): Promise<string> {
  return invoke<string>('resume_ccs_session', { sessionId, prompt, cwd }).catch((e) => {
    console.error('[resumeCcsSession] error:', e, { sessionId, cwd })
    throw e
  })
}

export async function findNewSessionLog(
  projectsDir: string,
  cwd: string | undefined,
  spawnTimeMs: number,
): Promise<string | null> {
  return invoke<string | null>('find_new_session_log', { projectsDir, cwd, spawnTimeMs })
}

export async function watchSessionLog(sessionId: string, path: string): Promise<void> {
  return invoke<void>('watch_session_log', { sessionId, path })
}

export async function stopSessionLogWatch(sessionId: string): Promise<void> {
  return invoke<void>('stop_session_log_watch', { sessionId })
}
