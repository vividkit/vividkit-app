import { useEffect, useRef, useState, useCallback } from 'react'
import { listen } from '@tauri-apps/api/event'
import {
  spawnCcs,
  stopCcs,
  findNewSessionLog,
  resolveHomePath,
  createPlan,
  createPhases,
  type CcsRunEventPayload,
  type PhaseInput,
} from '@/lib/tauri'
import { useDeckStore } from '@/stores/deck-store'
import { useProjectStore } from '@/stores/project-store'

export function useGeneratePlan() {
  const mountedRef = useRef(true)
  const activeRunIdRef = useRef<string | null>(null)
  const isStartingRef = useRef(false)
  const stopRequestedRef = useRef(false)
  const pendingEventsRef = useRef<CcsRunEventPayload[]>([])

  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [exitCode, setExitCode] = useState<number | null>(null)
  const [sessionLogPath, setSessionLogPath] = useState<string | null>(null)
  const [streamKey, setStreamKey] = useState(0)
  const [listenerReady, setListenerReady] = useState(false)
  const [planId, setPlanId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const { activeDeckId } = useDeckStore()
  const activeProject = useProjectStore((s) => {
    const pid = s.activeProjectId
    return pid ? s.projects.find((p) => p.id === pid) : undefined
  })

  function setActiveRun(runId: string | null) {
    activeRunIdRef.current = runId
    setActiveRunId(runId)
  }

  function finishRun() {
    isStartingRef.current = false
    stopRequestedRef.current = false
    pendingEventsRef.current = []
    setIsRunning(false)
    setIsStopping(false)
    setActiveRun(null)
  }

  function handleRunEvent(payload: CcsRunEventPayload) {
    if (payload.kind === 'stdout' || payload.kind === 'stderr') return
    if (payload.kind === 'terminated') {
      setExitCode(payload.code ?? -1)
      finishRun()
      return
    }
    if (payload.kind === 'error') return
    finishRun()
  }

  useEffect(() => {
    mountedRef.current = true
    let dispose: (() => void) | null = null

    listen<CcsRunEventPayload>('ccs_run_event', (e) => {
      const runId = activeRunIdRef.current
      if (runId) {
        if (e.payload.run_id !== runId) return
        handleRunEvent(e.payload)
        return
      }
      if (isStartingRef.current) pendingEventsRef.current.push(e.payload)
    }).then((unlisten) => {
      if (!mountedRef.current) { unlisten(); return }
      dispose = unlisten
      setListenerReady(true)
    }).catch(() => {})

    return () => {
      mountedRef.current = false
      setListenerReady(false)
      const runId = activeRunIdRef.current
      if (runId) void stopCcs(runId).catch(() => {})
      activeRunIdRef.current = null
      isStartingRef.current = false
      pendingEventsRef.current = []
      dispose?.()
    }
  }, [])

  // After completion, create plan + phases in DB
  useEffect(() => {
    if (exitCode === null || exitCode !== 0 || planId || !activeDeckId) return
    setCurrentStep(1) // "Tasks" step

    async function savePlan() {
      try {
        const plan = await createPlan(activeDeckId!, 'Generated Plan')
        const defaultPhases: PhaseInput[] = [
          { name: 'Setup & Foundation', orderIndex: 1 },
          { name: 'Core Implementation', orderIndex: 2 },
          { name: 'UI Components', orderIndex: 3 },
          { name: 'Testing & Polish', orderIndex: 4 },
        ]
        await createPhases(plan.id, defaultPhases)
        setPlanId(plan.id)
      } catch (e) {
        console.error('[useGeneratePlan] savePlan:', e)
      }
    }

    void savePlan()
  }, [exitCode, planId, activeDeckId])

  const startGeneration = useCallback(async (profile: string, context?: string) => {
    if (!listenerReady || isRunning || !activeDeckId) return

    setIsRunning(true)
    setIsStopping(false)
    setExitCode(null)
    setActiveRun(null)
    setSessionLogPath(null)
    setPlanId(null)
    setCurrentStep(0)
    setStreamKey((k) => k + 1)
    isStartingRef.current = true
    stopRequestedRef.current = false
    pendingEventsRef.current = []

    try {
      const cwd = activeProject?.gitPath || '.'
      const command = context
        ? `/ck:plan ${context}`
        : '/ck:plan'
      const run = await spawnCcs({ profile, command, cwd })

      if (!mountedRef.current) {
        void stopCcs(run.run_id).catch(() => {})
        return
      }

      setActiveRun(run.run_id)

      if (stopRequestedRef.current) {
        stopRequestedRef.current = false
        isStartingRef.current = false
        void handleStop()
        return
      }

      isStartingRef.current = false
      const queued = pendingEventsRef.current
      pendingEventsRef.current = []
      queued.forEach((event) => {
        if (event.run_id === run.run_id) handleRunEvent(event)
      })

      const spawnTimeMs = Date.now()
      resolveHomePath('.claude/projects')
        .then((projectsDir) =>
          findNewSessionLog(projectsDir, cwd === '.' ? undefined : cwd, spawnTimeMs).then(
            (logPath) => {
              if (logPath && mountedRef.current) setSessionLogPath(logPath)
            },
          ),
        )
        .catch(() => {})
    } catch (e) {
      console.error('[useGeneratePlan] startGeneration error:', e)
      if (!mountedRef.current) return
      isStartingRef.current = false
      pendingEventsRef.current = []
      setIsRunning(false)
      setIsStopping(false)
      setActiveRun(null)
    }
  }, [listenerReady, isRunning, activeDeckId, activeProject?.gitPath])

  const handleStop = useCallback(async () => {
    const runId = activeRunIdRef.current
    if (isStopping) return
    if (!runId) { stopRequestedRef.current = true; return }
    setIsStopping(true)
    try {
      const result = await stopCcs(runId)
      if (result.already_stopped || result.stopped) {
        finishRun()
        setStreamKey((k) => k + 1)
      } else {
        setIsStopping(false)
      }
    } catch {
      setIsStopping(false)
    }
  }, [isStopping])

  const done = exitCode !== null && planId !== null

  return {
    isRunning,
    isStopping,
    exitCode,
    sessionLogPath,
    activeRunId,
    streamKey,
    listenerReady,
    planId,
    currentStep,
    done,
    startGeneration,
    stopGeneration: handleStop,
    ccsCwd: activeProject?.gitPath || '.',
  }
}
