import { create } from 'zustand'
import {
  createTask as createTaskCommand,
  deleteTask as deleteTaskCommand,
  listTasks,
  updateTask as updateTaskCommand,
  updateTaskStatus as updateTaskStatusCommand,
  type CreateTaskArgs,
  type UpdateTaskArgs,
} from '@/lib/tauri'
import type { Task, TaskStatus } from '@/types'

type TaskInput = Pick<Task, 'deckId' | 'name'> & Partial<Pick<Task, 'description' | 'priority' | 'type' | 'status'>>

interface TaskStore {
  tasks: Task[]
  loading: boolean
  initialized: boolean
  error: string | null
  loadTasks: (deckId: string) => Promise<void>
  addTask: (input: TaskInput | Task) => Promise<Task | null>
  updateStatus: (id: string, status: TaskStatus) => Promise<Task | null>
  updateTask: (id: string, patch: Pick<UpdateTaskArgs, 'name' | 'description' | 'priority' | 'status'>) => Promise<Task | null>
  removeTask: (id: string) => Promise<boolean>
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

function toCreateTaskArgs(input: TaskInput | Task): CreateTaskArgs {
  return {
    deckId: input.deckId,
    name: input.name,
    description: input.description,
    priority: input.priority,
    type: input.type,
  }
}

function upsertTask(tasks: Task[], next: Task): Task[] {
  const exists = tasks.some((task) => task.id === next.id)
  if (exists) {
    return tasks.map((task) => (task.id === next.id ? next : task))
  }
  return [next, ...tasks]
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  initialized: false,
  error: null,
  loadTasks: async (deckId) => {
    set({ loading: true, error: null })
    try {
      const tasks = await listTasks(deckId)
      set({ tasks, loading: false, initialized: true })
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, initialized: true, error: message })
      notifyError(message)
    }
  },
  addTask: async (input) => {
    set({ loading: true, error: null })
    try {
      let created = await createTaskCommand(toCreateTaskArgs(input))
      if (input.status && input.status !== created.status) {
        created = await updateTaskStatusCommand(created.id, input.status)
      }
      set((state) => ({ tasks: upsertTask(state.tasks, created), loading: false }))
      return created
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  updateStatus: async (id, status) => {
    set({ loading: true, error: null })
    try {
      const updated = await updateTaskStatusCommand(id, status)
      set((state) => ({ tasks: upsertTask(state.tasks, updated), loading: false }))
      return updated
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  updateTask: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const updated = await updateTaskCommand({ id, ...patch })
      set((state) => ({ tasks: upsertTask(state.tasks, updated), loading: false }))
      return updated
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  removeTask: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteTaskCommand(id)
      set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id), loading: false }))
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
