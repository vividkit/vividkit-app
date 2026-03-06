import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout'
import { DeckList, CreateDeckDialog } from '@/components/decks'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/stores/project-store'

export default function DecksPage() {
  const { t } = useTranslation()
  const [showCreate, setShowCreate] = useState(false)
  const { projects, activeProjectId } = useProjectStore()
  const activeProject = projects.find((p) => p.id === activeProjectId)

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={t('pages.decks.title')} subtitle={activeProject?.name} />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('pages.decks.subtitle')}</p>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-1" /> {t('pages.decks.newDeck')}
          </Button>
        </div>
        <DeckList />
      </div>
      <CreateDeckDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  )
}
