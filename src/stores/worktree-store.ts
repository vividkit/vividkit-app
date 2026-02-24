import { create } from 'zustand'
import {
  createWorktreeRecord as createWorktreeRecordCommand,
  deleteWorktreeRecord as deleteWorktreeRecordCommand,
  listWorktreeRecords,
  updateWorktreeRecord as updateWorktreeRecordCommand,
} from '@/lib/tauri'
import type { Worktree, WorktreeStatus } from '@/types'

type WorktreeInput = Pick<Worktree, 'projectId' | 'taskId' | 'branch'>

interface WorktreeStore {
  worktrees: Worktree[]
  loading: boolean
  initialized: boolean
  error: string | null
  loadWorktrees: (projectId: string) => Promise<void>
  addWorktree: (input: WorktreeInput | Worktree) => Promise<Worktree | null>
  updateStatus: (id: string, status: WorktreeStatus) => Promise<Worktree | null>
  updateWorktree: (id: string, patch: { status?: WorktreeStatus; mergedAt?: string }) => Promise<Worktree | null>
  removeWorktree: (id: string) => Promise<boolean>
  clearError: () => void
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function notifyError(message: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vividkit:toast', { detail: { type: 'error', message } }))
  }
}

function upsertWorktree(worktrees: Worktree[], next: Worktree): Worktree[] {
  const exists = worktrees.some((worktree) => worktree.id === next.id)
  if (exists) {
    return worktrees.map((worktree) => (worktree.id === next.id ? next : worktree))
  }
  return [next, ...worktrees]
}

export const useWorktreeStore = create<WorktreeStore>((set, get) => ({
  worktrees: [],
  loading: false,
  initialized: false,
  error: null,
  loadWorktrees: async (projectId) => {
    set({ loading: true, error: null })
    try {
      const worktrees = await listWorktreeRecords(projectId)
      set({ worktrees, loading: false, initialized: true })
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, initialized: true, error: message })
      notifyError(message)
    }
  },
  addWorktree: async (input) => {
    const existing = 'id' in input ? get().worktrees.find((worktree) => worktree.id === input.id) : undefined
    if (existing) {
      return existing
    }

    set({ loading: true, error: null })
    try {
      const worktree = await createWorktreeRecordCommand({
        projectId: input.projectId,
        taskId: input.taskId,
        branch: input.branch,
      })
      set((state) => ({ worktrees: upsertWorktree(state.worktrees, worktree), loading: false }))
      return worktree
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  updateStatus: async (id, status) => {
    const current = get().worktrees.find((worktree) => worktree.id === id)
    return get().updateWorktree(id, {
      status,
      mergedAt: status === 'merged' ? current?.mergedAt ?? new Date().toISOString() : current?.mergedAt,
    })
  },
  updateWorktree: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const worktree = await updateWorktreeRecordCommand({ id, ...patch })
      set((state) => ({ worktrees: upsertWorktree(state.worktrees, worktree), loading: false }))
      return worktree
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  removeWorktree: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteWorktreeRecordCommand(id)
      set((state) => ({ worktrees: state.worktrees.filter((worktree) => worktree.id !== id), loading: false }))
      return true
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return false
    }
  },
  clearError: () => {
    if (get().error) {
      set({ error: null })
    }
  },
}))
