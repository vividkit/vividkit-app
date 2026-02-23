import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { DeckList, CreateDeckDialog } from '@/components/decks'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/stores/project-store'

export default function DecksPage() {
  const [showCreate, setShowCreate] = useState(false)
  const { projects, activeProjectId } = useProjectStore()
  const activeProject = projects.find((p) => p.id === activeProjectId)

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Decks" subtitle={activeProject?.name} />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Select or create a deck to organize your work</p>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-1" /> New Deck
          </Button>
        </div>
        <DeckList />
      </div>
      <CreateDeckDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  )
}
