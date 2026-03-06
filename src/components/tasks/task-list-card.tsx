import { useNavigate } from 'react-router-dom'
import { CheckCircle, Circle, FlameKindling, StopCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

const STATUS_BADGE_CLASS: Record<string, string> = {
  done: 'bg-success/10 text-success',
  in_progress: 'bg-warning/10 text-warning',
  todo: 'bg-warning/10 text-warning',
  backlog: 'bg-muted text-muted-foreground',
}

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-muted-foreground',
  medium: 'bg-warning',
  high: 'bg-destructive',
}

interface TaskListCardProps {
  task: Task
  onCook: (task: Task) => void
}

export function TaskListCard({ task, onCook }: TaskListCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const done = task.status === 'done'
  const running = (task.status as string) === 'in_progress'

  return (
    <Card className={cn('transition-colors', done && 'opacity-60')}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="shrink-0">
          {done
            ? <CheckCircle className="size-4 text-success" />
            : <Circle className="size-4 text-muted-foreground" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', done && 'line-through')}>{task.name}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground truncate">{task.description}</p>
          )}
          {task.planId && (
            <p className="text-xs text-muted-foreground">📁 {t('tasks.list.planLinked')}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <span className={cn('size-2 rounded-full', PRIORITY_DOT[task.priority])} />
            <span className="text-xs text-muted-foreground">{t(`tasks.priorities.${task.priority}`)}</span>
          </div>
          <Badge variant="secondary" className={cn('text-xs', STATUS_BADGE_CLASS[task.status] ?? STATUS_BADGE_CLASS.backlog)}>
            {t(`tasks.statuses.${task.status}`)}
          </Badge>
          {done ? (
            <span className="text-xs text-success font-medium">✓ {t('tasks.list.done')}</span>
          ) : running ? (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(`/cook/${task.id}`)}>
              <StopCircle className="size-3 mr-1" /> {t('tasks.list.stop')}
            </Button>
          ) : (
            <Button size="sm" className="h-7 text-xs" onClick={() => onCook(task)}>
              <FlameKindling className="size-3 mr-1" /> {t('tasks.list.cook')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
