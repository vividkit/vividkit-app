import { invoke } from '@tauri-apps/api/core'
import type { Task, TaskPriority, TaskStatus, TaskType } from '@/types'

export interface CreateTaskArgs extends Record<string, unknown> {
  deckId: string
  name: string
  description?: string
  priority?: TaskPriority
  type?: TaskType
}

export interface UpdateTaskArgs extends Record<string, unknown> {
  id: string
  name?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
}

export async function createTask(args: CreateTaskArgs): Promise<Task> {
  return invoke<Task>('create_task', args)
}

export async function listTasks(deckId: string): Promise<Task[]> {
  return invoke<Task[]>('list_tasks', { deckId })
}

export async function getTask(id: string): Promise<Task> {
  return invoke<Task>('get_task', { id })
}

export async function updateTask(args: UpdateTaskArgs): Promise<Task> {
  return invoke<Task>('update_task', args)
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  return invoke<Task>('update_task_status', { id, status })
}

export async function deleteTask(id: string): Promise<void> {
  return invoke<void>('delete_task', { id })
}
