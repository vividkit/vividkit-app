import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, FlameKindling } from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { PhaseChecklist, ViewToggle, PlanMarkdownPreview, RelatedTasks, CookSheet } from '@/components/plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { usePlanStore } from '@/stores/plan-store'
import type { PlanView } from '@/components/plans/view-toggle'

export default function PlanReviewPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [view, setView] = useState<PlanView>('phases')
  const [cookOpen, setCookOpen] = useState(false)

  const plan = usePlanStore((s) => s.plans.find((p) => p.id === id))

  if (!plan) {
    return (
      <div className="flex flex-col h-full">
        <AppHeader title="Plan Not Found" />
        <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
          Plan not found. <Button variant="link" onClick={() => navigate('/plans')}>Back to Plans</Button>
        </div>
      </div>
    )
  }

  const total = plan.phases.length
  const completed = plan.phases.filter((p) => p.status === 'done').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const isNew = searchParams.get('new') === 'true'

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={plan.name} />
      <div className="p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/plans')}>
            <ChevronLeft className="size-4 mr-1" /> Plans
          </Button>
          <div className="flex-1" />
          <ViewToggle view={view} onChange={setView} />
          <Button size="sm" onClick={() => setCookOpen(true)}>
            <FlameKindling className="size-4 mr-1.5" /> Cook Plan
          </Button>
        </div>

        {/* Plan header */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(plan.createdAt).toLocaleDateString()} · {total} phases
                </p>
              </div>
              <p className="text-sm font-medium">{pct}%</p>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground">{completed}/{total} phases completed ({pct}%)</p>
          </CardContent>
        </Card>

        {/* Main content */}
        {view === 'phases' ? <PhaseChecklist plan={plan} /> : <PlanMarkdownPreview plan={plan} />}

        {/* Related tasks */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Related Tasks</h3>
          <RelatedTasks planId={plan.id} isNew={isNew} />
        </div>
      </div>

      <CookSheet open={cookOpen} onOpenChange={setCookOpen} plan={plan} />
    </div>
  )
}
