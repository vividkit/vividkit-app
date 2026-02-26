import { invoke } from '@tauri-apps/api/core'
import type { Deck } from '@/types'

export interface CreateDeckArgs extends Record<string, unknown> {
  projectId: string
  name: string
  description?: string
  basedOnInsightId?: string
}

export interface UpdateDeckArgs extends Record<string, unknown> {
  id: string
  name?: string
  description?: string
}

export async function createDeck(args: CreateDeckArgs): Promise<Deck> {
  return invoke<Deck>('create_deck', args)
}

export async function listDecks(projectId: string): Promise<Deck[]> {
  return invoke<Deck[]>('list_decks', { projectId })
}

export async function setActiveDeck(id: string): Promise<Deck> {
  return invoke<Deck>('set_active_deck', { id })
}

export async function updateDeck(args: UpdateDeckArgs): Promise<Deck> {
  return invoke<Deck>('update_deck', args)
}

export async function deleteDeck(id: string): Promise<void> {
  return invoke<void>('delete_deck', { id })
}
