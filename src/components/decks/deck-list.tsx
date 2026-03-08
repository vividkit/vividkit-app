import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DeckCard } from './deck-card'
import { useDeckStore } from '@/stores/deck-store'
import { useProjectStore } from '@/stores/project-store'

export function DeckList() {
  const { t } = useTranslation()
  const { decks, loadDecks, setActiveDeck } = useDeckStore()
  const activeProjectId = useProjectStore((s) => s.activeProjectId)

  useEffect(() => {
    if (activeProjectId) {
      loadDecks(activeProjectId)
    }
  }, [activeProjectId, loadDecks])

  if (decks.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        {t('pages.decks.empty')}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map((deck) => (
        <DeckCard
          key={deck.id}
          deck={deck}
          onSelect={(deckId) => activeProjectId && setActiveDeck(activeProjectId, deckId)}
        />
      ))}
    </div>
  )
}
