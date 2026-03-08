import { useState, useEffect, useCallback } from 'react'
import { getPlan, updatePhaseStatus, readPlanFile, type PlanWithPhases } from '@/lib/tauri'

export function usePlanReview(planId: string | undefined) {
  const [data, setData] = useState<PlanWithPhases | null>(null)
  const [loading, setLoading] = useState(false)
  const [planContent, setPlanContent] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!planId) return
    setLoading(true)
    try {
      const result = await getPlan(planId)
      setData(result)
      // Load plan.md content if path exists
      if (result?.plan.planPath) {
        readPlanFile(result.plan.planPath)
          .then(setPlanContent)
          .catch(() => setPlanContent(null))
      }
    } catch (e) {
      console.error('[usePlanReview] load:', e)
    } finally {
      setLoading(false)
    }
  }, [planId])

  useEffect(() => { void load() }, [load])

  const togglePhase = useCallback(async (phaseId: string, currentStatus: string) => {
    const done = currentStatus !== 'done'
    try {
      await updatePhaseStatus(phaseId, done)
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          phases: prev.phases.map((p) =>
            p.id === phaseId ? { ...p, status: done ? 'done' : 'pending' } : p,
          ),
        }
      })
    } catch (e) {
      console.error('[usePlanReview] togglePhase:', e)
    }
  }, [])

  return { data, loading, planContent, togglePhase, reload: load }
}
