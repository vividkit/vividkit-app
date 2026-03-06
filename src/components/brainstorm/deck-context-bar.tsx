import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KeyInsightsDialog } from './key-insights-dialog'
import { useDeckStore } from '@/stores/deck-store'

export function DeckContextBar() {
  const { t } = useTranslation()
  const [showInsights, setShowInsights] = useState(false)
  const { decks, activeDeckId } = useDeckStore()
  const activeDeck = decks.find((d) => d.id === activeDeckId)

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('brainstorm.deckContext.activeDeck')}</span>
          {activeDeck ? (
            <Badge variant="outline" className="text-xs">{activeDeck.name}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground italic">{t('brainstorm.deckContext.noneSelected')}</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowInsights(true)} className="text-xs h-7">
          <Lightbulb className="size-3 mr-1" /> {t('brainstorm.deckContext.keyInsights')}
        </Button>
      </div>
      <KeyInsightsDialog open={showInsights} onOpenChange={setShowInsights} />
    </>
  )
}
