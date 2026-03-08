import { create } from 'zustand'
import type { Deck } from '@/types'
import {
  listDecks,
  createDeck as createDeckApi,
  setActiveDeck as setActiveDeckApi,
  deleteDeck as deleteDeckApi,
} from '@/lib/tauri'

interface DeckStore {
  decks: Deck[]
  activeDeckId: string | null
  loaded: boolean
  loadDecks: (projectId: string) => Promise<void>
  createDeck: (projectId: string, name: string, desc?: string, insightId?: string, setActive?: boolean) => Promise<Deck>
  setActiveDeck: (projectId: string, deckId: string) => Promise<void>
  deleteDeck: (id: string) => Promise<void>
  resetDecks: () => void
}

export const useDeckStore = create<DeckStore>((set) => ({
  decks: [],
  activeDeckId: null,
  loaded: false,

  resetDecks: () => set({ decks: [], activeDeckId: null, loaded: false }),

  loadDecks: async (projectId: string) => {
    try {
      const decks = await listDecks(projectId)
      const active = decks.find((d) => d.isActive)
      set({ decks, activeDeckId: active?.id ?? null, loaded: true })
    } catch (e) {
      console.error('[loadDecks]', e)
      set({ loaded: true })
    }
  },

  createDeck: async (projectId, name, desc, insightId, setActive) => {
    const deck = await createDeckApi(projectId, name, desc, insightId, setActive)
    set((s) => ({
      decks: [...s.decks, deck],
      activeDeckId: setActive ? deck.id : s.activeDeckId,
    }))
    return deck
  },

  setActiveDeck: async (projectId, deckId) => {
    await setActiveDeckApi(projectId, deckId)
    set((s) => ({
      activeDeckId: deckId,
      decks: s.decks.map((d) => ({ ...d, isActive: d.id === deckId })),
    }))
  },

  deleteDeck: async (id) => {
    await deleteDeckApi(id)
    set((s) => {
      const remaining = s.decks.filter((d) => d.id !== id)
      let activeDeckId = s.activeDeckId
      if (activeDeckId === id) {
        activeDeckId = remaining.find((d) => d.isActive)?.id ?? remaining[0]?.id ?? null
      }
      return { decks: remaining, activeDeckId }
    })
  },
}))
