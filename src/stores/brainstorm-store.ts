import { create } from 'zustand'
import type { BrainstormSession } from '@/types'
import { listBrainstormSessions } from '@/lib/tauri'

interface BrainstormStore {
  sessions: BrainstormSession[]
  loaded: boolean
  loadSessions: (deckId: string) => Promise<void>
}

export const useBrainstormStore = create<BrainstormStore>((set) => ({
  sessions: [],
  loaded: false,
  loadSessions: async (deckId: string) => {
    try {
      const sessions = await listBrainstormSessions(deckId)
      set({ sessions, loaded: true })
    } catch (e) {
      console.error('[brainstorm-store] loadSessions:', e)
      set({ loaded: true })
    }
  },
}))
