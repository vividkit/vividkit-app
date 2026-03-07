import { create } from 'zustand'
import type { Project } from '@/types'
import { listProjects } from '@/lib/tauri'

interface ProjectStore {
  projects: Project[]
  activeProjectId: string | null
  loaded: boolean
  setActiveProject: (id: string) => void
  addProject: (project: Project) => void
  loadProjects: () => Promise<void>
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProjectId: null,
  loaded: false,
  setActiveProject: (id) => set({ activeProjectId: id }),
  addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
  loadProjects: async () => {
    if (get().loaded) return
    try {
      const projects = await listProjects()
      set({
        projects,
        activeProjectId: projects.length > 0 ? projects[0].id : null,
        loaded: true,
      })
    } catch (e) {
      console.error('[loadProjects]', e)
      set({ loaded: true })
    }
  },
}))
