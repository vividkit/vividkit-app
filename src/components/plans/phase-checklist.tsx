import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlanStore } from '@/stores/plan-store'
import type { Plan } from '@/types'

interface PhaseChecklistProps {
  plan: Plan
}

export function PhaseChecklist({ plan }: PhaseChecklistProps) {
  const updatePhaseStatus = usePlanStore((s) => s.updatePhaseStatus)

  function toggle(phaseId: string, current: string) {
    const next = current === 'done' ? 'pending' : 'done'
    updatePhaseStatus(plan.id, phaseId, next as 'pending' | 'done')
  }

  return (
    <div className="space-y-2">
      {plan.phases.map((phase) => {
        const done = phase.status === 'done'
        return (
          <button
            key={phase.id}
            onClick={() => toggle(phase.id, phase.status)}
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
                Phase {phase.order} — {phase.name}
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
