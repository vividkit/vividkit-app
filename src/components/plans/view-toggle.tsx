import { List, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type PlanView = 'phases' | 'preview'

interface ViewToggleProps {
  view: PlanView
  onChange: (v: PlanView) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden">
      {(['phases', 'preview'] as PlanView[]).map((v) => (
        <Button
          key={v}
          variant="ghost"
          size="sm"
          className={cn('rounded-none h-8 px-3', view === v && 'bg-accent text-accent-foreground')}
          onClick={() => onChange(v)}
        >
          {v === 'phases' ? <List className="size-3.5" /> : <BookOpen className="size-3.5" />}
        </Button>
      ))}
    </div>
  )
}
