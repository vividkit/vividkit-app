import { FlameKindling, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types'

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

const NEXT_STATUSES: Partial<Record<TaskStatus, TaskStatus[]>> = {
  backlog: ['todo'],
  todo: ['cooking'],
  cooking: ['review', 'paused'],
  paused: ['cooking'],
  review: ['done'],
  failed: ['todo'],
}

interface TaskKanbanCardProps {
  task: Task
  onCook: (task: Task) => void
  onStatusChange?: (task: Task, status: TaskStatus) => void
  onDelete?: (task: Task) => void
}

export function TaskKanbanCard({ task, onCook, onStatusChange, onDelete }: TaskKanbanCardProps) {
  const { t } = useTranslation()
  const done = task.status === 'done'
  const nextStatuses = NEXT_STATUSES[task.status] ?? []

  return (
    <Card className={cn('text-sm', done && 'opacity-60')}>
      <CardContent className="p-3 space-y-2">
        <p className={cn('font-medium line-clamp-2', done && 'line-through')}>{task.name}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <span className={cn('size-2 rounded-full', PRIORITY_COLORS[task.priority])} />
            <Badge variant="secondary" className={cn('text-xs', PRIORITY_BADGE_CLASS[task.priority])}>
              {t(`tasks.priorities.${task.priority}`)}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {done ? (
              <span className="text-xs text-success font-medium">✓ {t('tasks.list.done')}</span>
            ) : (
              <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => onCook(task)}>
                <FlameKindling className="size-3 mr-0.5" /> {t('tasks.list.cook')}
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(task)}>
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>
        </div>
        {nextStatuses.length > 0 && onStatusChange && (
          <div className="flex flex-wrap gap-1 pt-1 border-t">
            {nextStatuses.map((s) => (
              <Button key={s} size="sm" variant="ghost" className="h-5 text-xs px-1.5" onClick={() => onStatusChange(task, s)}>
                → {t(`tasks.statuses.${s}`, s)}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
