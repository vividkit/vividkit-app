import { Check, Circle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { PlanWithPhases } from '@/lib/tauri'

type Phase = PlanWithPhases['phases'][number]

interface PhaseChecklistProps {
  phases: Phase[]
  onToggle: (phaseId: string, currentStatus: string) => void
}

export function PhaseChecklist({ phases, onToggle }: PhaseChecklistProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      {phases.map((phase) => {
        const done = phase.status === 'done'
        return (
          <button
            key={phase.id}
            onClick={() => onToggle(phase.id, phase.status)}
            className={cn(
              'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-accent/50',
              done ? 'border-success/30 bg-success/5 dark:bg-success/10' : 'border-border',
            )}
          >
            <div className="mt-0.5 shrink-0">
              {done
                ? <Check className="size-4 text-success" />
                : <Circle className="size-4 text-muted-foreground" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>
                {t('plans.phaseChecklist.phaseTitle', { order: phase.orderIndex, name: phase.name })}
              </p>
              {phase.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{phase.description}</p>
              )}
              {phase.filePath && (
                <p className="text-xs font-mono text-muted-foreground mt-0.5">{phase.filePath}</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
