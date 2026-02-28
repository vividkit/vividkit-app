import { useState } from 'react'
import { ChevronRight, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ThinkingItem } from './thinking-item'
import { ToolCallItem } from './tool-call-item'
import type { AIGroup } from '@/lib/jsonl-session-parser'

interface Props {
  item: AIGroup
  isLast?: boolean
}

export function AIMessage({ item, isLast }: Props) {
  const [toolsExpanded, setToolsExpanded] = useState(true)
  const hasTools = item.toolCalls.length > 0
  const hasText = item.textBlocks.length > 0
  const showDoing = isLast && hasTools && !hasText

  if (!hasTools && !hasText && !item.thinking) return null

  return (
    <div className="flex gap-3 px-4">
      {/* Avatar */}
      <div className="shrink-0 mt-0.5 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>

      {/* Content card */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Thinking block */}
        {item.thinking && <ThinkingItem thinking={item.thinking} />}

        {/* Tool calls — collapsible */}
        {hasTools && (
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setToolsExpanded(!toolsExpanded)}
              className="flex items-center gap-2 w-full px-3 py-2 text-left bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <ChevronRight
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0 ${toolsExpanded ? 'rotate-90' : ''}`}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {item.toolCalls.length} tool call{item.toolCalls.length > 1 ? 's' : ''}
              </span>
              {/* Status dots for tool results */}
              <div className="ml-auto flex gap-1">
                {item.toolCalls.map((tc) =>
                  tc.result !== undefined ? (
                    <span
                      key={tc.id}
                      className={`h-1.5 w-1.5 rounded-full ${tc.isError ? 'bg-destructive' : 'bg-success'}`}
                    />
                  ) : null,
                )}
              </div>
            </button>
            {toolsExpanded && (
              <div className="divide-y divide-border">
                {item.toolCalls.map((tc) => (
                  <ToolCallItem key={tc.id} tool={tc} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Text response */}
        {hasText && (
          <div className="prose-stream">
            {item.textBlocks.map((text, i) => (
              <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                {text}
              </ReactMarkdown>
            ))}
          </div>
        )}

        {/* Doing indicator */}
        {showDoing && (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
            <span>Working...</span>
          </div>
        )}
      </div>
    </div>
  )
}
