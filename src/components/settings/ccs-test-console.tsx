import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

const PROFILES = ['default', 'glm', 'gemini', 'kimi', 'codex']

export function CcsTestConsole() {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const [profile, setProfile] = useState('default')
  const [command, setCommand] = useState('/brainstorm write a todo app')
  const [cwd, setCwd] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [exitCode, setExitCode] = useState<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const term = new Terminal({ theme: { background: '#0d0d0d', foreground: '#d4d4d4' }, fontSize: 13, cursorBlink: true })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    term.writeln('\x1b[36mCCS Test Console ready.\x1b[0m')
    termRef.current = term

    const unlisten1 = listen<string>('ccs_output', (e) => {
      termRef.current?.write(e.payload)
    })
    const unlisten2 = listen<number>('ccs_done', (e) => {
      setExitCode(e.payload)
      setIsRunning(false)
      termRef.current?.writeln(`\r\n\x1b[33mProcess exited with code ${e.payload}\x1b[0m`)
    })

    return () => {
      unlisten1.then((f) => f())
      unlisten2.then((f) => f())
      term.dispose()
    }
  }, [])

  async function handleRun() {
    if (!termRef.current) return
    setIsRunning(true)
    setExitCode(null)
    termRef.current.clear()
    termRef.current.writeln(`\x1b[33m$ ccs ${profile} "${command}"\x1b[0m\r\n`)
    try {
      await invoke('spawn_ccs', { profile, command, cwd: cwd || '.' })
    } catch (err) {
      termRef.current.writeln(`\r\n\x1b[31mError: ${err}\x1b[0m`)
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="flex gap-2 items-center">
          <label className="text-xs font-medium w-16 shrink-0">Profile</label>
          <Select value={profile} onValueChange={setProfile}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROFILES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs font-medium w-16 shrink-0">Command</label>
          <Input value={command} onChange={(e) => setCommand(e.target.value)} className="font-mono text-sm flex-1" />
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs font-medium w-16 shrink-0">CWD</label>
          <Input value={cwd} onChange={(e) => setCwd(e.target.value)} placeholder="/path/to/project" className="font-mono text-sm flex-1" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleRun} disabled={isRunning}>Run</Button>
          <Button size="sm" variant="outline" disabled={!isRunning}>Stop</Button>
        </div>
      </div>
      <div ref={containerRef} className="rounded-lg border border-border bg-[#0d0d0d]" style={{ height: 360 }} />
      {exitCode !== null && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Exit code:</span>
          <Badge variant={exitCode === 0 ? 'outline' : 'destructive'} className="text-xs">
            {exitCode}
          </Badge>
        </div>
      )}
    </div>
  )
}
