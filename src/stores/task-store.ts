import { create } from 'zustand'
import type { Task, TaskStatus } from '@/types'

interface TaskStore {
  tasks: Task[]
  addTask: (task: Task) => void
  updateStatus: (id: string, status: TaskStatus) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateStatus: (id, status) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) })),
}))
