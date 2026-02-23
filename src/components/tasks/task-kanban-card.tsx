import { FlameKindling } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-success',
  medium: 'bg-warning',
  high: 'bg-destructive',
}

const PRIORITY_BADGE_CLASS: Record<string, string> = {
  low: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
}

interface TaskKanbanCardProps {
  task: Task
  onCook: (task: Task) => void
}

export function TaskKanbanCard({ task, onCook }: TaskKanbanCardProps) {
  const done = task.status === 'done'

  return (
    <Card className={cn('text-sm', done && 'opacity-60')}>
      <CardContent className="p-3 space-y-2">
        <p className={cn('font-medium line-clamp-2', done && 'line-through')}>{task.name}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className={cn('size-2 rounded-full', PRIORITY_COLORS[task.priority])} />
            <Badge variant="secondary" className={cn('text-xs capitalize', PRIORITY_BADGE_CLASS[task.priority])}>{task.priority}</Badge>
          </div>
          {done ? (
            <span className="text-xs text-success font-medium">✓ Done</span>
          ) : (
            <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => onCook(task)}>
              <FlameKindling className="size-3 mr-0.5" /> Cook
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
