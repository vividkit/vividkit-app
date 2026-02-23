import { create } from 'zustand'
import type { Plan, PhaseStatus } from '@/types'

interface PlanStore {
  plans: Plan[]
  addPlan: (plan: Plan) => void
  updatePhaseStatus: (planId: string, phaseId: string, status: PhaseStatus) => void
}

export const usePlanStore = create<PlanStore>((set) => ({
  plans: [],
  addPlan: (plan) => set((s) => ({ plans: [...s.plans, plan] })),
  updatePhaseStatus: (planId, phaseId, status) =>
    set((s) => ({
      plans: s.plans.map((p) =>
        p.id === planId
          ? { ...p, phases: p.phases.map((ph) => (ph.id === phaseId ? { ...ph, status } : ph)) }
          : p
      ),
    })),
}))
