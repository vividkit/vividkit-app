import { useMemo, useState } from 'react'
import { ChevronRight, FileText, MessageSquareText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { SubagentMessage, SubagentToolCall } from '@/types/subagent'
import { ToolCallItem } from './tool-call-item'
import { ThinkingItem } from './thinking-item'
import type { ToolCall } from '@/lib/jsonl-session-parser'

interface Props {
  messages: SubagentMessage[]
  hideTextRows?: boolean
}

function createTextPreview(text: string, maxChars = 140): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, maxChars)
}

function OutputDetailItem({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const preview = useMemo(() => createTextPreview(text), [text])
  if (!preview) return null

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-muted/35"
      >
        <MessageSquareText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="shrink-0 text-xs font-semibold text-foreground">Output</span>
        <span className="shrink-0 text-xs text-muted-foreground">-</span>
        <span className="flex-1 truncate text-xs text-muted-foreground">{preview}</span>
        <ChevronRight
          className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </button>
      {expanded && (
        <div className="ml-5 overflow-hidden rounded-md border border-border/60 bg-muted/20">
          <div className="prose-stream px-3 py-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {text}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}

export function ExecutionTrace({ messages, hideTextRows = false }: Props) {
  if (messages.length === 0) {
    return <div className="text-xs text-muted-foreground">No execution trace available</div>
  }

  return (
    <div className="space-y-3">
      {messages.map((msg, index) => (
        <MessageItem key={`${msg.uuid}-${index}`} message={msg} hideTextRows={hideTextRows} />
      ))}
    </div>
  )
}

function MessageItem({ message, hideTextRows }: { message: SubagentMessage; hideTextRows: boolean }) {
  if (message.type === 'user') {
    return <UserMessageItem message={message} hideTextRows={hideTextRows} />
  }
  if (message.type === 'assistant') {
    return <AssistantMessageItem message={message} hideTextRows={hideTextRows} />
  }
  return null
}

function UserMessageItem({
  message,
  hideTextRows,
}: {
  message: SubagentMessage
  hideTextRows: boolean
}) {
  if (hideTextRows) return null
  if (message.toolResults && message.toolResults.length > 0) {
    return null
  }

  const content = typeof message.content === 'string' ? message.content : extractTextContent(message.content)

  if (!content.trim()) return null

  return (
    <div className="flex gap-2">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted">
        <FileText className="h-2.5 w-2.5 text-muted-foreground" />
      </div>
      <div className="flex-1 whitespace-pre-wrap text-xs text-muted-foreground">{content}</div>
    </div>
  )
}

function AssistantMessageItem({
  message,
  hideTextRows,
}: {
  message: SubagentMessage
  hideTextRows: boolean
}) {
  const segments = buildAssistantSegments(message, hideTextRows)
  if (segments.length === 0) return null

  return (
    <div className="space-y-1.5">
      {segments.map((segment, index) => {
        if (segment.type === 'thinking') {
          return <ThinkingItem key={`${message.uuid}-thinking-${index}`} thinking={segment.thinking} />
        }
        if (segment.type === 'tool') {
          return (
            <ToolCallItem
              key={`${message.uuid}-tool-${segment.tool.id}-${index}`}
              tool={toToolCall(segment.tool)}
            />
          )
        }
        return <OutputDetailItem key={`${message.uuid}-text-${index}`} text={segment.text} />
      })}
    </div>
  )
}

function toToolCall(tc: SubagentToolCall): ToolCall {
  return {
    id: tc.id,
    name: tc.name,
    input: tc.input,
    result: tc.result,
    isError: tc.isError,
  }
}

function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .filter((b): b is { type: 'text'; text: string } =>
      typeof b === 'object' && b !== null && b.type === 'text'
    )
    .map((b) => b.text)
    .join('\n')
}

type AssistantSegment = { type: 'thinking'; thinking: string } | { type: 'tool'; tool: SubagentToolCall } | { type: 'text'; text: string }

function buildAssistantSegments(
  message: SubagentMessage,
  hideTextRows: boolean
): AssistantSegment[] {
  const toolCallById = new Map((message.toolCalls ?? []).map((toolCall) => [toolCall.id, toolCall]))
  const segments: AssistantSegment[] = []

  if (!Array.isArray(message.content)) {
    const text = typeof message.content === 'string' ? message.content.trim() : ''
    if (text && !hideTextRows) segments.push({ type: 'text', text })
    return segments
  }

  for (const block of message.content) {
    if (block.type === 'thinking' && typeof block.thinking === 'string') {
      const thinkingText = block.thinking.trim()
      if (thinkingText) {
        segments.push({ type: 'thinking', thinking: thinkingText })
      }
      continue
    }

    if (block.type === 'tool_use') {
      const enrichedToolCall = toolCallById.get(block.id) ?? {
        id: block.id,
        name: block.name,
        input: block.input,
      }
      segments.push({ type: 'tool', tool: enrichedToolCall })
      continue
    }

    if (block.type === 'text' && typeof block.text === 'string') {
      const text = block.text.trim()
      if (text && !hideTextRows) {
        segments.push({ type: 'text', text: block.text })
      }
    }
  }

  return segments
}
