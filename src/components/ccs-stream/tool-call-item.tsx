import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { ToolCall } from '@/lib/jsonl-session-parser'

interface Props {
  tool: ToolCall
}

function getToolSummary(tool: ToolCall): string {
  const entries = Object.entries(tool.input)
  if (entries.length === 0) return ''
  const [, val] = entries[0]
  if (typeof val === 'string') return val.split('\n')[0].slice(0, 80)
  return ''
}

export function ToolCallItem({ tool }: Props) {
  const [expanded, setExpanded] = useState(false)
  const summary = getToolSummary(tool)
  const hasResult = tool.result !== undefined

  return (
    <div className="group">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/30 transition-colors"
      >
        <ChevronRight
          className={`h-3 w-3 text-muted-foreground transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
        />
        {/* Tool name */}
        <span className="text-xs font-semibold text-foreground shrink-0">{tool.name}</span>
        {/* Summary */}
        {summary && (
          <span className="text-xs text-muted-foreground truncate flex-1">{summary}</span>
        )}
        {/* Result indicator */}
        {hasResult && (
          <span className={`ml-auto text-[10px] shrink-0 font-medium ${tool.isError ? 'text-destructive' : 'text-success'}`}>
            {tool.isError ? 'error' : 'done'}
          </span>
        )}
        {!hasResult && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-warning animate-pulse shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-2 space-y-1.5 bg-muted/20">
          <pre className="text-xs font-mono bg-card rounded border border-border p-2 overflow-x-auto whitespace-pre-wrap max-h-48">
            {JSON.stringify(tool.input, null, 2)}
          </pre>
          {hasResult && (
            <pre
              className={`text-xs font-mono rounded border p-2 overflow-x-auto whitespace-pre-wrap max-h-48 ${
                tool.isError
                  ? 'bg-destructive/5 border-destructive/20 text-destructive'
                  : 'bg-card border-border'
              }`}
            >
              {tool.result}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
