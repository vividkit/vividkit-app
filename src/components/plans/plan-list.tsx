import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PlanCard } from './plan-card'
import { usePlanStore } from '@/stores/plan-store'
import { useDeckStore } from '@/stores/deck-store'

export function PlanList() {
  const { t } = useTranslation()
  const plans = usePlanStore((s) => s.plans)
  const loadPlans = usePlanStore((s) => s.loadPlans)
  const { activeDeckId } = useDeckStore()

  useEffect(() => {
    if (activeDeckId) void loadPlans(activeDeckId)
  }, [activeDeckId, loadPlans])

  if (plans.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        {t('plans.list.empty')}
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
