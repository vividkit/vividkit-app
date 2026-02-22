import { invoke } from '@tauri-apps/api/core'

// Placeholder wrappers — implement as commands are added
export async function gitStatus(path: string): Promise<unknown> {
  return invoke('git_status', { path })
}
