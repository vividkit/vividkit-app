import { useState } from 'react'
import { ChevronRight, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UserMessage as UserMessageType } from '@/lib/jsonl-session-parser'

interface Props {
  item: UserMessageType
}

// Collapsed instruction block — rendered on AI/left side for skill/command injections
function InstructionBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const preview = text.split('\n')[0].slice(0, 72)

  return (
    <div className="flex gap-3 px-4">
      <div className="shrink-0 mt-0.5 h-7 w-7 rounded-full bg-muted flex items-center justify-center">
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0 rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/40 transition-colors"
        >
          <ChevronRight
            className={`h-3 w-3 text-muted-foreground transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
          />
          <span className="text-xs text-muted-foreground italic truncate">
            {expanded ? 'Skill instruction' : `Skill instruction — ${preview}${text.length > 72 ? '…' : ''}`}
          </span>
        </button>
        {expanded && (
          <div className="px-4 pb-3 border-t border-border/40">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto max-h-64">
              {text}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export function UserMessage({ item }: Props) {
  if (item.isInstruction) {
    return <InstructionBlock text={item.text} />
  }

  return (
    <div className="flex justify-end px-4">
      <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-primary text-primary-foreground text-sm leading-relaxed">
        <div className="prose-stream prose-stream-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.text}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
