import { create } from 'zustand'
import type { Deck } from '@/types'

interface DeckStore {
  decks: Deck[]
  activeDeckId: string | null
  setActiveDeck: (id: string) => void
  addDeck: (deck: Deck) => void
}

export const useDeckStore = create<DeckStore>((set) => ({
  decks: [],
  activeDeckId: null,
  setActiveDeck: (id) => set((s) => ({
    activeDeckId: id,
    decks: s.decks.map((d) => ({ ...d, isActive: d.id === id })),
  })),
  addDeck: (deck) => set((s) => ({ decks: [...s.decks, deck] })),
}))
