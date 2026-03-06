import { Loader2, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface PhaseIndicatorProps {
  currentPhase: number
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const { t } = useTranslation()
  const phases = [
    t('generatePlan.indicator.analyzing'),
    t('generatePlan.indicator.generating'),
    t('generatePlan.indicator.creatingTasks'),
    t('generatePlan.indicator.done'),
  ]

  return (
    <div className="space-y-2">
      {phases.map((label, i) => {
        const done = i < currentPhase
        const active = i === currentPhase

        return (
          <div key={label} className={cn(
            'flex items-center gap-3 text-sm transition-colors',
            done && 'text-success',
            active && 'text-foreground font-medium',
            !done && !active && 'text-muted-foreground',
          )}>
            <div className="size-5 flex items-center justify-center shrink-0">
              {done && <Check className="size-4" />}
              {active && <Loader2 className="size-4 animate-spin" />}
              {!done && !active && <span className="size-2 rounded-full bg-current" />}
            </div>
            {label}
          </div>
        )
      })}
    </div>
  )
}
