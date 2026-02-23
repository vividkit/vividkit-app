import { useNavigate } from 'react-router-dom'
import { Lightbulb, ListTodo, Layers, GitBranch, ArrowRight, FlameKindling } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const ACTIONS = [
  { label: 'Brainstorm', desc: 'Generate ideas with AI', icon: Lightbulb, to: '/brainstorm' },
  { label: 'Tasks', desc: 'View and manage tasks', icon: ListTodo, to: '/tasks' },
  { label: 'Cook', desc: 'Start a cook session', icon: FlameKindling, to: '/tasks' },
  { label: 'Decks', desc: 'Manage project decks', icon: Layers, to: '/decks' },
  { label: 'Worktrees', desc: 'Manage git worktrees', icon: GitBranch, to: '/worktrees' },
]

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {ACTIONS.map(({ label, desc, icon: Icon, to }) => (
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
