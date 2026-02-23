import { TaskListCard } from './task-list-card'
import type { Task, TaskStatus } from '@/types'

interface TaskListViewProps {
  tasks: Task[]
  statusFilter: TaskStatus | 'all'
  search: string
  onCook: (task: Task) => void
}

export function TaskListView({ tasks, statusFilter, search, onCook }: TaskListViewProps) {
  const filtered = tasks.filter((t) => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        {search ? `No tasks matching "${search}"` : 'No tasks found.'}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filtered.map((task) => (
        <TaskListCard key={task.id} task={task} onCook={onCook} />
      ))}
    </div>
  )
}
