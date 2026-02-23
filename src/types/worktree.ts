export type WorktreeStatus = 'active' | 'ready' | 'merged'
export type MergeStrategy = 'merge' | 'squash' | 'rebase'

export interface Worktree {
  id: string
  projectId: string
  taskId: string
  branch: string
  status: WorktreeStatus
  filesChanged: number
  mergedAt?: string
  createdAt: string
}
