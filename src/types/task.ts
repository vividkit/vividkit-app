export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'cooking' | 'paused' | 'review' | 'done' | 'failed'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskType = 'generated' | 'custom'

export interface Task {
  id: string
  deckId: string
  type?: TaskType
  taskType?: TaskType
  name: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  planId?: string
  phaseId?: string
  worktreeId?: string
  worktreeName?: string
  cookSessionId?: string
  createdAt?: string
  updatedAt?: string
}

export interface TaskColumn {
  id: TaskStatus
  title: string
  tasks: Task[]
}
