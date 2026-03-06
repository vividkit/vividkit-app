import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { AppHeader } from '@/components/layout'
import { PhaseIndicator } from '@/components/generate-plan'
import { Button } from '@/components/ui/button'
import i18n from '@/i18n/i18n'
import { getTerminalTheme } from '@/lib/utils'
import { useDeckStore } from '@/stores/deck-store'
import { usePlanStore } from '@/stores/plan-store'
import { useTaskStore } from '@/stores/task-store'

function terminalPhaseLines(phase: number): [string, string] {
  if (phase === 0) {
    return [
      `\x1b[33m${i18n.t('generatePlan.terminal.searching')}\x1b[0m\r\n`,
      `${i18n.t('generatePlan.terminal.found')}\r\n`,
    ]
  }
  if (phase === 1) {
    return [
      `\x1b[33m${i18n.t('generatePlan.terminal.generating')}\x1b[0m\r\n`,
      `${i18n.t('generatePlan.terminal.detected')}\r\n`,
    ]
  }
  if (phase === 2) {
    return [
      `\x1b[33m${i18n.t('generatePlan.terminal.creating')}\x1b[0m\r\n`,
      `${i18n.t('generatePlan.terminal.created')}\r\n`,
    ]
  }
  return [
    `\x1b[32m✓ ${i18n.t('generatePlan.terminal.success')}\x1b[0m\r\n`,
    `\x1b[36m${i18n.t('generatePlan.terminal.saved')}\x1b[0m\r\n`,
  ]
}

export default function GeneratePlanPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [done, setDone] = useState(false)
  const [planId] = useState(() => crypto.randomUUID())
  const timerIdsRef = useRef<number[]>([])
  const hasCommittedRef = useRef(false)
  const addPlan = usePlanStore((s) => s.addPlan)
  const addTask = useTaskStore((s) => s.addTask)
  const { activeDeckId } = useDeckStore()

  useEffect(() => {
    if (!containerRef.current) return
    const term = new Terminal({ theme: getTerminalTheme(), fontSize: 13 })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term
    return () => { term.dispose() }
  }, [])

  useEffect(() => {
    if (!termRef.current || hasCommittedRef.current) return
    const clearScheduledTimers = () => {
      for (const timerId of timerIdsRef.current) {
        window.clearTimeout(timerId)
      }
      timerIdsRef.current = []
    }
    clearScheduledTimers()

    let phase = 0
    const schedule = (fn: () => void, delayMs: number) => {
      const timerId = window.setTimeout(fn, delayMs)
      timerIdsRef.current.push(timerId)
    }

    const runPhase = () => {
      if (phase >= 4) {
        if (hasCommittedRef.current) return
        hasCommittedRef.current = true
        setDone(true)
        const newPlan = {
          id: planId,
          deckId: activeDeckId ?? '',
          name: i18n.t('pages.generatePlan.generatedPlanName'),
          phases: [1, 2, 3, 4].map((index) => ({
            id: crypto.randomUUID(),
            planId,
            name: i18n.t('pages.generatePlan.generatedPhaseName', { index }),
            order: index,
            status: 'pending' as const,
          })),
          createdAt: new Date().toISOString(),
        }
        addPlan(newPlan)
        for (let index = 1; index <= 3; index += 1) {
          addTask({
            id: crypto.randomUUID(),
            deckId: activeDeckId ?? '',
            type: 'generated',
            name: i18n.t('pages.generatePlan.generatedTaskName', { index }),
            status: 'todo',
            priority: 'medium',
            planId,
          })
        }
        return
      }
      setCurrentPhase(phase)
      const [primaryLine, secondaryLine] = terminalPhaseLines(phase)
      ;[primaryLine, secondaryLine].forEach((line, i) => {
        schedule(() => termRef.current?.write(line), i * 500)
      })
      phase++
      schedule(runPhase, 2000)
    }
    schedule(runPhase, 300)
    return () => { clearScheduledTimers() }
  }, [planId, activeDeckId, addPlan, addTask])

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={t('pages.generatePlan.title')} subtitle={t('pages.generatePlan.subtitle')} />
      <div className="flex flex-col flex-1 p-6 gap-4 min-h-0">
        <PhaseIndicator currentPhase={done ? 4 : currentPhase} />
        <div ref={containerRef} className="flex-1 rounded-lg border border-border bg-terminal-background" style={{ minHeight: 300 }} />
        {done && (
          <div className="flex gap-3">
            <Button onClick={() => navigate(`/plans/${planId}?new=true`)}>{t('pages.generatePlan.viewPlan')}</Button>
            <Button variant="outline" onClick={() => navigate('/tasks')}>{t('pages.generatePlan.goToTasks')}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
