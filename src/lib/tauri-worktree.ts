import { invoke } from '@tauri-apps/api/core'
import type { Worktree, WorktreeStatus } from '@/types'

export interface CreateWorktreeRecordArgs extends Record<string, unknown> {
  projectId: string
  taskId: string
  branch: string
}

export interface UpdateWorktreeRecordArgs extends Record<string, unknown> {
  id: string
  status?: WorktreeStatus
  mergedAt?: string
}

export async function createWorktreeRecord(args: CreateWorktreeRecordArgs): Promise<Worktree> {
  return invoke<Worktree>('create_worktree_record', args)
}

export async function listWorktreeRecords(projectId: string): Promise<Worktree[]> {
  return invoke<Worktree[]>('list_worktree_records', { projectId })
}

export async function updateWorktreeRecord(args: UpdateWorktreeRecordArgs): Promise<Worktree> {
  return invoke<Worktree>('update_worktree_record', args)
}

export async function deleteWorktreeRecord(id: string): Promise<void> {
  return invoke<void>('delete_worktree_record', { id })
}
