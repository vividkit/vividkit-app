import { create } from 'zustand'
import type { Worktree, WorktreeStatus } from '@/types'

interface WorktreeStore {
  worktrees: Worktree[]
  addWorktree: (wt: Worktree) => void
  updateStatus: (id: string, status: WorktreeStatus) => void
}

export const useWorktreeStore = create<WorktreeStore>((set) => ({
  worktrees: [],
  addWorktree: (wt) => set((s) => ({ worktrees: [...s.worktrees, wt] })),
  updateStatus: (id, status) =>
    set((s) => ({ worktrees: s.worktrees.map((w) => (w.id === id ? { ...w, status } : w)) })),
}))
