import { useState, useEffect, useCallback } from 'react'
import { listKeyInsights, createKeyInsight, deleteKeyInsight } from '@/lib/tauri'
import { useDeckStore } from '@/stores/deck-store'
import { useProjectStore } from '@/stores/project-store'
import type { KeyInsight } from '@/types'

export function useKeyInsights() {
  const [insights, setInsights] = useState<KeyInsight[]>([])
  const [loading, setLoading] = useState(false)
  const { activeDeckId } = useDeckStore()
  const { activeProjectId } = useProjectStore()

  const load = useCallback(async () => {
    if (!activeDeckId) return
    setLoading(true)
    try {
      const result = await listKeyInsights(activeDeckId)
      setInsights(result)
    } catch (e) {
      console.error('[useKeyInsights] load:', e)
    } finally {
      setLoading(false)
    }
  }, [activeDeckId])

  useEffect(() => { void load() }, [load])

  const addInsight = useCallback(async (title: string, reportPath: string) => {
    if (!activeProjectId || !activeDeckId) return
    try {
      const insight = await createKeyInsight(activeProjectId, activeDeckId, title, reportPath)
      setInsights((prev) => [insight, ...prev])
      return insight
    } catch (e) {
      console.error('[useKeyInsights] create:', e)
    }
  }, [activeProjectId, activeDeckId])

  const removeInsight = useCallback(async (id: string) => {
    try {
      await deleteKeyInsight(id)
      setInsights((prev) => prev.filter((i) => i.id !== id))
    } catch (e) {
      console.error('[useKeyInsights] delete:', e)
    }
  }, [])

  return { insights, loading, addInsight, removeInsight, reload: load }
}
