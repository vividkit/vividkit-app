// JSONL entry types from Claude Code session files
export type EntryType =
  | 'user'
  | 'assistant'
  | 'system'
  | 'summary'
  | 'file-history-snapshot'
  | 'queue-operation'
  | 'progress'

export interface RawSessionEntry {
  type: EntryType
  uuid?: string
  timestamp?: string
  sessionId?: string
  parentUuid?: string | null
  parent_uuid?: string | null
  isMeta?: boolean
  sourceToolUseID?: string
  sourceToolUseId?: string
  source_tool_use_id?: string
  toolUseResult?: unknown
  tool_use_result?: unknown
  // user/assistant entries
  message?: {
    id?: string
    type?: string
    role: 'user' | 'assistant'
    model?: string
    content: string | ContentBlock[]
    usage?: {
      input_tokens?: number
      output_tokens?: number
      cache_read_input_tokens?: number
      cache_creation_input_tokens?: number
    }
  }
  // progress entries
  data?: {
    type: string
    hookEvent?: string
    hookName?: string
    command?: string
  }
  // system entries
  subtype?: string
}

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'thinking'; thinking: string; signature?: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string | ContentBlock[]; is_error?: boolean }

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  result?: string
  isError?: boolean
}

function splitToolNameParts(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 0)
}

export function isSubagentToolName(name: string): boolean {
  const canonical = splitToolNameParts(name).join('')
  return canonical === 'task'
    || canonical === 'agent'
    || canonical === 'taskcreate'
    || canonical === 'agentcreate'
}

export interface UserMessage {
  type: 'user'
  id: string
  timestamp: string
  text: string
  // Marks long system/skill prompt injections — rendered collapsed on AI side
  isInstruction?: boolean
}

export interface AIGroup {
  type: 'ai'
  id: string
  timestamp: string
  endTimestamp?: string
  durationMs?: number
  usage?: AIUsage
  thinking?: string
  thinkingBlocks?: string[]
  textBlocks: string[]
  toolCalls: ToolCall[]
  detailItems?: AIGroupDetailItem[]
}

export interface AIUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
}

export type AIGroupDetailItem =
  | { type: 'thinking'; thinking: string }
  | { type: 'tool'; toolId: string }
  | { type: 'text'; text: string }

// System/session event line (e.g. "Initialized your session")
export interface SystemLine {
  type: 'system'
  id: string
  timestamp: string
  label: string
}

export interface QuestionOption {
  label: string
  description?: string
}

export interface Question {
  question: string
  header: string
  options: QuestionOption[]
  multiSelect?: boolean
}

// AskUserQuestion tool_use rendered as interactive card
export interface QuestionCard {
  type: 'question'
  id: string
  timestamp: string
  toolUseId: string
  questions: Question[]
}

export type ConversationItem = UserMessage | AIGroup | SystemLine | QuestionCard

type SessionActivityType =
  | 'text_output'
  | 'thinking'
  | 'tool_use'
  | 'tool_result'
  | 'interruption'
  | 'exit_plan_mode'

interface SessionActivity {
  type: SessionActivityType
  index: number
}

export interface SessionStreamState {
  isOngoing: boolean
  hasEndingEvent: boolean
}

export function parseSessionLine(line: string): RawSessionEntry | null {
  try {
    const entry = JSON.parse(line) as RawSessionEntry
    if (!entry || typeof entry !== 'object') return null
    return entry
  } catch {
    return null
  }
}

function isToolUseRejection(toolUseResult: unknown): boolean {
  return toolUseResult === 'User rejected tool use'
}

function isShutdownResponse(block: { name: string; input: Record<string, unknown> }): boolean {
  return block.name === 'SendMessage'
    && block.input?.type === 'shutdown_response'
    && block.input?.approve === true
}

function isEndingActivityType(type: SessionActivityType): boolean {
  return type === 'text_output' || type === 'interruption' || type === 'exit_plan_mode'
}

function getEntryToolUseResult(entry: RawSessionEntry): unknown {
  if (entry.toolUseResult !== undefined) return entry.toolUseResult
  return entry.tool_use_result
}

function buildSessionActivities(entries: RawSessionEntry[]): SessionActivity[] {
  const activities: SessionActivity[] = []
  const shutdownToolIds = new Set<string>()
  let activityIndex = 0

  for (const entry of entries) {
    if (!entry.message) continue
    const { role, content } = entry.message

    if (role === 'assistant') {
      if (typeof content === 'string') {
        if (content.trim().length > 0) {
          activities.push({ type: 'text_output', index: activityIndex++ })
        }
        continue
      }

      for (const block of content) {
        if (block.type === 'thinking' && block.thinking.trim().length > 0) {
          activities.push({ type: 'thinking', index: activityIndex++ })
          continue
        }

        if (block.type === 'tool_use' && block.id) {
          if (block.name === 'ExitPlanMode') {
            activities.push({ type: 'exit_plan_mode', index: activityIndex++ })
          } else if (isShutdownResponse(block)) {
            shutdownToolIds.add(block.id)
            activities.push({ type: 'interruption', index: activityIndex++ })
          } else {
            activities.push({ type: 'tool_use', index: activityIndex++ })
          }
          continue
        }

        if (block.type === 'text' && block.text.trim().length > 0) {
          activities.push({ type: 'text_output', index: activityIndex++ })
        }
      }
      continue
    }

    if (role !== 'user') continue
    const isRejection = isToolUseRejection(getEntryToolUseResult(entry))

    if (typeof content === 'string') {
      if (content.startsWith('[Request interrupted by user')) {
        activities.push({ type: 'interruption', index: activityIndex++ })
      }
      continue
    }

    for (const block of content) {
      if (block.type === 'tool_result' && block.tool_use_id) {
        if (shutdownToolIds.has(block.tool_use_id) || isRejection) {
          activities.push({ type: 'interruption', index: activityIndex++ })
        } else {
          activities.push({ type: 'tool_result', index: activityIndex++ })
        }
        continue
      }

      if (block.type === 'text' && block.text.startsWith('[Request interrupted by user')) {
        activities.push({ type: 'interruption', index: activityIndex++ })
      }
    }
  }

  return activities
}

function isOngoingFromActivities(activities: SessionActivity[]): boolean {
  if (activities.length === 0) return false

  let lastEndingIndex = -1
  for (let i = activities.length - 1; i >= 0; i -= 1) {
    if (isEndingActivityType(activities[i].type)) {
      lastEndingIndex = activities[i].index
      break
    }
  }

  if (lastEndingIndex === -1) {
    return activities.some(
      (activity) =>
        activity.type === 'thinking'
        || activity.type === 'tool_use'
        || activity.type === 'tool_result'
    )
  }

  return activities.some(
    (activity) =>
      activity.index > lastEndingIndex
      && (
        activity.type === 'thinking'
        || activity.type === 'tool_use'
        || activity.type === 'tool_result'
      )
  )
}

export function analyzeSessionStreamState(entries: RawSessionEntry[]): SessionStreamState {
  const activities = buildSessionActivities(entries)
  return {
    isOngoing: isOngoingFromActivities(activities),
    hasEndingEvent: activities.some((activity) => isEndingActivityType(activity.type)),
  }
}

export function checkSessionEntriesOngoing(entries: RawSessionEntry[]): boolean {
  return analyzeSessionStreamState(entries).isOngoing
}

// Map tool name + input to a human-readable label (mimics Claude Code Desktop)
export function getToolLabel(name: string, input: Record<string, unknown>): string {
  // Task tool: use subject field
  if (isSubagentToolName(name) || name === 'TodoWrite' || name === 'TodoRead') {
    const subject = input.subject ?? input.description ?? input.prompt
    if (typeof subject === 'string') return subject.split('\n')[0].slice(0, 100)
  }
  // File operations: use path/file_path
  if (['Read', 'Write', 'Edit', 'MultiEdit', 'Glob', 'Grep'].includes(name)) {
    const path = input.file_path ?? input.path ?? input.pattern ?? input.glob
    if (typeof path === 'string') return path
  }
  // Bash: use description then command
  if (name === 'Bash') {
    const desc = input.description
    if (typeof desc === 'string') return desc.slice(0, 100)
    const cmd = input.command
    if (typeof cmd === 'string') return cmd.split('\n')[0].slice(0, 100)
  }
  // WebFetch / WebSearch
  if (name === 'WebFetch' || name === 'WebSearch') {
    const url = input.url ?? input.query
    if (typeof url === 'string') return url.slice(0, 100)
  }
  // Default: first string value
  const first = Object.values(input)[0]
  if (typeof first === 'string') return first.split('\n')[0].slice(0, 100)
  return name
}

function extractText(content: string | ContentBlock[]): string {
  if (typeof content === 'string') return content
  return content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
}

function toNonNegativeNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }
  return 0
}

function parseAIUsage(entry: RawSessionEntry): AIUsage | undefined {
  const usage = entry.message?.usage
  if (!usage || typeof usage !== 'object') return undefined
  const parsed: AIUsage = {
    inputTokens: toNonNegativeNumber(usage.input_tokens),
    outputTokens: toNonNegativeNumber(usage.output_tokens),
    cacheReadTokens: toNonNegativeNumber(usage.cache_read_input_tokens),
    cacheCreationTokens: toNonNegativeNumber(usage.cache_creation_input_tokens),
  }
  if (
    parsed.inputTokens === 0 &&
    parsed.outputTokens === 0 &&
    parsed.cacheReadTokens === 0 &&
    parsed.cacheCreationTokens === 0
  ) {
    return undefined
  }
  return parsed
}

function toTimestampMs(timestamp: string | undefined): number | undefined {
  if (!timestamp) return undefined
  const ms = Date.parse(timestamp)
  if (!Number.isFinite(ms)) return undefined
  return ms
}

function computeDurationMs(startTimestamp: string | undefined, endTimestamp: string | undefined): number | undefined {
  const startMs = toTimestampMs(startTimestamp)
  const endMs = toTimestampMs(endTimestamp)
  if (startMs === undefined || endMs === undefined) return undefined
  return Math.max(0, endMs - startMs)
}

// Strips Claude Code XML-like injected tags from user messages
function stripMetaTags(text: string): string {
  return text.replace(/<[^>]+>[^<]*<\/[^>]+>/g, '').trim()
}

// Detect if text is a skill/command instruction injection (long prompt, not user-typed)
// Heuristic: >400 chars plain text, or contains known skill injection markers
function isInstructionText(raw: string, stripped: string): boolean {
  // If raw had XML tags that were stripped away significantly → instruction
  if (raw.length > stripped.length + 50) return true
  // Long plain text without user-readable conversational pattern → instruction
  if (stripped.length > 400) return true
  return false
}

// Determine if a progress/system entry should render as a SystemLine
function toSystemLine(entry: RawSessionEntry): SystemLine | null {
  const id = entry.uuid ?? String(Math.random())
  const timestamp = entry.timestamp ?? ''

  if (entry.type === 'progress' && entry.data) {
    const { hookEvent, type: dataType } = entry.data
    // Only show session start
    if (hookEvent === 'SessionStart' && dataType === 'hook_progress') {
      return { type: 'system', id, timestamp, label: 'Initialized your session' }
    }
    return null
  }

  if (entry.type === 'system' && entry.subtype === 'init') {
    return { type: 'system', id, timestamp, label: 'Initialized your session' }
  }

  return null
}

export function sessionEntriesToConversation(entries: RawSessionEntry[]): ConversationItem[] {
  const items: ConversationItem[] = []
  // Collect tool results from user entries (tool_result blocks)
  const toolResults = new Map<string, { result: string; isError: boolean }>()
  // Track seen SessionStart ids to deduplicate
  const seenSystemIds = new Set<string>()
  // Track seen AskUserQuestion tool_use ids to prevent duplicate QuestionCards
  const seenQuestionIds = new Set<string>()

  // Pre-pass: collect all tool_result IDs so we can filter out already-answered QuestionCards
  const resolvedToolUseIds = new Set<string>()
  for (const entry of entries) {
    if (!entry.message) continue
    const { role, content } = entry.message
    if (role === 'user' && Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'tool_result') resolvedToolUseIds.add(block.tool_use_id)
      }
    }
  }

  for (const entry of entries) {
    // --- Progress / system lines ---
    if (entry.type === 'progress' || entry.type === 'system') {
      const sysLine = toSystemLine(entry)
      if (sysLine && !seenSystemIds.has(sysLine.label)) {
        seenSystemIds.add(sysLine.label)
        items.push(sysLine)
      }
      continue
    }

    if (!entry.message) continue

    const { role, content } = entry.message
    const id = entry.uuid ?? String(Math.random())
    const timestamp = entry.timestamp ?? ''

    if (role === 'user') {
      if (typeof content === 'string') {
        const text = stripMetaTags(content)
        if (text) items.push({ type: 'user', id, timestamp, text, isInstruction: isInstructionText(content, text) })
      } else {
        for (const block of content) {
          if (block.type === 'tool_result') {
            const resultText =
              typeof block.content === 'string' ? block.content : extractText(block.content)
            toolResults.set(block.tool_use_id, { result: resultText, isError: block.is_error ?? false })
          } else if (block.type === 'text') {
            const text = stripMetaTags(block.text)
            if (text) items.push({ type: 'user', id, timestamp, text, isInstruction: isInstructionText(block.text, text) })
          }
        }
      }
    } else if (role === 'assistant') {
      const blocks = typeof content === 'string' ? [] : content
      const thinkingBlocks: string[] = []
      const textBlocks: string[] = []
      const toolCalls: ToolCall[] = []
      const detailItems: AIGroupDetailItem[] = []
      const usage = parseAIUsage(entry)

      if (typeof content === 'string' && content.trim()) {
        textBlocks.push(content)
        detailItems.push({ type: 'text', text: content })
      }

      for (const block of blocks) {
        if (block.type === 'thinking' && block.thinking.trim()) {
          thinkingBlocks.push(block.thinking)
          detailItems.push({ type: 'thinking', thinking: block.thinking })
        }
        else if (block.type === 'text' && block.text.trim()) {
          textBlocks.push(block.text)
          detailItems.push({ type: 'text', text: block.text })
        }
        else if (block.type === 'tool_use') {
          // Extract AskUserQuestion as its own QuestionCard item
          if (block.name === 'AskUserQuestion') {
            const rawQuestions = block.input.questions
            // Skip if already answered (tool_result exists) or duplicate
            if (Array.isArray(rawQuestions) && !seenQuestionIds.has(block.id) && !resolvedToolUseIds.has(block.id)) {
              seenQuestionIds.add(block.id)
              const questions: Question[] = rawQuestions.map((q: Record<string, unknown>) => ({
                question: typeof q.question === 'string' ? q.question : '',
                header: typeof q.header === 'string' ? q.header : '',
                options: Array.isArray(q.options)
                  ? (q.options as Record<string, unknown>[]).map((o) => ({
                      label: typeof o.label === 'string' ? o.label : '',
                      description: typeof o.description === 'string' ? o.description : undefined,
                    }))
                  : [],
                multiSelect: typeof q.multiSelect === 'boolean' ? q.multiSelect : false,
              }))
              items.push({ type: 'question', id: block.id, timestamp, toolUseId: block.id, questions })
            }
          } else {
            toolCalls.push({ id: block.id, name: block.name, input: block.input })
            detailItems.push({ type: 'tool', toolId: block.id })
          }
        }
      }

      const thinking = thinkingBlocks.length > 0 ? thinkingBlocks.join('\n\n') : undefined
      if (thinking || textBlocks.length > 0 || toolCalls.length > 0) {
        items.push({
          type: 'ai',
          id,
          timestamp,
          endTimestamp: timestamp,
          durationMs: 0,
          usage,
          thinking,
          thinkingBlocks,
          textBlocks,
          toolCalls,
          detailItems,
        })
      }
    }
  }

  // Merge tool results into AI groups
  for (const item of items) {
    if (item.type === 'ai') {
      for (const tc of item.toolCalls) {
        const result = toolResults.get(tc.id)
        if (result) {
          tc.result = result.result
          tc.isError = result.isError
        }
      }
    }
  }

  return mergeAdjacentAIGroups(items)
}

function mergeAdjacentAIGroups(items: ConversationItem[]): ConversationItem[] {
  const merged: ConversationItem[] = []

  for (const item of items) {
    if (item.type !== 'ai') {
      merged.push(item)
      continue
    }

    const previous = merged[merged.length - 1]
    if (!previous || previous.type !== 'ai') {
      merged.push({
        ...item,
        thinkingBlocks: item.thinkingBlocks ?? (item.thinking ? [item.thinking] : []),
      })
      continue
    }

    const previousThinkingBlocks = previous.thinkingBlocks ?? (previous.thinking ? [previous.thinking] : [])
    const currentThinkingBlocks = item.thinkingBlocks ?? (item.thinking ? [item.thinking] : [])
    const combinedThinkingBlocks = [...previousThinkingBlocks, ...currentThinkingBlocks]

    previous.toolCalls.push(...item.toolCalls)
    previous.textBlocks.push(...item.textBlocks)
    previous.detailItems = [
      ...(previous.detailItems ?? []),
      ...(item.detailItems ?? []),
    ]
    previous.endTimestamp = item.endTimestamp ?? item.timestamp
    previous.durationMs = computeDurationMs(previous.timestamp, previous.endTimestamp)
    if (item.usage) previous.usage = item.usage
    previous.thinkingBlocks = combinedThinkingBlocks
    previous.thinking = combinedThinkingBlocks.length > 0
      ? combinedThinkingBlocks.join('\n\n')
      : undefined
  }

  return merged
}
