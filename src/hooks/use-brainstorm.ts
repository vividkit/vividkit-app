import { useEffect, useRef, useState, useCallback } from 'react'
import { listen } from '@tauri-apps/api/event'
import {
  spawnCcs,
  stopCcs,
  findNewSessionLog,
  resolveHomePath,
  createBrainstormSession,
  updateBrainstormSession,
  extractReportPathFromJsonl,
  type CcsRunEventPayload,
} from '@/lib/tauri'
import { useDeckStore } from '@/stores/deck-store'
import { useProjectStore } from '@/stores/project-store'

export function useBrainstorm() {
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
  const [reportPath, setReportPath] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [streamKey, setStreamKey] = useState(0)
  const [listenerReady, setListenerReady] = useState(false)

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

  // Setup event listener
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

  // Mark session completed and extract report path when run terminates
  useEffect(() => {
    if (exitCode === null || !sessionId) return
    updateBrainstormSession(sessionId, 'completed').catch((e) =>
      console.error('[useBrainstorm] update session status:', e),
    )
    // Extract brainstorm report path from JSONL after session ends
    const logPath = sessionLogPath
    if (!logPath) return
    extractReportPathFromJsonl(logPath)
      .then((path) => {
        if (path && mountedRef.current) {
          setReportPath(path)
          updateBrainstormSession(sessionId, undefined, undefined, path).catch((e) =>
            console.error('[useBrainstorm] update report path:', e),
          )
        }
      })
      .catch((e) => console.error('[useBrainstorm] extract report path:', e))
  }, [exitCode, sessionId, sessionLogPath])

  const startSession = useCallback(async (profile: string, prompt: string) => {
    if (!listenerReady || isRunning || !activeDeckId) {
      console.warn('[useBrainstorm] not ready:', { listenerReady, isRunning, activeDeckId })
      return
    }

    setIsRunning(true)
    setIsStopping(false)
    setExitCode(null)
    setActiveRun(null)
    setSessionLogPath(null)
    setReportPath(null)
    setStreamKey((k) => k + 1)
    isStartingRef.current = true
    stopRequestedRef.current = false
    pendingEventsRef.current = []

    try {
      // Create DB record first
      const session = await createBrainstormSession(activeDeckId, prompt)
      setSessionId(session.id)

      const cwd = activeProject?.gitPath || '.'
      const command = `/ck:brainstorm ${prompt}`
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

      // Find session log
      const spawnTimeMs = Date.now()
      resolveHomePath('.claude/projects')
        .then((projectsDir) =>
          findNewSessionLog(projectsDir, cwd === '.' ? undefined : cwd, spawnTimeMs).then(
            (logPath) => {
              if (logPath && mountedRef.current) {
                setSessionLogPath(logPath)
                updateBrainstormSession(session.id, undefined, logPath).catch((e) =>
                  console.error('[useBrainstorm] update session log path:', e),
                )
              }
            },
          ),
        )
        .catch(() => {})
    } catch (e) {
      console.error('[useBrainstorm] startSession error:', e)
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

  const status = isRunning ? 'running' : exitCode !== null ? 'completed' : 'idle'

  return {
    status: status as 'idle' | 'running' | 'completed',
    isRunning,
    isStopping,
    exitCode,
    sessionLogPath,
    reportPath,
    activeRunId,
    streamKey,
    listenerReady,
    startSession,
    stopSession: handleStop,
    ccsCwd: activeProject?.gitPath || '.',
  }
}
