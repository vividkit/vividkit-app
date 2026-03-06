import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Loader2, Circle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTaskStore } from '@/stores/task-store'
import { cn } from '@/lib/utils'

const STATUS_BADGE_CLASS: Record<string, string> = {
  done: 'bg-success/10 text-success',
  in_progress: 'bg-warning/10 text-warning',
  todo: 'bg-warning/10 text-warning',
  backlog: 'bg-muted text-muted-foreground',
}

interface RelatedTasksProps {
  planId: string
  isNew?: boolean
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  done: <CheckCircle className="size-4 text-success" />,
  in_progress: <Loader2 className="size-4 animate-spin text-primary" />,
  todo: <Circle className="size-4 text-muted-foreground" />,
  backlog: <Circle className="size-4 text-muted-foreground" />,
}

export function RelatedTasks({ planId, isNew }: RelatedTasksProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tasks = useTaskStore((s) => s.tasks)
  const [ready, setReady] = useState(!isNew)

  useEffect(() => {
    if (!isNew) return
    const t = setTimeout(() => setReady(true), 3500)
    return () => clearTimeout(t)
  }, [isNew])

  const planTasks = tasks.filter((t) => t.planId === planId)

  if (!ready) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (planTasks.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('plans.relatedTasks.empty')}</p>
  }

  return (
    <div className="space-y-2">
      {planTasks.map((task) => (
        <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
          {STATUS_ICONS[task.status] ?? STATUS_ICONS.todo}
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium truncate', task.status === 'done' && 'line-through text-muted-foreground')}>
              {task.name}
            </p>
            {task.description && <p className="text-xs text-muted-foreground truncate">{task.description}</p>}
          </div>
          <Badge variant="secondary" className={cn('text-xs shrink-0', STATUS_BADGE_CLASS[task.status] ?? STATUS_BADGE_CLASS.backlog)}>
            {t(`tasks.statuses.${task.status}`)}
          </Badge>
          {(task.status as string) === 'in_progress' && (
            <Button size="sm" variant="outline" className="text-xs h-7 shrink-0" onClick={() => navigate(`/cook/${task.id}`)}>
              {t('plans.relatedTasks.cook')}
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
