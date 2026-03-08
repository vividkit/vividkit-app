import { create } from 'zustand'
import { listPlansDb, type PlanWithProgress } from '@/lib/tauri'

interface PlanStore {
  plans: PlanWithProgress[]
  loaded: boolean
  loadPlans: (deckId: string) => Promise<void>
}

export const usePlanStore = create<PlanStore>((set) => ({
  plans: [],
  loaded: false,
  loadPlans: async (deckId: string) => {
    try {
      const plans = await listPlansDb(deckId)
      set({ plans, loaded: true })
    } catch (e) {
      console.error('[plan-store] loadPlans:', e)
      set({ loaded: true })
    }
  },
}))
