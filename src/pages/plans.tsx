import { AppHeader } from '@/components/layout'
import { useTranslation } from 'react-i18next'
import { PlanList } from '@/components/plans'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PlansPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={t('pages.plans.title')} />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('pages.plans.subtitle')}</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/generate-plan')}>
            <Plus className="size-4 mr-1" /> {t('pages.plans.createNew')}
          </Button>
        </div>
        <PlanList />
      </div>
    </div>
  )
}
