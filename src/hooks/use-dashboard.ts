import { useState, useEffect, useCallback } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useDeckStore } from '@/stores/deck-store'
import { getDashboardStats, type DashboardStats } from '@/lib/tauri'

const EMPTY_STATS: DashboardStats = {
  activeTasks: 0,
  totalTasks: 0,
  doneTasks: 0,
  worktreeCount: 0,
  brainstormCount: 0,
}

export function useDashboard() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const activeDeckId = useDeckStore((s) => s.activeDeckId)
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getDashboardStats(activeDeckId, activeProjectId)
      setStats(result)
    } catch (e) {
      console.error('[useDashboard]', e)
      setStats(EMPTY_STATS)
    } finally {
      setLoading(false)
    }
  }, [activeProjectId, activeDeckId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { stats, loading, refresh }
}
