import { TaskKanbanColumn } from './task-kanban-column'
import type { Task, TaskStatus } from '@/types'

const COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'done']

interface TaskKanbanViewProps {
  tasks: Task[]
  search: string
  onCook: (task: Task) => void
}

export function TaskKanbanView({ tasks, search, onCook }: TaskKanbanViewProps) {
  const filtered = search
    ? tasks.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tasks

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {COLUMNS.map((status) => (
        <TaskKanbanColumn
          key={status}
          status={status}
          tasks={filtered.filter((t) => t.status === status)}
          onCook={onCook}
        />
      ))}
    </div>
  )
}
