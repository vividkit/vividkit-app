import { TaskKanbanCard } from './task-kanban-card'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types'

const COLUMN_META: Record<TaskStatus, { dot: string }> = {
  backlog: { dot: 'bg-muted-foreground' },
  todo: { dot: 'bg-warning' },
  in_progress: { dot: 'bg-primary' },
  done: { dot: 'bg-success' },
}

interface TaskKanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onCook: (task: Task) => void
}

export function TaskKanbanColumn({ status, tasks, onCook }: TaskKanbanColumnProps) {
  const { t } = useTranslation()
  const meta = COLUMN_META[status]
  const labelByStatus: Record<TaskStatus, string> = {
    backlog: t('tasks.kanban.columns.backlog'),
    todo: t('tasks.kanban.columns.todo'),
    in_progress: t('tasks.kanban.columns.inProgress'),
    done: t('tasks.kanban.columns.done'),
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
          <TaskKanbanCard key={task.id} task={task} onCook={onCook} />
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
