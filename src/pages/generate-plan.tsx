import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { AppHeader } from '@/components/layout'
import { PhaseIndicator } from '@/components/generate-plan'
import { Button } from '@/components/ui/button'
import { usePlanStore } from '@/stores/plan-store'
import { useTaskStore } from '@/stores/task-store'
import { useDeckStore } from '@/stores/deck-store'

const PHASE_LINES = [
  ['\x1b[33m$ Searching for brainstorm report...\x1b[0m\r\n', 'Found: brainstorm-report.md\r\n'],
  ['\x1b[33m$ Generating plan structure...\x1b[0m\r\n', 'Detected 4 phases, 12 tasks\r\n'],
  ['\x1b[33m$ Creating tasks in workspace...\x1b[0m\r\n', 'Created: task-1.md, task-2.md...\r\n'],
  ['\x1b[32m✓ Plan generated successfully!\x1b[0m\r\n', '\x1b[36mPlan saved to: plans/mvp-plan.md\x1b[0m\r\n'],
]

export default function GeneratePlanPage() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [done, setDone] = useState(false)
  const [planId] = useState(() => crypto.randomUUID())
  const addPlan = usePlanStore((s) => s.addPlan)
  const addTask = useTaskStore((s) => s.addTask)
  const { activeDeckId } = useDeckStore()

  useEffect(() => {
    if (!containerRef.current) return
    const term = new Terminal({ theme: { background: '#0d0d0d', foreground: '#d4d4d4' }, fontSize: 13 })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term
    return () => { term.dispose() }
  }, [])

  useEffect(() => {
    if (!termRef.current) return
    let phase = 0
    const runPhase = () => {
      if (phase >= PHASE_LINES.length) {
        setDone(true)
        const newPlan = {
          id: planId,
          deckId: activeDeckId ?? '',
          name: 'Generated Plan',
          phases: [1, 2, 3, 4].map((n) => ({
            id: crypto.randomUUID(), planId, name: `Phase ${n}`, order: n, status: 'pending' as const,
          })),
          createdAt: new Date().toISOString(),
        }
        addPlan(newPlan)
        for (let i = 0; i < 3; i++) {
          addTask({
            id: crypto.randomUUID(), deckId: activeDeckId ?? '', type: 'generated',
            name: `Generated Task ${i + 1}`, status: 'todo', priority: 'medium', planId,
          })
        }
        return
      }
      setCurrentPhase(phase)
      PHASE_LINES[phase].forEach((line, i) => {
        setTimeout(() => termRef.current?.write(line), i * 500)
      })
      phase++
      setTimeout(runPhase, 2000)
    }
    const timer = setTimeout(runPhase, 300)
    return () => { clearTimeout(timer) }
  }, [planId, activeDeckId, addPlan, addTask])

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Generate Plan" subtitle="AI is creating your implementation plan…" />
      <div className="flex flex-col flex-1 p-6 gap-4 min-h-0">
        <PhaseIndicator currentPhase={done ? 4 : currentPhase} />
        <div ref={containerRef} className="flex-1 rounded-lg border border-border bg-[#0d0d0d]" style={{ minHeight: 300 }} />
        {done && (
          <div className="flex gap-3">
            <Button onClick={() => navigate(`/plans/${planId}?new=true`)}>View Plan</Button>
            <Button variant="outline" onClick={() => navigate('/tasks')}>Go to Tasks</Button>
          </div>
        )}
      </div>
    </div>
  )
}
