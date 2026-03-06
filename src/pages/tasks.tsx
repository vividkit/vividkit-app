import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout'
import { TaskToolbar, TaskListView, TaskKanbanView, AddTaskDialog, TaskCookSheet } from '@/components/tasks'
import { useTaskStore } from '@/stores/task-store'
import type { Task, TaskStatus } from '@/types'
import type { TaskView } from '@/components/tasks/task-toolbar'

export default function TasksPage() {
  const { t } = useTranslation()
  const tasks = useTaskStore((s) => s.tasks)
  const [view, setView] = useState<TaskView>('list')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [cookTask, setCookTask] = useState<Task | null>(null)

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={t('pages.tasks.title')} subtitle={t('pages.tasks.subtitleTotal', { count: tasks.length })} />
      <div className="p-6 space-y-4">
        <TaskToolbar
          view={view}
          onViewChange={setView}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onAddTask={() => setShowAdd(true)}
        />
        {view === 'list' ? (
          <TaskListView tasks={tasks} statusFilter={statusFilter} search={search} onCook={setCookTask} />
        ) : (
          <TaskKanbanView tasks={tasks} search={search} onCook={setCookTask} />
        )}
      </div>
      <AddTaskDialog open={showAdd} onOpenChange={setShowAdd} />
      <TaskCookSheet task={cookTask} open={!!cookTask} onOpenChange={(o) => { if (!o) setCookTask(null) }} />
    </div>
  )
}
