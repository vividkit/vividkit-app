import { PlanCard } from './plan-card'
import { usePlanStore } from '@/stores/plan-store'

export function PlanList() {
  const plans = usePlanStore((s) => s.plans)

  if (plans.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No plans yet. Complete a brainstorm session to generate your first plan.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  )
}
