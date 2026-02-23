import { List, LayoutGrid, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types'

export type TaskView = 'list' | 'kanban'

const STATUS_FILTERS: Array<{ value: TaskStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

interface TaskToolbarProps {
  view: TaskView
  onViewChange: (v: TaskView) => void
  search: string
  onSearchChange: (s: string) => void
  statusFilter: TaskStatus | 'all'
  onStatusFilterChange: (s: TaskStatus | 'all') => void
  onAddTask: () => void
}

export function TaskToolbar({
  view, onViewChange, search, onSearchChange, statusFilter, onStatusFilterChange, onAddTask,
}: TaskToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex rounded-md border border-border overflow-hidden">
          {(['list', 'kanban'] as TaskView[]).map((v) => (
            <Button
              key={v}
              variant="ghost"
              size="sm"
              className={cn('rounded-none h-8 px-3', view === v && 'bg-accent text-accent-foreground')}
              onClick={() => onViewChange(v)}
            >
              {v === 'list' ? <List className="size-3.5" /> : <LayoutGrid className="size-3.5" />}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks…"
            className="pl-8 h-8 text-sm"
          />
        </div>

        <div className="flex-1" />
        <Button size="sm" onClick={onAddTask}>
          <Plus className="size-4 mr-1" /> Add Task
        </Button>
      </div>

      {/* Status filter (list only) */}
      {view === 'list' && (
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <Button
              key={value}
              variant={statusFilter === value ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => onStatusFilterChange(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
