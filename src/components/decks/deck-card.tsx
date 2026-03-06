import { useNavigate } from 'react-router-dom'
import { Lightbulb, ListTodo } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTaskStore } from '@/stores/task-store'
import { cn } from '@/lib/utils'
import type { Deck } from '@/types'

interface DeckCardProps {
  deck: Deck
  onSelect: (id: string) => void
}

export function DeckCard({ deck, onSelect }: DeckCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tasks = useTaskStore((s) => s.tasks)
  const taskCount = tasks.filter((t) => t.deckId === deck.id).length

  return (
    <Card
      onClick={() => onSelect(deck.id)}
      className={cn(
        'cursor-pointer transition-all hover:border-primary/40',
        deck.isActive && 'border-primary shadow-md',
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <span className={cn(
            'mt-1 size-2.5 rounded-full shrink-0',
            deck.isActive ? 'bg-primary' : 'bg-muted-foreground/40',
          )} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{deck.name}</p>
            {deck.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{deck.description}</p>
            )}
          </div>
          {deck.isActive && (
            <Badge variant="secondary" className="bg-success/10 text-success text-xs shrink-0">
              {t('pages.decks.activeBadge')}
            </Badge>
          )}
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-7"
            onClick={() => navigate('/brainstorm')}
          >
            <Lightbulb className="size-3 mr-1" /> {t('pages.decks.actions.brainstorm')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-7"
            onClick={() => navigate('/tasks')}
          >
            <ListTodo className="size-3 mr-1" /> {t('pages.decks.actions.tasks')}
            {taskCount > 0 && (
              <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1 leading-none">
                {taskCount}
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
