import { PlanCard } from './plan-card'
import { useTranslation } from 'react-i18next'
import { usePlanStore } from '@/stores/plan-store'

export function PlanList() {
  const { t } = useTranslation()
  const plans = usePlanStore((s) => s.plans)

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
