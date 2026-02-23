import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Plan } from '@/types'

interface PlanCardProps {
  plan: Plan
}

export function PlanCard({ plan }: PlanCardProps) {
  const navigate = useNavigate()
  const total = plan.phases.length
  const completed = plan.phases.filter((p) => p.status === 'done').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Card
      className="cursor-pointer hover:border-primary/40 transition-colors"
      onClick={() => navigate(`/plans/${plan.id}`)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-snug">{plan.name}</p>
          {pct === 100 && (
            <Badge variant="secondary" className="bg-success/10 text-success text-xs shrink-0">
              Complete
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completed}/{total} phases</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(plan.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  )
}
