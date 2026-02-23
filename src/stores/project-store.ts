import { create } from 'zustand'
import type { Project } from '@/types'

interface ProjectStore {
  projects: Project[]
  activeProjectId: string | null
  setActiveProject: (id: string) => void
  addProject: (project: Project) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
  addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
}))
