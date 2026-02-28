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
  isMeta?: boolean
  // user/assistant entries
  message?: {
    role: 'user' | 'assistant'
    content: string | ContentBlock[]
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
  thinking?: string
  textBlocks: string[]
  toolCalls: ToolCall[]
}

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

export function parseSessionLine(line: string): RawSessionEntry | null {
  try {
    const entry = JSON.parse(line) as RawSessionEntry
    if (!entry || typeof entry !== 'object') return null
    return entry
  } catch {
    return null
  }
}

// Map tool name + input to a human-readable label (mimics Claude Code Desktop)
export function getToolLabel(name: string, input: Record<string, unknown>): string {
  // Task tool: use subject field
  if (name === 'Task' || name === 'TodoWrite' || name === 'TodoRead') {
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
      let thinking: string | undefined
      const textBlocks: string[] = []
      const toolCalls: ToolCall[] = []

      for (const block of blocks) {
        if (block.type === 'thinking') thinking = block.thinking
        else if (block.type === 'text' && block.text.trim()) textBlocks.push(block.text)
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
          }
        }
      }

      if (thinking || textBlocks.length > 0 || toolCalls.length > 0) {
        items.push({ type: 'ai', id, timestamp, thinking, textBlocks, toolCalls })
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

  return items
}
