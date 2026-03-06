import { DeckCard } from './deck-card'
import { useTranslation } from 'react-i18next'
import { useDeckStore } from '@/stores/deck-store'

export function DeckList() {
  const { t } = useTranslation()
  const { decks, setActiveDeck } = useDeckStore()

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
        <DeckCard key={deck.id} deck={deck} onSelect={setActiveDeck} />
      ))}
    </div>
  )
}
