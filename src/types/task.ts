export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskType = 'generated' | 'custom'

export interface Task {
  id: string
  deckId: string
  type: TaskType
  name: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  planId?: string
  phaseId?: string
  worktreeName?: string
}

export interface TaskColumn {
  id: TaskStatus
  title: string
  tasks: Task[]
}
