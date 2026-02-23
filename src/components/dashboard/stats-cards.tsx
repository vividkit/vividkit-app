import { Flame, ListTodo, GitBranch } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useTaskStore } from '@/stores/task-store'
import { useWorktreeStore } from '@/stores/worktree-store'
import { cn } from '@/lib/utils'

interface StatCard {
  label: string
  value: number
  icon: React.ReactNode
  colorClass: string
}

export function StatsCards() {
  const tasks = useTaskStore((s) => s.tasks)
  const worktrees = useWorktreeStore((s) => s.worktrees)

  const active = tasks.filter((t) => (t.status as string) === 'in_progress').length
  const done = tasks.filter((t) => t.status === 'done').length

  const stats: StatCard[] = [
    { label: 'Active Tasks', value: active, icon: <Flame className="size-5" />, colorClass: 'text-primary' },
    { label: 'Total Tasks', value: tasks.length, icon: <ListTodo className="size-5" />, colorClass: 'text-info' },
    { label: 'Completed', value: done, icon: <ListTodo className="size-5" />, colorClass: 'text-success' },
    { label: 'Worktrees', value: worktrees.length, icon: <GitBranch className="size-5" />, colorClass: 'text-warning' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon, colorClass }) => (
        <Card key={label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn('shrink-0', colorClass)}>{icon}</div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
