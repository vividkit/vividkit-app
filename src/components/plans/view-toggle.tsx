import { List, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type PlanView = 'phases' | 'preview'

interface ViewToggleProps {
  view: PlanView
  onChange: (v: PlanView) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  const { t } = useTranslation()

  return (
    <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
      {(['phases', 'preview'] as PlanView[]).map((v) => (
        <Button
          key={v}
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 rounded-md px-3 text-muted-foreground',
            view === v ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
          )}
          onClick={() => onChange(v)}
        >
          {v === 'phases' ? <List className="size-3.5 mr-1" /> : <BookOpen className="size-3.5 mr-1" />}
          <span className="capitalize">{t(`plans.viewToggle.${v}`)}</span>
        </Button>
      ))}
    </div>
  )
}
