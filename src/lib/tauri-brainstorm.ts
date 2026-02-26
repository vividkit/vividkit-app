import { invoke } from '@tauri-apps/api/core'
import type { BrainstormSession, KeyInsight } from '@/types'

export interface CreateBrainstormSessionArgs extends Record<string, unknown> {
  deckId: string
  prompt: string
}

export interface UpdateBrainstormSessionArgs extends Record<string, unknown> {
  id: string
  status?: BrainstormSession['status']
  reportPath?: string
}

export interface CreateKeyInsightArgs extends Record<string, unknown> {
  projectId: string
  deckId: string
  title: string
  reportPath: string
}

export async function createBrainstormSession(args: CreateBrainstormSessionArgs): Promise<BrainstormSession> {
  return invoke<BrainstormSession>('create_brainstorm_session', args)
}

export async function listBrainstormSessions(deckId: string): Promise<BrainstormSession[]> {
  return invoke<BrainstormSession[]>('list_brainstorm_sessions', { deckId })
}

export async function updateBrainstormSession(args: UpdateBrainstormSessionArgs): Promise<BrainstormSession> {
  return invoke<BrainstormSession>('update_brainstorm_session', args)
}

export async function createKeyInsight(args: CreateKeyInsightArgs): Promise<KeyInsight> {
  return invoke<KeyInsight>('create_key_insight', args)
}

export async function listKeyInsights(deckId: string): Promise<KeyInsight[]> {
  return invoke<KeyInsight[]>('list_key_insights', { deckId })
}

export async function deleteKeyInsight(id: string): Promise<void> {
  return invoke<void>('delete_key_insight', { id })
}
