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
  const isInlineTool = (name: string) => /(^|[./:])(read|write|edit|multiedit)$/i.test(name)
  const inlineTools = item.toolCalls.filter((tool) => isInlineTool(tool.name))
  const listedTools = item.toolCalls.filter((tool) => !isInlineTool(tool.name))
  const hasListedTools = listedTools.length > 0
  const hasTools = item.toolCalls.length > 0
  const hasText = item.textBlocks.length > 0
  const showDoing = isLast && hasTools && !hasText

  if (!hasTools && !hasText && !item.thinking) return null

  return (
    <div className="flex gap-3 px-4">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {item.thinking && <ThinkingItem thinking={item.thinking} />}

        {inlineTools.length > 0 && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-2">
            {inlineTools.map((tool) => (
              <ToolCallItem key={tool.id} tool={tool} defaultExpanded hideHeader />
            ))}
          </div>
        )}

        {hasListedTools && (
          <div className="overflow-hidden rounded-lg border border-border">
            <button
              onClick={() => setToolsExpanded(!toolsExpanded)}
              className="flex w-full items-center gap-2 bg-muted/40 px-3 py-2 text-left transition-colors hover:bg-muted/60"
            >
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${toolsExpanded ? 'rotate-90' : ''}`}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {listedTools.length} tool call{listedTools.length > 1 ? 's' : ''}
              </span>
              <div className="ml-auto flex gap-1">
                {listedTools.map((tool) =>
                  tool.result !== undefined ? (
                    <span
                      key={tool.id}
                      className={`h-1.5 w-1.5 rounded-full ${tool.isError ? 'bg-destructive' : 'bg-success'}`}
                    />
                  ) : null,
                )}
              </div>
            </button>
            {toolsExpanded && (
              <div className="divide-y divide-border">
                {listedTools.map((tool) => (
                  <ToolCallItem key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </div>
        )}

        {hasText && (
          <div className="prose-stream">
            {item.textBlocks.map((text, i) => (
              <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                {text}
              </ReactMarkdown>
            ))}
          </div>
        )}

        {showDoing && (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
            <span>Working...</span>
          </div>
        )}
      </div>
    </div>
  )
}
