import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { PlanWithProgress } from '@/lib/tauri'

interface PlanCardProps {
  plan: PlanWithProgress
}

export function PlanCard({ plan }: PlanCardProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const total = plan.totalPhases
  const completed = plan.donePhases
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
              {t('plans.card.complete')}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('plans.card.phases', { completed, total })}</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
        <p className="text-xs text-muted-foreground">
          {new Intl.DateTimeFormat(i18n.language).format(new Date(plan.createdAt))}
        </p>
      </CardContent>
    </Card>
  )
}
