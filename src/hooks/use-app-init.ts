import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useSettingsStore } from '@/stores/settings-store'

interface AppInitState {
  ready: boolean
  error: string | null
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function redirectToOnboardingIfNeeded(projectCount: number): void {
  if (typeof window === 'undefined' || projectCount > 0) {
    return
  }

  if (window.location.pathname !== '/onboarding') {
    window.history.replaceState(window.history.state, '', '/onboarding')
  }
}

export function useAppInit(): AppInitState {
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const loadProjects = useProjectStore((state) => state.loadProjects)
  const setActiveProject = useProjectStore((state) => state.setActiveProject)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)

  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isBootingRef = useRef(true)
  const lastPersistAttemptRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init(): Promise<void> {
      setReady(false)
      setError(null)
      isBootingRef.current = true

      try {
        const settings = await loadSettings()
        if (!settings) {
          throw new Error(useSettingsStore.getState().error ?? 'Failed to load settings')
        }

        await loadProjects()
        const projectState = useProjectStore.getState()
        if (projectState.error) {
          throw new Error(projectState.error)
        }

        const savedProjectId = settings.lastActiveProjectId ?? null
        const matchedProject = savedProjectId
          ? projectState.projects.find((project) => project.id === savedProjectId)
          : null
        const fallbackProjectId = projectState.projects[0]?.id ?? null

        if (matchedProject) {
          setActiveProject(matchedProject.id)
        }

        if (savedProjectId && !matchedProject) {
          await updateSettings({ lastActiveProjectId: fallbackProjectId })
        }

        if (cancelled) {
          return
        }

        lastPersistAttemptRef.current = useSettingsStore.getState().settings.lastActiveProjectId ?? null
        redirectToOnboardingIfNeeded(projectState.projects.length)
        isBootingRef.current = false
        setReady(true)
      } catch (initError) {
        if (cancelled) {
          return
        }

        isBootingRef.current = false
        setError(toErrorMessage(initError))
      }
    }

    void init()

    return () => {
      cancelled = true
    }
  }, [loadProjects, loadSettings, setActiveProject, updateSettings])

  useEffect(() => {
    if (!ready || isBootingRef.current) {
      return
    }

    const nextProjectId = activeProjectId ?? null
    const persistedProjectId = useSettingsStore.getState().settings.lastActiveProjectId ?? null

    if (nextProjectId === persistedProjectId || nextProjectId === lastPersistAttemptRef.current) {
      return
    }

    lastPersistAttemptRef.current = nextProjectId
    void updateSettings({ lastActiveProjectId: nextProjectId })
  }, [activeProjectId, ready, updateSettings])

  return { ready, error }
}
