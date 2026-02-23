import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const PHASE_LINES: Record<number, string> = {
  0: '\x1b[33m$ Analyzing task requirements...\x1b[0m\r\n',
  25: '\x1b[33m$ Planning implementation strategy...\x1b[0m\r\n  Identified 3 subtasks\r\n',
  50: '\x1b[33m$ Executing implementation...\x1b[0m\r\n  Writing components...\r\n  Updating stores...\r\n',
  75: '\x1b[33m$ Reviewing changes...\x1b[0m\r\n  Running lint...\r\n  Checking types...\r\n',
  100: '\x1b[32m✓ Cook complete! Ready to merge.\x1b[0m\r\n',
}

interface CookTerminalProps {
  progress: number
}

export function CookTerminal({ progress }: CookTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const lastThresholdRef = useRef(-1)

  useEffect(() => {
    if (!containerRef.current) return
    const term = new Terminal({ theme: { background: '#0d0d0d', foreground: '#d4d4d4' }, fontSize: 12, cursorBlink: true })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term
    return () => { term.dispose() }
  }, [])

  useEffect(() => {
    const term = termRef.current
    if (!term) return
    const thresholds = [0, 25, 50, 75, 100]
    for (const t of thresholds) {
      if (progress >= t && lastThresholdRef.current < t) {
        term.write(PHASE_LINES[t])
        lastThresholdRef.current = t
      }
    }
  }, [progress])

  return (
    <div
      ref={containerRef}
      className="flex-1 rounded-lg border border-border bg-[#0d0d0d]"
      style={{ minHeight: 300 }}
    />
  )
}
