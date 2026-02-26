import { invoke } from '@tauri-apps/api/core'
import type { Phase, PhaseStatus, Plan } from '@/types'

export interface CreatePlanArgs extends Record<string, unknown> {
  deckId: string
  name: string
  reportPath?: string
  planPath?: string
}

export interface CreatePhaseArgs extends Record<string, unknown> {
  planId: string
  name: string
  description?: string
  filePath?: string
  order: number
}

export async function createPlan(args: CreatePlanArgs): Promise<Plan> {
  return invoke<Plan>('create_plan', args)
}

export async function listPlans(deckId: string): Promise<Plan[]> {
  return invoke<Plan[]>('list_plans', { deckId })
}

export async function getPlan(id: string): Promise<Plan> {
  return invoke<Plan>('get_plan', { id })
}

export async function deletePlan(id: string): Promise<void> {
  return invoke<void>('delete_plan', { id })
}

export async function createPhase(args: CreatePhaseArgs): Promise<Phase> {
  return invoke<Phase>('create_phase', args)
}

export async function updatePhaseStatus(id: string, status: PhaseStatus): Promise<Phase> {
  return invoke<Phase>('update_phase_status', { id, status })
}

export async function deletePhase(id: string): Promise<void> {
  return invoke<void>('delete_phase', { id })
}
