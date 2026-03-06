import { useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  findNewSessionLog,
  resolveHomePath,
  spawnCcs,
  stopCcs,
  type CcsRunEventPayload,
} from '@/lib/tauri'
import { StreamView } from '@/components/ccs-stream'

const PROFILES = ['default', 'glm', 'gemini', 'kimi', 'codex']
const DEFAULT_COMMAND = '/ck:brainstorm write a todo app'
const DEFAULT_RELATIVE_CWD = 'projects/solo-builder/vividkit-workspace/vividkit-testing'

export function CcsTestConsole() {
  const { t } = useTranslation()
  const mountedRef = useRef(true)
  const activeRunIdRef = useRef<string | null>(null)
  const isStartingRef = useRef(false)
  const stopRequestedRef = useRef(false)
  const pendingEventsRef = useRef<CcsRunEventPayload[]>([])
  const [profile, setProfile] = useState('default')
  const [command, setCommand] = useState(DEFAULT_COMMAND)
  const [cwd, setCwd] = useState('')
  const [listenerReady, setListenerReady] = useState(false)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [exitCode, setExitCode] = useState<number | null>(null)
  const [sessionLogPath, setSessionLogPath] = useState<string | null>(null)
  const [streamKey, setStreamKey] = useState(0)

  function setActiveRun(runId: string | null) { activeRunIdRef.current = runId; setActiveRunId(runId) }
  function finishRun() {
    isStartingRef.current = false
    stopRequestedRef.current = false
    pendingEventsRef.current = []
    setIsRunning(false)
    setIsStopping(false)
    setActiveRun(null)
    // Keep sessionLogPath so StreamView continues showing session history after terminate
  }
  function handleRunEvent(payload: CcsRunEventPayload) {
    if (payload.kind === 'stdout' || payload.kind === 'stderr') return
    if (payload.kind === 'terminated') { setExitCode(payload.code ?? -1); finishRun(); return }
    // Reader can emit transient PTY errors while run is still alive.
    // Do not teardown run state on non-termination error events.
    if (payload.kind === 'error') return
    finishRun()
  }

  useEffect(() => { resolveHomePath(DEFAULT_RELATIVE_CWD).then(setCwd).catch(() => {}) }, [])

  useEffect(() => {
    mountedRef.current = true
    let mounted = true
    let dispose: (() => void) | null = null

    listen<CcsRunEventPayload>('ccs_run_event', (e) => {
      const runId = activeRunIdRef.current
      if (runId) { if (e.payload.run_id !== runId) return; handleRunEvent(e.payload); return }
      if (isStartingRef.current) pendingEventsRef.current.push(e.payload)
    }).then((unlisten) => {
      if (!mounted) { unlisten(); return }
      dispose = unlisten
      setListenerReady(true)
    }).catch(() => {})

    return () => {
      mounted = false
      mountedRef.current = false
      setListenerReady(false)
      const runId = activeRunIdRef.current
      if (runId) void stopCcs(runId).catch(() => {})
      activeRunIdRef.current = null
      isStartingRef.current = false
      stopRequestedRef.current = false
      pendingEventsRef.current = []
      setActiveRunId(null)
      setIsRunning(false)
      setIsStopping(false)
      dispose?.()
    }
  }, [])

  async function handleRun() {
    if (!listenerReady || isRunning) return
    setIsRunning(true); setIsStopping(false); setExitCode(null); setActiveRun(null); setSessionLogPath(null)
    isStartingRef.current = true; stopRequestedRef.current = false; pendingEventsRef.current = []
    try {
      const run = await spawnCcs({ profile, command, cwd: cwd || '.' })
      if (!mountedRef.current) { void stopCcs(run.run_id).catch(() => {}); return }
      setActiveRun(run.run_id)
      if (stopRequestedRef.current) { stopRequestedRef.current = false; isStartingRef.current = false; void handleStop(); return }
      isStartingRef.current = false
      const queued = pendingEventsRef.current; pendingEventsRef.current = []
      queued.forEach((event) => { if (event.run_id === run.run_id) handleRunEvent(event) })
      const spawnTimeMs = Date.now()
      resolveHomePath('.claude/projects').then((projectsDir) =>
        findNewSessionLog(projectsDir, cwd || undefined, spawnTimeMs).then((logPath) => {
          if (logPath && mountedRef.current) setSessionLogPath(logPath)
        })
      ).catch(() => {})
    } catch {
      if (!mountedRef.current) return
      isStartingRef.current = false; pendingEventsRef.current = []
      setIsRunning(false); setIsStopping(false); setActiveRun(null)
    }
  }

  async function handleStop() {
    const runId = activeRunIdRef.current
    if (isStopping) return
    if (!runId) { stopRequestedRef.current = true; return }
    setIsStopping(true)
    try {
      const result = await stopCcs(runId)
      if (result.already_stopped || result.stopped) {
        finishRun()
        setStreamKey(k => k + 1)
      } else {
        setIsStopping(false)
      }
    } catch {
      setIsStopping(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Controls */}
      <div className="grid grid-cols-1 gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <label className="w-16 shrink-0 text-xs font-medium">{t('settings.ccsTest.profile')}</label>
          <Select value={profile} onValueChange={setProfile}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{PROFILES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="w-16 shrink-0 text-xs font-medium">{t('settings.ccsTest.command')}</label>
          <Input value={command} onChange={(e) => setCommand(e.target.value)} placeholder={t('settings.ccsTest.commandPlaceholder')} className="flex-1 font-mono text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-16 shrink-0 text-xs font-medium">{t('settings.ccsTest.cwd')}</label>
          <Input value={cwd} onChange={(e) => setCwd(e.target.value)} placeholder={t('settings.ccsTest.cwdPlaceholder')} className="flex-1 font-mono text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleRun} disabled={isRunning || !listenerReady}>{t('common.actions.run')}</Button>
          <Button size="sm" variant="outline" onClick={handleStop} disabled={!isRunning || isStopping}>
            {isStopping ? t('settings.ccsTest.stopping') : t('common.actions.stop')}
          </Button>
          {activeRunId && <Badge variant="outline" className="font-mono text-xs">{activeRunId}</Badge>}
          {exitCode !== null && (
            <Badge variant={exitCode === 0 ? 'outline' : 'destructive'} className="text-xs">
              {t('settings.ccsTest.exit', { code: exitCode })}
            </Badge>
          )}
        </div>
      </div>

      {/* Stream output — always visible */}
      <div className="h-[65vh] min-h-[480px] max-h-[760px] border border-border rounded-lg overflow-hidden">
        <StreamView
          key={streamKey}
          sessionLogPath={sessionLogPath ?? undefined}
          isRunning={isRunning}
          exitCode={exitCode}
          activeRunId={activeRunId}
          ccsCwd={cwd}
        />
      </div>
    </div>
  )
}
