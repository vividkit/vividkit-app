import { useState } from 'react'
import { ChevronRight, Brain } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  thinking: string
}

export function ThinkingItem({ thinking }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const preview = thinking.replace(/\s+/g, ' ').trim().slice(0, 140)

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-muted/35"
      >
        <Brain className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="shrink-0 text-xs font-semibold text-foreground">{t('common.labels.thinking')}</span>
        <span className="shrink-0 text-xs text-muted-foreground">-</span>
        <span className="flex-1 truncate text-xs text-muted-foreground">
          {preview}
        </span>
        <ChevronRight
          className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="ml-5 overflow-hidden rounded-md border border-border/60 bg-muted/20">
          <div className="whitespace-pre-wrap px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            {thinking}
          </div>
        </div>
      )}
    </div>
  )
}
