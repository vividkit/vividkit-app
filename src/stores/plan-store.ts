import { create } from 'zustand'
import {
  createPhase as createPhaseCommand,
  createPlan as createPlanCommand,
  deletePhase as deletePhaseCommand,
  deletePlan as deletePlanCommand,
  getPlan as getPlanCommand,
  listPlans,
  updatePhaseStatus as updatePhaseStatusCommand,
  type CreatePhaseArgs,
  type CreatePlanArgs,
} from '@/lib/tauri'
import type { Phase, PhaseStatus, Plan } from '@/types'

type PlanInput = Pick<Plan, 'deckId' | 'name'> & Partial<Pick<Plan, 'reportPath' | 'planPath' | 'phases'>>

type PhaseInput = Pick<CreatePhaseArgs, 'name' | 'order'> & Partial<Pick<CreatePhaseArgs, 'description' | 'filePath'>>

interface PlanStore {
  plans: Plan[]
  loading: boolean
  initialized: boolean
  error: string | null
  loadPlans: (deckId: string) => Promise<void>
  addPlan: (input: PlanInput | Plan) => Promise<Plan | null>
  removePlan: (id: string) => Promise<boolean>
  addPhase: (planId: string, input: PhaseInput) => Promise<Phase | null>
  updatePhaseStatus: (planId: string, phaseId: string, status: PhaseStatus) => Promise<Phase | null>
  removePhase: (planId: string, phaseId: string) => Promise<boolean>
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

function toCreatePlanArgs(input: PlanInput | Plan): CreatePlanArgs {
  return {
    deckId: input.deckId,
    name: input.name,
    reportPath: input.reportPath,
    planPath: input.planPath,
  }
}

function getInputPhases(input: PlanInput | Plan): Phase[] {
  return Array.isArray(input.phases) ? input.phases : []
}

function upsertPlan(plans: Plan[], next: Plan): Plan[] {
  const hasExisting = plans.some((plan) => plan.id === next.id)
  if (hasExisting) {
    return plans.map((plan) => (plan.id === next.id ? next : plan))
  }
  return [next, ...plans]
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  plans: [],
  loading: false,
  initialized: false,
  error: null,
  loadPlans: async (deckId) => {
    set({ loading: true, error: null })
    try {
      const plans = await listPlans(deckId)
      set({ plans, loading: false, initialized: true })
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, initialized: true, error: message })
      notifyError(message)
    }
  },
  addPlan: async (input) => {
    set({ loading: true, error: null })
    try {
      const createdPlan = await createPlanCommand(toCreatePlanArgs(input))
      const inputPhases = [...getInputPhases(input)].sort((a, b) => a.order - b.order)

      for (const phase of inputPhases) {
        const createdPhase = await createPhaseCommand({
          planId: createdPlan.id,
          name: phase.name,
          description: phase.description,
          filePath: phase.filePath,
          order: phase.order,
        })
        if (phase.status !== 'pending') {
          await updatePhaseStatusCommand(createdPhase.id, phase.status)
        }
      }

      const finalPlan = inputPhases.length > 0 ? await getPlanCommand(createdPlan.id) : createdPlan
      set((state) => ({ plans: upsertPlan(state.plans, finalPlan), loading: false }))
      return finalPlan
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  removePlan: async (id) => {
    set({ loading: true, error: null })
    try {
      await deletePlanCommand(id)
      set((state) => ({ plans: state.plans.filter((plan) => plan.id !== id), loading: false }))
      return true
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return false
    }
  },
  addPhase: async (planId, input) => {
    set({ loading: true, error: null })
    try {
      const phase = await createPhaseCommand({ planId, ...input })
      set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === planId
            ? { ...plan, phases: [...plan.phases, phase].sort((a, b) => a.order - b.order) }
            : plan,
        ),
        loading: false,
      }))
      return phase
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  updatePhaseStatus: async (planId, phaseId, status) => {
    set({ loading: true, error: null })
    try {
      const phase = await updatePhaseStatusCommand(phaseId, status)
      set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                phases: plan.phases.map((item) => (item.id === phaseId ? phase : item)),
              }
            : plan,
        ),
        loading: false,
      }))
      return phase
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  removePhase: async (planId, phaseId) => {
    set({ loading: true, error: null })
    try {
      await deletePhaseCommand(phaseId)
      set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === planId
            ? { ...plan, phases: plan.phases.filter((phase) => phase.id !== phaseId) }
            : plan,
        ),
        loading: false,
      }))
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
