import { invoke } from '@tauri-apps/api/core'

export async function gitStatus(path: string): Promise<unknown> {
  return invoke('git_status', { path })
}

export async function resolveHomePath(relative: string): Promise<string> {
  return invoke<string>('resolve_home_path', { relative })
}
