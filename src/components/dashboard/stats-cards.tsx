import { Flame, ListTodo, GitBranch } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { useDashboard } from '@/hooks/use-dashboard'
import { cn } from '@/lib/utils'

interface StatCard {
  label: string
  value: number
  icon: React.ReactNode
  colorClass: string
}

export function StatsCards() {
  const { t } = useTranslation()
  const { stats: s } = useDashboard()

  const stats: StatCard[] = [
    { label: t('dashboard.stats.activeTasks'), value: s.activeTasks, icon: <Flame className="size-5" />, colorClass: 'text-primary' },
    { label: t('dashboard.stats.totalTasks'), value: s.totalTasks, icon: <ListTodo className="size-5" />, colorClass: 'text-info' },
    { label: t('dashboard.stats.completed'), value: s.doneTasks, icon: <ListTodo className="size-5" />, colorClass: 'text-success' },
    { label: t('dashboard.stats.worktrees'), value: s.worktreeCount, icon: <GitBranch className="size-5" />, colorClass: 'text-warning' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon, colorClass }) => (
        <Card key={label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn('shrink-0', colorClass)}>{icon}</div>
            <div>
              <p className="text-lg font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
