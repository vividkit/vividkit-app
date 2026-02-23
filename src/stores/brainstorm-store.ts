import { create } from 'zustand'
import type { BrainstormSession, KeyInsight } from '@/types'

interface BrainstormStore {
  sessions: BrainstormSession[]
  insights: KeyInsight[]
  addSession: (session: BrainstormSession) => void
  addInsight: (insight: KeyInsight) => void
}

export const useBrainstormStore = create<BrainstormStore>((set) => ({
  sessions: [],
  insights: [],
  addSession: (session) => set((s) => ({ sessions: [...s.sessions, session] })),
  addInsight: (insight) => set((s) => ({ insights: [...s.insights, insight] })),
}))
