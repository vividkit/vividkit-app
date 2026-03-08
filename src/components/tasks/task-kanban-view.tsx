import { TaskKanbanColumn } from './task-kanban-column'
import type { Task, TaskStatus } from '@/types'

// Kanban has 4 visual columns but maps 7 statuses
type KanbanColumn = 'backlog' | 'todo' | 'in_progress' | 'done'
const COLUMNS: KanbanColumn[] = ['backlog', 'todo', 'in_progress', 'done']

function getColumn(status: TaskStatus): KanbanColumn {
  if (status === 'backlog') return 'backlog'
  if (status === 'todo') return 'todo'
  if (status === 'cooking' || status === 'paused' || status === 'review') return 'in_progress'
  return 'done' // done + failed
}

interface TaskKanbanViewProps {
  tasks: Task[]
  search: string
  onCook: (task: Task) => void
  onStatusChange?: (task: Task, status: TaskStatus) => void
  onDelete?: (task: Task) => void
}

export function TaskKanbanView({ tasks, search, onCook, onStatusChange, onDelete }: TaskKanbanViewProps) {
  const filtered = search
    ? tasks.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tasks

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {COLUMNS.map((col) => (
        <TaskKanbanColumn
          key={col}
          status={col as TaskStatus}
          tasks={filtered.filter((t) => getColumn(t.status) === col)}
          onCook={onCook}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
