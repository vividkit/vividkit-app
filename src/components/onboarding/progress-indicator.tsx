import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  steps: string[]
  currentStep: number
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="w-64 min-h-screen bg-muted/30 border-r border-border flex flex-col pt-16 px-8">
      <div className="mb-8">
        <h2 className="text-lg font-bold text-foreground">VividKit</h2>
        <p className="text-xs text-muted-foreground">Setup Wizard</p>
      </div>
      <div className="space-y-6">
        {steps.map((label, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div key={label} className="flex items-center gap-3">
              <div className={cn(
                'size-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border-2 transition-colors',
                done && 'bg-success border-success text-white',
                active && 'bg-primary border-primary text-primary-foreground',
                !done && !active && 'bg-background border-border text-muted-foreground',
              )}>
                {done ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span className={cn(
                'text-sm',
                active && 'font-medium text-foreground',
                !active && 'text-muted-foreground',
              )}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
