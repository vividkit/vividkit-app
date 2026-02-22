export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  projectId: string
}

export interface TaskColumn {
  id: string
  title: string
  tasks: Task[]
}
