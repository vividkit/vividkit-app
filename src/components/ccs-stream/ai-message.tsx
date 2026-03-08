import { useEffect, useMemo, useState } from 'react'
import { Bot, ChevronRight, Circle, Clock3, Loader2, MessageSquareText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ThinkingItem } from './thinking-item'
import { ToolCallItem } from './tool-call-item'
import { SubagentItem } from './subagent-item'
import { isSubagentToolName } from '@/lib/jsonl-session-parser'
import type {
  AIGroup,
  AIGroupDetailItem,
  ToolCall,
} from '@/lib/jsonl-session-parser'
import {
  compareSubagentsByStartTimeThenId,
} from '@/lib/display-item-builder'
import type { Process } from '@/types/subagent'

interface Props {
  item: AIGroup
  isLast?: boolean
  isSessionRunning?: boolean
  taskIdsWithSubagents?: Set<string>
  subagents?: Process[]
  profileName?: string
}

type RenderDetailItem =
  | { type: 'thinking'; thinking: string; key: string }
  | { type: 'tool'; tool: ToolCall; key: string }
  | { type: 'subagent'; subagent: Process; key: string }
  | { type: 'text'; text: string; key: string }

function extractSubagentFinalOutput(subagent: Process): string {
  for (let index = subagent.messages.length - 1; index >= 0; index -= 1) {
    const message = subagent.messages[index]
    if (message.type !== 'assistant') continue
    if (typeof message.content === 'string') {
      const trimmed = message.content.trim()
      if (trimmed) return message.content
      continue
    }
    if (!Array.isArray(message.content)) continue
    const text = message.content
      .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()
    if (text) return text
  }
  return ''
}

function createTextPreview(text: string, maxChars = 140): string {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars)
}

function formatCompactTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return `${value}`
}

function formatDurationMs(value: number): string {
  if (value < 1000) return `${value}ms`
  const totalSeconds = Math.floor(value / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function formatHeaderTime(timestamp: string | undefined): string | null {
  if (!timestamp) return null
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function OutputDetailItem({ text }: { text: string }) {
  const { t } = useTranslation()
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
        <span className="shrink-0 text-xs font-semibold text-foreground">{t('ccsStream.ai.output')}</span>
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
          <div className="prose-stream px-3 py-2" data-search-content>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {text}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}

function buildBaseDetailItems(item: AIGroup, thinkingBlocks: string[], visibleToolCalls: ToolCall[]): AIGroupDetailItem[] {
  if (item.detailItems && item.detailItems.length > 0) return item.detailItems
  return [
    ...thinkingBlocks.map((thinking) => ({ type: 'thinking' as const, thinking })),
    ...visibleToolCalls.map((tool) => ({ type: 'tool' as const, toolId: tool.id })),
    ...item.textBlocks.map((text) => ({ type: 'text' as const, text })),
  ]
}

/** Map CCS profile name to a short display label for the AI header */
function profileDisplayName(profile?: string): string {
  if (!profile) return 'AI'
  const lower = profile.toLowerCase()
  if (lower.includes('claude') || lower === 'default') return 'Claude'
  if (lower.includes('gemini') || lower.includes('google')) return 'Gemini'
  if (lower.includes('glm') || lower.includes('zhipu')) return 'GLM'
  if (lower.includes('kimi') || lower.includes('moonshot')) return 'Kimi'
  if (lower.includes('gpt') || lower.includes('openai')) return 'GPT'
  return profile
}

/** Return a distinct color class based on profile for the avatar icon */
function profileColorClass(profile?: string): string {
  const lower = (profile ?? '').toLowerCase()
  if (lower.includes('gemini') || lower.includes('google')) return 'text-blue-500'
  if (lower.includes('glm') || lower.includes('zhipu')) return 'text-emerald-500'
  if (lower.includes('kimi') || lower.includes('moonshot')) return 'text-violet-500'
  if (lower.includes('gpt') || lower.includes('openai')) return 'text-green-500'
  return 'text-primary' // default / claude
}

export function AIMessage({
  item,
  isLast,
  isSessionRunning,
  subagents = [],
  profileName,
}: Props) {
  const { t } = useTranslation()
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const [hasAutoExpandedRunningState, setHasAutoExpandedRunningState] = useState(false)

  const visibleToolCalls = useMemo(() => item.toolCalls, [item.toolCalls])
  const visibleToolMap = useMemo(
    () => new Map(visibleToolCalls.map((tool) => [tool.id, tool])),
    [visibleToolCalls]
  )
  const thinkingBlocks = useMemo(() => {
    if (item.thinkingBlocks && item.thinkingBlocks.length > 0) {
      return item.thinkingBlocks.filter((thinking) => thinking.trim().length > 0)
    }
    if (item.thinking && item.thinking.trim().length > 0) return [item.thinking]
    return []
  }, [item.thinking, item.thinkingBlocks])
  const baseDetailItems = useMemo(
    () => buildBaseDetailItems(item, thinkingBlocks, visibleToolCalls),
    [item, thinkingBlocks, visibleToolCalls]
  )
  const detailItems = useMemo<RenderDetailItem[]>(() => {
    const items: RenderDetailItem[] = []
    const insertedSubagentIds = new Set<string>()
    const subagentsByTaskId = new Map<string, Process[]>()

    for (const subagent of subagents) {
      if (!subagent.parentTaskId) continue
      const existing = subagentsByTaskId.get(subagent.parentTaskId) ?? []
      existing.push(subagent)
      subagentsByTaskId.set(subagent.parentTaskId, existing)
    }
    for (const list of subagentsByTaskId.values()) {
      list.sort(compareSubagentsByStartTimeThenId)
    }

    for (let index = 0; index < baseDetailItems.length; index += 1) {
      const detailItem = baseDetailItems[index]
      if (detailItem.type === 'thinking') {
        const thinking = detailItem.thinking.trim()
        if (!thinking) continue
        items.push({
          type: 'thinking',
          thinking: detailItem.thinking,
          key: `${item.id}-thinking-${index}`,
        })
        continue
      }

      if (detailItem.type === 'tool') {
        const tool = visibleToolMap.get(detailItem.toolId)
        const linkedSubagents = subagentsByTaskId.get(detailItem.toolId) ?? []
        if (tool) {
          let toolForRender = tool
          if (isSubagentToolName(tool.name) && !tool.result) {
            const completedSubagent = linkedSubagents.find((subagent) => !(subagent.isOngoing ?? false))
            if (completedSubagent) {
              const fallbackOutput = extractSubagentFinalOutput(completedSubagent)
              if (fallbackOutput.trim()) {
                toolForRender = { ...tool, result: fallbackOutput }
              }
            }
          }
          items.push({
            type: 'tool',
            tool: toolForRender,
            key: `${item.id}-tool-${detailItem.toolId}-${index}`,
          })
        }
        for (const subagent of linkedSubagents) {
          if (insertedSubagentIds.has(subagent.id)) continue
          insertedSubagentIds.add(subagent.id)
          items.push({
            type: 'subagent',
            subagent,
            key: `${item.id}-subagent-${detailItem.toolId}-${subagent.id}`,
          })
        }
        continue
      }

      const text = detailItem.text.trim()
      if (!text) continue
      items.push({
        type: 'text',
        text: detailItem.text,
        key: `${item.id}-text-${index}`,
      })
    }

    const orphanSubagents = subagents
      .filter((subagent) => !insertedSubagentIds.has(subagent.id))
      .sort(compareSubagentsByStartTimeThenId)
    for (const orphanSubagent of orphanSubagents) {
      items.push({
        type: 'subagent',
        subagent: orphanSubagent,
        key: `${item.id}-subagent-orphan-${orphanSubagent.id}`,
      })
    }

    return items
  }, [baseDetailItems, item.id, subagents, visibleToolMap])

  const thinkingCount = detailItems.filter((detailItem) => detailItem.type === 'thinking').length
  const toolCount = visibleToolCalls.length
  const subagentCount = detailItems.filter((detailItem) => detailItem.type === 'subagent').length
  const messageCount = detailItems.filter(
    (detailItem) => detailItem.type === 'text' && detailItem.text.trim().length > 0
  ).length
  const detailsSummary = useMemo(
    () =>
      t('ccsStream.ai.detailsSummary', {
        thinkingCount,
        toolCalls: t('ccsStream.ai.toolCallCount', { count: toolCount }),
        messages: t('ccsStream.ai.messageCount', { count: messageCount }),
        subagents: t('ccsStream.ai.subagentCount', { count: subagentCount }),
      }),
    [t, thinkingCount, toolCount, messageCount, subagentCount],
  )
  const totalTokens = useMemo(() => {
    if (!item.usage) return 0
    return (
      item.usage.inputTokens +
      item.usage.outputTokens +
      item.usage.cacheReadTokens +
      item.usage.cacheCreationTokens
    )
  }, [item.usage])
  const headerTime = useMemo(
    () => formatHeaderTime(item.endTimestamp ?? item.timestamp),
    [item.endTimestamp, item.timestamp]
  )
  const hasDetails = detailItems.length > 0
  const isInProgressItem = Boolean(isSessionRunning && isLast)
  useEffect(() => {
    if (!isInProgressItem) return
    if (hasAutoExpandedRunningState) return
    setDetailsExpanded(true)
    setHasAutoExpandedRunningState(true)
  }, [isInProgressItem, hasAutoExpandedRunningState])
  const shouldRenderDetails = hasDetails || isInProgressItem
  const isProcessing = isInProgressItem
  const effectiveDetailsExpanded = detailsExpanded
  const finalBubbleText = useMemo(
    () =>
      detailItems
        .filter((detailItem): detailItem is Extract<RenderDetailItem, { type: 'text' }> => detailItem.type === 'text')
        .map((detailItem) => detailItem.text.trim())
        .filter((text) => text.length > 0)
        .join('\n\n')
        .trim(),
    [detailItems]
  )
  const shouldRenderFinalBubble = Boolean(finalBubbleText && !isInProgressItem)
  const shouldShowProcessing = isProcessing && !shouldRenderFinalBubble

  if (!hasDetails && !finalBubbleText) return null

  return (
    <div className="space-y-2 px-4">
      {shouldRenderDetails && (
        <div className="flex items-center gap-2 rounded-md bg-muted/20 px-2.5 py-2">
          <button
            onClick={() => {
              setDetailsExpanded(!detailsExpanded)
            }}
            className={`group flex min-w-0 flex-1 items-center gap-2 text-left transition-opacity ${isInProgressItem ? '' : 'hover:opacity-90'}`}
          >
            <ChevronRight
              className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${effectiveDetailsExpanded ? 'rotate-90' : ''}`}
            />
            <Bot className={`h-3.5 w-3.5 shrink-0 ${profileColorClass(profileName)}`} />
            <span className="shrink-0 text-xs font-semibold text-foreground">{profileDisplayName(profileName)}</span>
            <span className="shrink-0 text-xs text-muted-foreground">·</span>
            <span className="truncate text-xs text-muted-foreground">
              {detailsSummary}
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            {totalTokens > 0 && <span className="tabular-nums">{formatCompactTokens(totalTokens)}</span>}
            {(item.durationMs ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock3 className="h-3 w-3" />
                {formatDurationMs(item.durationMs ?? 0)}
              </span>
            )}
            {headerTime && (
              <span className="inline-flex items-center gap-1 tabular-nums text-[11px]">
                <Circle className="h-2.5 w-2.5" />
                {headerTime}
              </span>
            )}
          </div>
        </div>
      )}

      {effectiveDetailsExpanded && shouldRenderDetails && (
        <div className="ml-5 space-y-1.5">
          {detailItems.map((detailItem) => {
            if (detailItem.type === 'thinking') {
              return <ThinkingItem key={detailItem.key} thinking={detailItem.thinking} />
            }
            if (detailItem.type === 'tool') {
              return <ToolCallItem key={detailItem.key} tool={detailItem.tool} />
            }
            if (detailItem.type === 'subagent') {
              return <SubagentItem key={detailItem.key} subagent={detailItem.subagent} />
            }
            if (shouldRenderFinalBubble) return null
            return <OutputDetailItem key={detailItem.key} text={detailItem.text} />
          })}
        </div>
      )}

      {shouldShowProcessing && (
        <div className="ml-5 flex items-center gap-2 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-xs text-info">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{t('ccsStream.ai.sessionInProgress')}</span>
        </div>
      )}

      {shouldRenderFinalBubble && (
        <div className="flex gap-2 px-1">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bot className={`h-3.5 w-3.5 ${profileColorClass(profileName)}`} />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden rounded-2xl rounded-bl-sm border border-border bg-muted/20">
            <div className="prose-stream px-4 py-3" data-search-content>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {finalBubbleText}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
