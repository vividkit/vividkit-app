import { invoke } from '@tauri-apps/api/core'
import type { Project } from '@/types'

export interface CreateProjectArgs extends Record<string, unknown> {
  name: string
  description?: string
  gitPath: string
}

export interface UpdateProjectArgs extends Record<string, unknown> {
  id: string
  name?: string
  description?: string
}

export async function createProject(args: CreateProjectArgs): Promise<Project> {
  return invoke<Project>('create_project', args)
}

export async function listProjects(): Promise<Project[]> {
  return invoke<Project[]>('list_projects')
}

export async function getProject(id: string): Promise<Project> {
  return invoke<Project>('get_project', { id })
}

export async function updateProject(args: UpdateProjectArgs): Promise<Project> {
  return invoke<Project>('update_project', args)
}

export async function deleteProject(id: string): Promise<void> {
  return invoke<void>('delete_project', { id })
}
