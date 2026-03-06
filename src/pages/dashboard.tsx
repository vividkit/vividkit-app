import { AppHeader } from '@/components/layout'
import { useTranslation } from 'react-i18next'
import { StatsCards, QuickActions } from '@/components/dashboard'
import { useDeckStore } from '@/stores/deck-store'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { decks, activeDeckId } = useDeckStore()
  const activeDeck = decks.find((d) => d.id === activeDeckId)

  return (
    <div className="flex flex-col h-full">
      <AppHeader
        title={t('pages.dashboard.title')}
        subtitle={activeDeck ? t('pages.dashboard.subtitleActiveDeck', { name: activeDeck.name }) : undefined}
      />
      <div className="p-6 space-y-6">
        <StatsCards />
        <QuickActions />
      </div>
    </div>
  )
}
