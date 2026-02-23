import { useNavigate } from 'react-router-dom'
import { ExternalLink, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useBrainstormStore } from '@/stores/brainstorm-store'
import { useDeckStore } from '@/stores/deck-store'

interface KeyInsightsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyInsightsDialog({ open, onOpenChange }: KeyInsightsDialogProps) {
  const navigate = useNavigate()
  const { insights } = useBrainstormStore()
  const { activeDeckId } = useDeckStore()

  const filtered = insights.filter((i) => i.deckId === activeDeckId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Key Insights</DialogTitle>
        </DialogHeader>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No insights saved yet for this deck.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filtered.map((insight) => (
              <div key={insight.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(insight.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => { navigate('/brainstorm'); onOpenChange(false) }}
                >
                  <ExternalLink className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-7 text-destructive shrink-0">
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
