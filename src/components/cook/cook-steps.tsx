import { Loader2, Check, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

function getStepIndex(progress: number): number {
  if (progress >= 100) return 4
  return Math.floor(progress / 25)
}

interface CookStepsProps {
  progress: number
}

export function CookSteps({ progress }: CookStepsProps) {
  const { t } = useTranslation()
  const steps = [
    t('cook.steps.analyzing'),
    t('cook.steps.planning'),
    t('cook.steps.executing'),
    t('cook.steps.reviewing'),
  ]
  const activeIdx = getStepIndex(progress)

  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const done = i < activeIdx
        const active = i === activeIdx

        return (
          <div key={label} className="flex items-center">
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors',
              done && 'text-success',
              active && 'text-foreground font-medium bg-accent',
              !done && !active && 'text-muted-foreground',
            )}>
              {done && <Check className="size-3" />}
              {active && <Loader2 className="size-3 animate-spin" />}
              {!done && !active && <Clock className="size-3" />}
              {label}
              {active && <span className="text-muted-foreground ml-1">← {t('cook.steps.current')}</span>}
            </div>
            {i < steps.length - 1 && (
              <span className="text-muted-foreground/40 text-xs mx-1">→</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
