export type CookStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed'

export interface CookSession {
  id: string
  taskId: string
  worktreeId?: string
  ccsProfile: string
  sessionLogPath?: string
  status: CookStatus
  startedAt?: string
  finishedAt?: string
  createdAt: string
  updatedAt: string
}
