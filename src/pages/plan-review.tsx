import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, FlameKindling } from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { PhaseChecklist, ViewToggle, PlanMarkdownPreview, RelatedTasks, CookSheet } from '@/components/plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { usePlanReview } from '@/hooks/use-plan-review'
import type { PlanView } from '@/components/plans/view-toggle'

export default function PlanReviewPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [view, setView] = useState<PlanView>('phases')
  const [cookOpen, setCookOpen] = useState(false)

  const { data, loading, planContent, togglePhase } = usePlanReview(id)

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <AppHeader title={t('common.labels.loading')} />
        <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
          {t('common.messages.loading')}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col h-full">
        <AppHeader title={t('pages.planReview.notFoundTitle')} />
        <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
          {t('pages.planReview.notFoundText')}{' '}
          <Button variant="link" onClick={() => navigate('/plans')}>{t('pages.planReview.backToPlans')}</Button>
        </div>
      </div>
    )
  }

  const { plan, phases } = data
  const total = phases.length
  const completed = phases.filter((p) => p.status === 'done').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const isNew = searchParams.get('new') === 'true'

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={plan.name} />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/plans')}>
            <ChevronLeft className="size-4 mr-1" /> {t('pages.planReview.plans')}
          </Button>
          <div className="flex-1" />
          <ViewToggle view={view} onChange={setView} />
          <Button size="sm" onClick={() => setCookOpen(true)}>
            <FlameKindling className="size-4 mr-1.5" /> {t('pages.planReview.cookPlan')}
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t('pages.planReview.createdMeta', {
                    date: new Intl.DateTimeFormat(i18n.language).format(new Date(plan.createdAt)),
                    count: total,
                  })}
                </p>
              </div>
              <p className="text-sm font-medium">{pct}%</p>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {t('pages.planReview.phaseProgress', { completed, total, pct })}
            </p>
          </CardContent>
        </Card>

        {view === 'phases' ? (
          <PhaseChecklist phases={phases} onToggle={togglePhase} />
        ) : (
          <PlanMarkdownPreview plan={plan} planContent={planContent} phases={phases} />
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t('pages.planReview.relatedTasks')}</h3>
          <RelatedTasks planId={plan.id} isNew={isNew} />
        </div>
      </div>

      <CookSheet open={cookOpen} onOpenChange={setCookOpen} planId={plan.id} planName={plan.name} />
    </div>
  )
}
