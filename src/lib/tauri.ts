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
  return invoke<StopCcsResult>('stop_ccs', { runId })
}

export async function sendCcsInput(runId: string, data: string): Promise<void> {
  return invoke('send_ccs_input', { runId, data })
}
