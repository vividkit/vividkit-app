import { useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { resolveHomePath, spawnCcs, stopCcs, type CcsRunEventPayload } from '@/lib/tauri'
const PROFILES = ['default', 'glm', 'gemini', 'kimi', 'codex']
const DEFAULT_COMMAND = '/brainstorm write a todo app'
const DEFAULT_RELATIVE_CWD = 'projects/solo-builder/vividkit-workspace/vividkit-testing'
export function CcsTestConsole() {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const mountedRef = useRef(true)
  const activeRunIdRef = useRef<string | null>(null)
  const isStartingRef = useRef(false)
  const pendingEventsRef = useRef<CcsRunEventPayload[]>([])
  const [profile, setProfile] = useState('default')
  const [command, setCommand] = useState(DEFAULT_COMMAND)
  const [cwd, setCwd] = useState('')
  const [listenerReady, setListenerReady] = useState(false)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [exitCode, setExitCode] = useState<number | null>(null)
  function setActiveRun(runId: string | null) {
    activeRunIdRef.current = runId
    setActiveRunId(runId)
  }
  function finishRun() {
    isStartingRef.current = false
    pendingEventsRef.current = []
    setIsRunning(false)
    setIsStopping(false)
    setActiveRun(null)
  }
  function handleRunEvent(payload: CcsRunEventPayload) {
    if (payload.kind === 'stdout' || payload.kind === 'stderr') {
      if (payload.chunk) termRef.current?.write(payload.chunk)
      return
    }
    if (payload.kind === 'terminated') {
      const code = payload.code ?? -1
      setExitCode(code)
      termRef.current?.writeln(`\r\n\x1b[33mProcess exited with code ${code}\x1b[0m`)
      finishRun()
      return
    }
    termRef.current?.writeln(`\r\n\x1b[31mRun error: ${payload.message ?? 'Unknown error'}\x1b[0m`)
    finishRun()
  }
  useEffect(() => {
    resolveHomePath(DEFAULT_RELATIVE_CWD).then(setCwd).catch(() => {})
  }, [])
  useEffect(() => {
    if (!containerRef.current) return
    const term = new Terminal({
      theme: { background: '#0d0d0d', foreground: '#d4d4d4' },
      fontSize: 13,
      cursorBlink: true,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    term.writeln('\x1b[36mCCS Test Console ready.\x1b[0m')
    termRef.current = term
    let mounted = true
    let dispose: (() => void) | null = null
    listen<CcsRunEventPayload>('ccs_run_event', (e) => {
      const runId = activeRunIdRef.current
      if (runId) {
        if (e.payload.run_id !== runId) return
        handleRunEvent(e.payload)
        return
      }
      if (isStartingRef.current) pendingEventsRef.current.push(e.payload)
    })
      .then((unlisten) => {
        if (!mounted) {
          unlisten()
          return
        }
        dispose = unlisten
        setListenerReady(true)
      })
      .catch((error) => {
        termRef.current?.writeln(`\r\n\x1b[31mListener error: ${String(error)}\x1b[0m`)
      })
    return () => {
      mounted = false
      mountedRef.current = false
      setListenerReady(false)
      const runId = activeRunIdRef.current
      if (runId) void stopCcs(runId).catch(() => {})
      activeRunIdRef.current = null
      isStartingRef.current = false
      pendingEventsRef.current = []
      setActiveRunId(null)
      setIsRunning(false)
      setIsStopping(false)
      dispose?.()
      term.dispose()
      termRef.current = null
    }
  }, [])
  async function handleRun() {
    if (!termRef.current || !listenerReady || isRunning) return
    setIsRunning(true)
    setIsStopping(false)
    setExitCode(null)
    setActiveRun(null)
    isStartingRef.current = true
    pendingEventsRef.current = []
    termRef.current.clear()
    termRef.current.writeln(`\x1b[33m$ ccs ${profile} "${command}"\x1b[0m\r\n`)
    if (cwd) termRef.current.writeln(`\x1b[90mcwd: ${cwd}\x1b[0m\r\n`)
    try {
      const run = await spawnCcs({ profile, command, cwd: cwd || '.' })
      if (!mountedRef.current) { void stopCcs(run.run_id).catch(() => {}); return }
      setActiveRun(run.run_id)
      isStartingRef.current = false
      const pidText = run.pid === null ? '' : ` (pid ${run.pid})`
      termRef.current.writeln(`\x1b[90mrun_id: ${run.run_id}${pidText}\x1b[0m\r\n`)
      const queued = pendingEventsRef.current
      pendingEventsRef.current = []
      queued.forEach((event) => {
        if (event.run_id === run.run_id) handleRunEvent(event)
      })
    } catch (error) {
      if (!mountedRef.current) return
      isStartingRef.current = false
      pendingEventsRef.current = []
      termRef.current.writeln(`\r\n\x1b[31mError: ${String(error)}\x1b[0m`)
      setIsRunning(false)
      setIsStopping(false)
      setActiveRun(null)
    }
  }
  async function handleStop() {
    const runId = activeRunIdRef.current
    if (!runId || !isRunning || isStopping) return
    setIsStopping(true)
    termRef.current?.writeln(`\r\n\x1b[33mStopping run ${runId}...\x1b[0m`)
    try {
      const result = await stopCcs(runId)
      if (result.already_stopped) {
        finishRun(); termRef.current?.writeln('\r\n\x1b[33mRun was already stopped.\x1b[0m'); return
      }
      if (!result.stopped) {
        setIsStopping(false)
        termRef.current?.writeln('\r\n\x1b[31mStop request failed.\x1b[0m')
      }
    } catch (error) {
      setIsStopping(false)
      termRef.current?.writeln(`\r\n\x1b[31mStop error: ${String(error)}\x1b[0m`)
    }
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center gap-2">
          <label className="w-16 shrink-0 text-xs font-medium">Profile</label>
          <Select value={profile} onValueChange={setProfile}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{PROFILES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="w-16 shrink-0 text-xs font-medium">Command</label>
          <Input value={command} onChange={(e) => setCommand(e.target.value)} className="flex-1 font-mono text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-16 shrink-0 text-xs font-medium">CWD</label>
          <Input value={cwd} onChange={(e) => setCwd(e.target.value)} placeholder="/path/to/project" className="flex-1 font-mono text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleRun} disabled={isRunning || !listenerReady}>Run</Button>
          <Button size="sm" variant="outline" onClick={handleStop} disabled={!isRunning || !activeRunId || isStopping}>
            {isStopping ? 'Stopping...' : 'Stop'}
          </Button>
          {activeRunId && <Badge variant="outline" className="font-mono text-xs">{activeRunId}</Badge>}
        </div>
      </div>
      <div ref={containerRef} className="rounded-lg border border-border bg-[#0d0d0d]" style={{ height: 360 }} />
      {exitCode !== null && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Exit code:</span>
          <Badge variant={exitCode === 0 ? 'outline' : 'destructive'} className="text-xs">{exitCode}</Badge>
        </div>
      )}
    </div>
  )
}
