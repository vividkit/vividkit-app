import { useState } from 'react'
import { ChevronRight, Brain } from 'lucide-react'

interface Props {
  thinking: string
}

export function ThinkingItem({ thinking }: Props) {
  const [expanded, setExpanded] = useState(false)
  const preview = thinking.split('\n')[0].slice(0, 80)

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/40 transition-colors"
      >
        <Brain className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <ChevronRight
          className={`h-3 w-3 text-muted-foreground transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="text-xs text-muted-foreground italic">
          {expanded ? 'Thinking' : `Thinking — ${preview}${thinking.length > 80 ? '…' : ''}`}
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-3 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed border-t border-border/40">
          {thinking}
        </div>
      )}
    </div>
  )
}
