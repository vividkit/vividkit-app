import { useNavigate } from 'react-router-dom'
import { Lightbulb, ListTodo, Layers, GitBranch, ArrowRight, FlameKindling } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'

export function QuickActions() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const actions = [
    {
      label: t('dashboard.quickActions.items.brainstorm.label'),
      desc: t('dashboard.quickActions.items.brainstorm.desc'),
      icon: Lightbulb,
      to: '/brainstorm',
    },
    {
      label: t('dashboard.quickActions.items.tasks.label'),
      desc: t('dashboard.quickActions.items.tasks.desc'),
      icon: ListTodo,
      to: '/tasks',
    },
    {
      label: t('dashboard.quickActions.items.cook.label'),
      desc: t('dashboard.quickActions.items.cook.desc'),
      icon: FlameKindling,
      to: '/tasks',
    },
    {
      label: t('dashboard.quickActions.items.decks.label'),
      desc: t('dashboard.quickActions.items.decks.desc'),
      icon: Layers,
      to: '/decks',
    },
    {
      label: t('dashboard.quickActions.items.worktrees.label'),
      desc: t('dashboard.quickActions.items.worktrees.desc'),
      icon: GitBranch,
      to: '/worktrees',
    },
  ]

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {t('dashboard.quickActions.title')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map(({ label, desc, icon: Icon, to }) => (
          <Card
            key={label}
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => navigate(to)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{desc}</p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
