import { create } from 'zustand'
import type { Task, TaskStatus, TaskPriority, TaskType } from '@/types'
import { listTasks, createTask, updateTaskStatus, deleteTask, updateTask } from '@/lib/tauri'

interface TaskStore {
  tasks: Task[]
  loaded: boolean
  loadTasks: (deckId: string) => Promise<void>
  addTask: (deckId: string, name: string, priority: TaskPriority, taskType: TaskType, description?: string) => Promise<Task>
  updateStatus: (id: string, status: TaskStatus) => Promise<void>
  removeTask: (id: string) => Promise<void>
  updateTaskInfo: (id: string, name?: string, description?: string, priority?: string) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  loaded: false,

  loadTasks: async (deckId: string) => {
    const tasks = await listTasks(deckId)
    set({ tasks, loaded: true })
  },

  addTask: async (deckId, name, priority, taskType, description) => {
    const task = await createTask(deckId, name, priority, taskType, description)
    set((s) => ({ tasks: [task, ...s.tasks] }))
    return task
  },

  updateStatus: async (id, status) => {
    const updated = await updateTaskStatus(id, status)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }))
  },

  removeTask: async (id) => {
    await deleteTask(id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  updateTaskInfo: async (id, name, description, priority) => {
    const updated = await updateTask(id, name, description, priority)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }))
  },
}))
