import { TaskKanbanCard } from './task-kanban-card'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types'

const COLUMN_META: Record<TaskStatus, { dot: string }> = {
  backlog: { dot: 'bg-muted-foreground' },
  todo: { dot: 'bg-warning' },
  in_progress: { dot: 'bg-primary' },
  cooking: { dot: 'bg-primary' },
  paused: { dot: 'bg-muted-foreground' },
  review: { dot: 'bg-warning' },
  done: { dot: 'bg-success' },
  failed: { dot: 'bg-destructive' },
}

interface TaskKanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onCook: (task: Task) => void
  onStatusChange?: (task: Task, status: TaskStatus) => void
  onDelete?: (task: Task) => void
}

export function TaskKanbanColumn({ status, tasks, onCook, onStatusChange, onDelete }: TaskKanbanColumnProps) {
  const { t } = useTranslation()
  const meta = COLUMN_META[status]
  const labelByStatus: Record<TaskStatus, string> = {
    backlog: t('tasks.kanban.columns.backlog'),
    todo: t('tasks.kanban.columns.todo'),
    in_progress: t('tasks.kanban.columns.inProgress'),
    cooking: t('tasks.kanban.columns.cooking', 'Cooking'),
    paused: t('tasks.kanban.columns.paused', 'Paused'),
    review: t('tasks.kanban.columns.review', 'Review'),
    done: t('tasks.kanban.columns.done'),
    failed: t('tasks.kanban.columns.failed', 'Failed'),
  }

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2 px-1">
        <span className={cn('size-2 rounded-full shrink-0', meta.dot)} />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{labelByStatus[status]}</span>
        <span className="text-xs text-muted-foreground ml-auto">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskKanbanCard key={task.id} task={task} onCook={onCook} onStatusChange={onStatusChange} onDelete={onDelete} />
        ))}
        {tasks.length === 0 && (
          <div className="h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
            <span className="text-xs text-muted-foreground">{t('tasks.kanban.noTasks')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
