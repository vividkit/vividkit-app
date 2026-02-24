import { create } from 'zustand'
import {
  createProject as createProjectCommand,
  deleteProject as deleteProjectCommand,
  listProjects,
  updateProject as updateProjectCommand,
  type CreateProjectArgs,
  type UpdateProjectArgs,
} from '@/lib/tauri'
import type { Project } from '@/types'

type ProjectInput = Pick<Project, 'name' | 'gitPath'> & Partial<Pick<Project, 'description'>>

interface ProjectStore {
  projects: Project[]
  activeProjectId: string | null
  loading: boolean
  initialized: boolean
  error: string | null
  loadProjects: () => Promise<void>
  setActiveProject: (id: string) => void
  addProject: (input: ProjectInput | Project) => Promise<Project | null>
  updateProject: (id: string, patch: Pick<UpdateProjectArgs, 'name' | 'description'>) => Promise<Project | null>
  removeProject: (id: string) => Promise<boolean>
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

function toCreateProjectArgs(input: ProjectInput | Project): CreateProjectArgs {
  return {
    name: input.name,
    description: input.description,
    gitPath: input.gitPath,
  }
}

function resolveActiveProjectId(projects: Project[], currentId: string | null): string | null {
  if (currentId && projects.some((project) => project.id === currentId)) {
    return currentId
  }
  return projects[0]?.id ?? null
}

function upsertProject(projects: Project[], next: Project): Project[] {
  const exists = projects.some((project) => project.id === next.id)
  if (exists) {
    return projects.map((project) => (project.id === next.id ? next : project))
  }
  return [next, ...projects]
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProjectId: null,
  loading: false,
  initialized: false,
  error: null,
  loadProjects: async () => {
    set({ loading: true, error: null })
    try {
      const projects = await listProjects()
      set((state) => ({
        projects,
        activeProjectId: resolveActiveProjectId(projects, state.activeProjectId),
        loading: false,
        initialized: true,
      }))
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, initialized: true, error: message })
      notifyError(message)
    }
  },
  setActiveProject: (id) => set({ activeProjectId: id }),
  addProject: async (input) => {
    set({ loading: true, error: null })
    try {
      const created = await createProjectCommand(toCreateProjectArgs(input))
      set((state) => ({
        projects: upsertProject(state.projects, created),
        activeProjectId: state.activeProjectId ?? created.id,
        loading: false,
      }))
      return created
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  updateProject: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const updated = await updateProjectCommand({ id, ...patch })
      set((state) => ({ projects: upsertProject(state.projects, updated), loading: false }))
      return updated
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  removeProject: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteProjectCommand(id)
      set((state) => {
        const projects = state.projects.filter((project) => project.id !== id)
        return {
          projects,
          activeProjectId: resolveActiveProjectId(projects, state.activeProjectId === id ? null : state.activeProjectId),
          loading: false,
        }
      })
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
