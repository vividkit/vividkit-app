import { create } from 'zustand'
import {
  createDeck as createDeckCommand,
  deleteDeck as deleteDeckCommand,
  listDecks,
  setActiveDeck as setActiveDeckCommand,
  updateDeck as updateDeckCommand,
  type CreateDeckArgs,
  type UpdateDeckArgs,
} from '@/lib/tauri'
import type { Deck } from '@/types'

type DeckInput = Pick<Deck, 'projectId' | 'name'> & Partial<Pick<Deck, 'description' | 'basedOnInsightId'>>

interface DeckStore {
  decks: Deck[]
  activeDeckId: string | null
  loading: boolean
  initialized: boolean
  error: string | null
  loadDecks: (projectId: string) => Promise<void>
  setActiveDeck: (id: string) => Promise<Deck | null>
  addDeck: (input: DeckInput | Deck) => Promise<Deck | null>
  updateDeck: (id: string, patch: Pick<UpdateDeckArgs, 'name' | 'description'>) => Promise<Deck | null>
  removeDeck: (id: string) => Promise<boolean>
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

function toCreateDeckArgs(input: DeckInput | Deck): CreateDeckArgs {
  return {
    projectId: input.projectId,
    name: input.name,
    description: input.description,
    basedOnInsightId: input.basedOnInsightId,
  }
}

function resolveActiveDeckId(decks: Deck[], currentId: string | null): string | null {
  const dbActive = decks.find((deck) => deck.isActive)
  if (dbActive) {
    return dbActive.id
  }
  if (currentId && decks.some((deck) => deck.id === currentId)) {
    return currentId
  }
  return decks[0]?.id ?? null
}

function upsertDeck(decks: Deck[], next: Deck): Deck[] {
  const exists = decks.some((deck) => deck.id === next.id)
  if (exists) {
    return decks.map((deck) => (deck.id === next.id ? next : deck))
  }
  return [next, ...decks]
}

export const useDeckStore = create<DeckStore>((set, get) => ({
  decks: [],
  activeDeckId: null,
  loading: false,
  initialized: false,
  error: null,
  loadDecks: async (projectId) => {
    set({ loading: true, error: null })
    try {
      const decks = await listDecks(projectId)
      set((state) => ({
        decks,
        activeDeckId: resolveActiveDeckId(decks, state.activeDeckId),
        loading: false,
        initialized: true,
      }))
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, initialized: true, error: message })
      notifyError(message)
    }
  },
  setActiveDeck: async (id) => {
    set({ loading: true, error: null })
    try {
      const activeDeck = await setActiveDeckCommand(id)
      set((state) => ({
        activeDeckId: activeDeck.id,
        decks: state.decks.map((deck) => ({ ...deck, isActive: deck.id === activeDeck.id })),
        loading: false,
      }))
      return activeDeck
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  addDeck: async (input) => {
    set({ loading: true, error: null })
    try {
      const created = await createDeckCommand(toCreateDeckArgs(input))
      set((state) => ({
        decks: upsertDeck(state.decks, created),
        activeDeckId: state.activeDeckId ?? created.id,
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
  updateDeck: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const updated = await updateDeckCommand({ id, ...patch })
      set((state) => ({ decks: upsertDeck(state.decks, updated), loading: false }))
      return updated
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  removeDeck: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteDeckCommand(id)
      set((state) => {
        const decks = state.decks.filter((deck) => deck.id !== id)
        return {
          decks,
          activeDeckId: resolveActiveDeckId(decks, state.activeDeckId === id ? null : state.activeDeckId),
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
