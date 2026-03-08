import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout'
import { TaskToolbar, TaskListView, TaskKanbanView, AddTaskDialog, TaskCookSheet } from '@/components/tasks'
import { useTasks } from '@/hooks/use-tasks'
import type { Task, TaskStatus } from '@/types'
import type { TaskView } from '@/components/tasks/task-toolbar'

export default function TasksPage() {
  const { t } = useTranslation()
  const { tasks, updateStatus, removeTask } = useTasks()
  const [view, setView] = useState<TaskView>('list')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [cookTask, setCookTask] = useState<Task | null>(null)

  async function handleStatusChange(task: Task, status: TaskStatus) {
    try {
      await updateStatus(task.id, status)
    } catch (e) {
      console.error('[tasks] status change failed:', e)
    }
  }

  async function handleDelete(task: Task) {
    try {
      await removeTask(task.id)
    } catch (e) {
      console.error('[tasks] delete failed:', e)
    }
  }

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
          <TaskListView tasks={tasks} statusFilter={statusFilter} search={search} onCook={setCookTask} onStatusChange={handleStatusChange} onDelete={handleDelete} />
        ) : (
          <TaskKanbanView tasks={tasks} search={search} onCook={setCookTask} onStatusChange={handleStatusChange} onDelete={handleDelete} />
        )}
      </div>
      <AddTaskDialog open={showAdd} onOpenChange={setShowAdd} />
      <TaskCookSheet task={cookTask} open={!!cookTask} onOpenChange={(o) => { if (!o) setCookTask(null) }} />
    </div>
  )
}
