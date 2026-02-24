import { useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getTerminalTheme } from '@/lib/utils'
import { listCcsProfiles, resolveHomePath, sendCcsInput, spawnCcs, stopCcs, type CcsRunEventPayload } from '@/lib/tauri'

const DEFAULT_COMMAND = '/brainstorm write a todo app'
const DEFAULT_RELATIVE_CWD = 'projects/solo-builder/vividkit-workspace/vividkit-testing'

export function CcsTestConsole() {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const mountedRef = useRef(true)
  const activeRunIdRef = useRef<string | null>(null)
  const isStartingRef = useRef(false)
  const stopRequestedRef = useRef(false)
  const writeQueueRef = useRef<string[]>([])
  const flushingRef = useRef(false)
  const pendingEventsRef = useRef<CcsRunEventPayload[]>([])
  const [profiles, setProfiles] = useState<string[]>(['default'])
  const [profile, setProfile] = useState('default')
  const [command, setCommand] = useState(DEFAULT_COMMAND)
  const [cwd, setCwd] = useState('')
  const [listenerReady, setListenerReady] = useState(false)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [exitCode, setExitCode] = useState<number | null>(null)

  function setActiveRun(runId: string | null) { activeRunIdRef.current = runId; setActiveRunId(runId) }
  function finishRun() { isStartingRef.current = false; stopRequestedRef.current = false; pendingEventsRef.current = []; writeQueueRef.current = []; flushingRef.current = false; setIsRunning(false); setIsStopping(false); setActiveRun(null) }
  function flushWriteQueue() { const term = termRef.current; if (!term || flushingRef.current) return; flushingRef.current = true; const drain = () => { const c = writeQueueRef.current.shift(); if (!c) { flushingRef.current = false; return }; term.write(c, drain) }; drain() }
  function handleRunEvent(payload: CcsRunEventPayload) {
    if (payload.kind === 'stdout' || payload.kind === 'stderr') { if (payload.chunk) { writeQueueRef.current.push(payload.chunk); flushWriteQueue() }; return }
    if (payload.kind === 'terminated') { const code = payload.code ?? -1; setExitCode(code); termRef.current?.writeln(`\r\n\x1b[33mProcess exited with code ${code}\x1b[0m`); finishRun(); return }
    termRef.current?.writeln(`\r\n\x1b[31mRun error: ${payload.message ?? 'Unknown error'}\x1b[0m`); finishRun()
  }

  useEffect(() => { resolveHomePath(DEFAULT_RELATIVE_CWD).then(setCwd).catch(() => {}) }, [])

  useEffect(() => {
    let active = true
    void listCcsProfiles()
      .then((items) => {
        if (!active) return
        const nextProfiles = Array.from(new Set(items.map((item) => item.name.trim()).filter((name) => name.length > 0)))
        if (nextProfiles.length === 0) return
        setProfiles(nextProfiles)
        setProfile((current) => (nextProfiles.includes(current) ? current : nextProfiles[0]))
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    mountedRef.current = true
    const term = new Terminal({ theme: getTerminalTheme(), fontSize: 13, cursorBlink: true })
    const fit = new FitAddon(); term.loadAddon(fit); term.open(containerRef.current); fit.fit()
    const refit = () => fit.fit(); const focus = () => term.focus()
    window.addEventListener('resize', refit); containerRef.current.addEventListener('mousedown', focus); requestAnimationFrame(() => { refit(); focus() })
    term.writeln('\x1b[36mCCS Test Console ready.\x1b[0m'); termRef.current = term

    let mounted = true; let dispose: (() => void) | null = null
    const inputDispose = term.onData((data) => {
      const runId = activeRunIdRef.current
      if (!runId) return
      void sendCcsInput(runId, data).catch((error) => termRef.current?.writeln(`\r\n\x1b[31mInput error: ${String(error)}\x1b[0m`))
    })

    listen<CcsRunEventPayload>('ccs_run_event', (e) => {
      const runId = activeRunIdRef.current
      if (runId) { if (e.payload.run_id !== runId) return; handleRunEvent(e.payload); return }
      if (isStartingRef.current) pendingEventsRef.current.push(e.payload)
    }).then((unlisten) => {
      if (!mounted) { unlisten(); return }
      dispose = unlisten; setListenerReady(true)
    }).catch((error) => termRef.current?.writeln(`\r\n\x1b[31mListener error: ${String(error)}\x1b[0m`))

    return () => {
      mounted = false; mountedRef.current = false; setListenerReady(false)
      const runId = activeRunIdRef.current
      if (runId) void stopCcs(runId).catch(() => {})
      activeRunIdRef.current = null; isStartingRef.current = false; stopRequestedRef.current = false; pendingEventsRef.current = []; writeQueueRef.current = []; flushingRef.current = false
      setActiveRunId(null); setIsRunning(false); setIsStopping(false)
      dispose?.(); inputDispose.dispose(); containerRef.current?.removeEventListener('mousedown', focus); window.removeEventListener('resize', refit)
      term.dispose(); termRef.current = null
    }
  }, [])

  async function handleRun() {
    if (!termRef.current || !listenerReady || isRunning) return
    setIsRunning(true); setIsStopping(false); setExitCode(null); setActiveRun(null)
    isStartingRef.current = true; stopRequestedRef.current = false; pendingEventsRef.current = []; writeQueueRef.current = []; flushingRef.current = false
    termRef.current.clear(); termRef.current.focus(); termRef.current.writeln(`\x1b[33m$ ccs ${profile} "${command}"\x1b[0m\r\n`)
    if (cwd) termRef.current.writeln(`\x1b[90mcwd: ${cwd}\x1b[0m\r\n`)
    try {
      const run = await spawnCcs({ profile, command, cwd: cwd || '.' })
      if (!mountedRef.current) { void stopCcs(run.run_id).catch(() => {}); return }
      setActiveRun(run.run_id)
      if (stopRequestedRef.current) { stopRequestedRef.current = false; isStartingRef.current = false; void handleStop(); return }
      isStartingRef.current = false
      const pidText = run.pid === null ? '' : ` (pid ${run.pid})`
      termRef.current.writeln(`\x1b[90mrun_id: ${run.run_id}${pidText}\x1b[0m\r\n`)
      const queued = pendingEventsRef.current; pendingEventsRef.current = []
      queued.forEach((event) => { if (event.run_id === run.run_id) handleRunEvent(event) })
    } catch (error) {
      if (!mountedRef.current) return
      isStartingRef.current = false; pendingEventsRef.current = []
      termRef.current.writeln(`\r\n\x1b[31mError: ${String(error)}\x1b[0m`)
      setIsRunning(false); setIsStopping(false); setActiveRun(null)
    }
  }

  async function handleStop() {
    const runId = activeRunIdRef.current
    if (!isRunning || isStopping) return
    if (!runId) { stopRequestedRef.current = true; termRef.current?.writeln('\r\n\x1b[33mStop requested, waiting for run id...\x1b[0m'); return }
    setIsStopping(true); termRef.current?.writeln(`\r\n\x1b[33mStopping run ${runId}...\x1b[0m`)
    try {
      const result = await stopCcs(runId)
      if (result.already_stopped) { finishRun(); termRef.current?.writeln('\r\n\x1b[33mRun was already stopped.\x1b[0m'); return }
      if (!result.stopped) { setIsStopping(false); termRef.current?.writeln('\r\n\x1b[31mStop request failed.\x1b[0m') }
    } catch (error) {
      setIsStopping(false)
      termRef.current?.writeln(`\r\n\x1b[31mStop error: ${String(error)}\x1b[0m`)
    }
  }

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center gap-2">
          <label className="w-16 shrink-0 text-xs font-medium">Profile</label>
          <Select value={profile} onValueChange={setProfile}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{profiles.map((profileName) => <SelectItem key={profileName} value={profileName}>{profileName}</SelectItem>)}</SelectContent>
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
          <Button size="sm" variant="outline" onClick={handleStop} disabled={!isRunning || isStopping}>{isStopping ? 'Stopping...' : 'Stop'}</Button>
          {activeRunId && <Badge variant="outline" className="font-mono text-xs">{activeRunId}</Badge>}
        </div>
      </div>
      <div ref={containerRef} className="w-full rounded-lg border border-border bg-terminal-background" style={{ height: 360 }} />
      {exitCode !== null && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Exit code:</span>
          <Badge variant={exitCode === 0 ? 'outline' : 'destructive'} className="text-xs">{exitCode}</Badge>
        </div>
      )}
    </div>
  )
}
