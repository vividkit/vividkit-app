import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const IDLE_MESSAGE = '$ Ready to brainstorm. Enter your idea below.\r\n'

const STREAM_LINES = [
  '\x1b[33m$ ccs glm "/brainstorm"\x1b[0m\r\n',
  '\x1b[36mAnalyzing your project structure...\x1b[0m\r\n',
  'Found: src/components/, src/stores/, src-tauri/\r\n',
  '\x1b[36mGenerating brainstorm report...\x1b[0m\r\n',
  '> Phase 1: Core Architecture\r\n',
  '> Phase 2: UI Components\r\n',
  '> Phase 3: AI Integration\r\n',
  '> Phase 4: Testing Strategy\r\n',
  '\x1b[32m✓ Brainstorm complete. 4 phases, 12 tasks generated.\x1b[0m\r\n',
]

interface BrainstormTerminalProps {
  status: 'idle' | 'running' | 'completed'
  onComplete?: () => void
}

export function BrainstormTerminal({ status, onComplete }: BrainstormTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lineIndexRef = useRef(0)

  useEffect(() => {
    if (!containerRef.current) return
    const term = new Terminal({
      theme: { background: '#0d0d0d', foreground: '#d4d4d4', cursor: '#d4d4d4' },
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      cursorBlink: true,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    term.write(IDLE_MESSAGE)
    termRef.current = term

    return () => { term.dispose() }
  }, [])

  useEffect(() => {
    if (status !== 'running') return
    const term = termRef.current
    if (!term) return
    term.clear()
    lineIndexRef.current = 0

    intervalRef.current = setInterval(() => {
      const idx = lineIndexRef.current
      if (idx < STREAM_LINES.length) {
        term.write(STREAM_LINES[idx])
        lineIndexRef.current++
      } else {
        clearInterval(intervalRef.current!)
        onComplete?.()
      }
    }, 400)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [status, onComplete])

  return (
    <div
      ref={containerRef}
      className="flex-1 rounded-lg overflow-hidden border border-border bg-[#0d0d0d]"
      style={{ minHeight: 280 }}
    />
  )
}
