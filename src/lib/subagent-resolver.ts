/**
 * Subagent Resolver
 *
 * Links Task calls to subagent files using three-phase matching:
 * 1. Result-based: Extract agentId from tool_result, match by ID
 * 2. Description-based: Team members match by <teammate-message summary="">
 * 3. Positional: Fallback for unmatched subagents (no wrap-around)
 *
 * Ported from claude-devtools/src/main/services/discovery/SubagentResolver.ts
 */

import type { Process, SessionMetrics, SubagentMessage, RawSubagentData } from '@/types/subagent'
import { isSubagentToolName, type ToolCall, type RawSessionEntry, type ContentBlock } from '@/lib/jsonl-session-parser'
import { extractTeammateSummary } from '@/lib/teammate-message-parser'

/** Parallel detection window in milliseconds */
const PARALLEL_WINDOW_MS = 100
const MAX_TEAM_CHAIN_DEPTH = 10

type SubagentSessionEntry = RawSessionEntry & {
  parentUuid?: string | null
  parent_uuid?: string | null
  sourceToolUseID?: string
  sourceToolUseId?: string
  source_tool_use_id?: string
  toolUseResult?: unknown
  tool_use_result?: unknown
}

type ToolResultBlock = {
  type: 'tool_result'
  tool_use_id: string
  content: string | ContentBlock[]
  is_error?: boolean
}

type LinkMethod = 'result' | 'team' | 'fallback'

// =============================================================================
// Main Resolution Functions
// =============================================================================

/** Resolve all subagents for a session directory */
export async function resolveSubagents(
  sessionDir: string,
  taskCalls: ToolCall[],
  entries: RawSessionEntry[]
): Promise<Process[]> {
  const { resolveSubagents: fetchSubagents } = await import('@/lib/tauri')

  // Fetch raw subagent data from Rust backend
  const rawData = await fetchSubagents(sessionDir)
  if (rawData.length === 0) return []

  // Parse raw data into Process objects
  const subagents: Process[] = rawData.map(parseRawSubagent)

  // Filter to only Task calls
  const taskCallsOnly = taskCalls.filter((tc) => isSubagentToolName(tc.name))

  // Link to Task calls
  linkToTaskCalls(subagents, taskCallsOnly, entries)

  // Propagate parent metadata to continuation files
  propagateContinuationMetadata(subagents)

  // Enrich teammate colors from parent session tool results
  enrichTeamColors(subagents, entries)

  // Detect parallel execution
  detectParallelExecution(subagents)

  // Deterministic order for stable rendering
  subagents.sort(compareByStartTimeThenId)

  return subagents
}

/** Parse RawSubagentData from Rust into Process object */
function parseRawSubagent(raw: RawSubagentData): Process {
  const messages = parseSubagentMessages(raw.raw_messages)
  const startTime = new Date(raw.start_time)
  const endTime = new Date(raw.end_time)

  return {
    id: raw.id,
    filePath: raw.file_path,
    messages,
    startTime,
    endTime,
    durationMs: raw.duration_ms,
    metrics: calculateMetrics(messages, raw.duration_ms),
    isParallel: false,
    isOngoing: checkMessagesOngoing(messages),
  }
}

// =============================================================================
// Three-Phase Linking
// =============================================================================

/** Link subagents to Task calls using three-phase matching */
function linkToTaskCalls(
  subagents: Process[],
  taskCalls: ToolCall[],
  entries: RawSessionEntry[]
): void {
  if (taskCalls.length === 0 || subagents.length === 0) return

  // Build agentId → taskId map from tool results
  const agentIdToTaskId = extractAgentIdFromResults(entries)
  const taskCallById = new Map(taskCalls.map((tc) => [tc.id, tc]))

  const matchedSubagentIds = new Set<string>()
  const matchedTaskIds = new Set<string>()

  // Phase 1: Result-based matching
  for (const subagent of subagents) {
    const taskCallId = agentIdToTaskId.get(subagent.id)
    if (!taskCallId) continue

    const taskCall = taskCallById.get(taskCallId)
    if (!taskCall) continue

    enrichSubagentFromTask(subagent, taskCall, 'result')
    matchedSubagentIds.add(subagent.id)
    matchedTaskIds.add(taskCallId)
  }

  // Phase 2: Description-based matching for team members
  const teamTaskCalls = taskCalls.filter(
    (tc) => !matchedTaskIds.has(tc.id) && tc.input?.team_name && tc.input?.name
  )

  if (teamTaskCalls.length > 0) {
    const subagentSummaries = new Map<string, string>()
    for (const subagent of subagents) {
      if (matchedSubagentIds.has(subagent.id)) continue
      const summary = extractTeamMessageSummary(subagent.messages)
      if (summary) subagentSummaries.set(subagent.id, summary)
    }

    for (const taskCall of teamTaskCalls) {
      const description = getTaskDescription(taskCall)
      if (!description) continue

      let bestMatch: Process | undefined
      for (const subagent of subagents) {
        if (matchedSubagentIds.has(subagent.id)) continue
        if (subagentSummaries.get(subagent.id) !== description) continue
        if (!bestMatch || compareByStartTimeThenId(subagent, bestMatch) < 0) {
          bestMatch = subagent
        }
      }

      if (bestMatch) {
        enrichSubagentFromTask(bestMatch, taskCall, 'team')
        matchedSubagentIds.add(bestMatch.id)
        matchedTaskIds.add(taskCall.id)
      }
    }
  }

  // Phase 3: Positional fallback (no wrap-around)
  const unmatchedSubagents = subagents
    .filter((s) => !matchedSubagentIds.has(s.id))
    .sort(compareByStartTimeThenId)
  const unmatchedTasks = taskCalls.filter(
    (tc) => !matchedTaskIds.has(tc.id) && !(tc.input?.team_name && tc.input?.name)
  )

  for (let i = 0; i < unmatchedSubagents.length && i < unmatchedTasks.length; i++) {
    enrichSubagentFromTask(unmatchedSubagents[i], unmatchedTasks[i], 'fallback')
  }
}

/** Enrich subagent with metadata from Task call */
function enrichSubagentFromTask(subagent: Process, taskCall: ToolCall, linkMethod: LinkMethod): void {
  subagent.parentTaskId = taskCall.id
  subagent.description = getTaskDescription(taskCall)
  subagent.subagentType = getSubagentType(taskCall)
  subagent.linkMethod = linkMethod

  const teamName = taskCall.input?.team_name as string | undefined
  const memberName = taskCall.input?.name as string | undefined
  if (teamName && memberName) {
    subagent.team = { teamName, memberName, memberColor: '' }
  }
}

/** Propagate metadata to continuation files via parentUuid chain */
function propagateContinuationMetadata(subagents: Process[]): void {
  const lastUuidToSubagent = new Map<string, Process>()

  for (const subagent of subagents) {
    const lastMessage = subagent.messages[subagent.messages.length - 1]
    if (lastMessage?.uuid) {
      lastUuidToSubagent.set(lastMessage.uuid, subagent)
    }
  }

  for (const subagent of subagents) {
    if (!needsContinuationMetadata(subagent)) continue
    let parentUuid = subagent.messages[0]?.parentUuid
    if (!parentUuid) continue

    const visitedParentUuids = new Set<string>()
    let depth = 0

    while (parentUuid && depth < MAX_TEAM_CHAIN_DEPTH && !visitedParentUuids.has(parentUuid)) {
      visitedParentUuids.add(parentUuid)
      const ancestor = lastUuidToSubagent.get(parentUuid)
      if (!ancestor || ancestor === subagent) break

      subagent.parentTaskId = subagent.parentTaskId ?? ancestor.parentTaskId
      subagent.description = subagent.description ?? ancestor.description
      subagent.subagentType = subagent.subagentType ?? ancestor.subagentType
      if (!subagent.team && ancestor.team) {
        subagent.team = { ...ancestor.team }
      }

      if (!needsContinuationMetadata(subagent)) break

      parentUuid = ancestor.messages[0]?.parentUuid
      depth++
    }
  }
}

function needsContinuationMetadata(subagent: Process): boolean {
  return !subagent.team || !subagent.parentTaskId || !subagent.description || !subagent.subagentType
}

/** Enrich team colors from teammate_spawned toolUseResult events */
function enrichTeamColors(subagents: Process[], entries: RawSessionEntry[]): void {
  for (const entry of entries) {
    const rawEntry = entry as SubagentSessionEntry
    const toolUseResult = getEntryToolUseResult(rawEntry)
    const spawnInfo = extractTeammateSpawnInfo(toolUseResult)
    if (!spawnInfo) continue

    const sourceToolUseId = getEntrySourceToolUseId(rawEntry) ??
      (rawEntry.message?.role === 'user' ? getToolResultBlocks(rawEntry.message.content)[0]?.tool_use_id : undefined)

    for (const subagent of subagents) {
      if (!subagent.team) continue
      const matchesTask = sourceToolUseId ? subagent.parentTaskId === sourceToolUseId : false
      const matchesAgent = spawnInfo.agentId ? subagent.id === spawnInfo.agentId : false
      if (matchesTask || matchesAgent) {
        subagent.team.memberColor = spawnInfo.color
      }
    }
  }
}

// =============================================================================
// Extraction Helpers
// =============================================================================

/** Extract agentId → taskId map from tool results */
function extractAgentIdFromResults(entries: RawSessionEntry[]): Map<string, string> {
  const map = new Map<string, string>()

  for (const entry of entries) {
    const rawEntry = entry as SubagentSessionEntry
    if (rawEntry.message?.role !== 'user') continue

    const toolResultBlocks = getToolResultBlocks(rawEntry.message.content)

    // Prefer structured fields from parent session entry
    const structuredAgentId = extractAgentIdFromToolUseResult(getEntryToolUseResult(rawEntry))
    const sourceToolUseId = getEntrySourceToolUseId(rawEntry) ?? toolResultBlocks[0]?.tool_use_id
    if (structuredAgentId && sourceToolUseId) {
      map.set(structuredAgentId, sourceToolUseId)
      continue
    }

    // Fallback: parse tool_result text payload
    for (const block of toolResultBlocks) {
      const resultText =
        typeof block.content === 'string'
          ? block.content
          : extractTextFromBlocks(block.content)
      const agentId = extractAgentIdFromText(resultText)
      if (agentId) {
        map.set(agentId, block.tool_use_id)
      }
    }
  }

  return map
}

/** Get task description from ToolCall */
function getTaskDescription(tc: ToolCall): string | undefined {
  const subject =
    tc.input?.subject
    ?? tc.input?.description
    ?? tc.input?.prompt
    ?? tc.input?.instruction
    ?? tc.input?.message
    ?? tc.input?.query
  if (typeof subject === 'string') return subject.split('\n')[0].slice(0, 100)
  return undefined
}

/** Get subagent type from ToolCall */
function getSubagentType(tc: ToolCall): string | undefined {
  const subagentType =
    tc.input?.subagent_type
    ?? tc.input?.subagentType
    ?? tc.input?.agent_type
    ?? tc.input?.agentType
  if (typeof subagentType === 'string') return subagentType
  return undefined
}

/** Extract team message summary from subagent messages */
function extractTeamMessageSummary(messages: SubagentMessage[]): string | undefined {
  const firstUser = messages.find((m) => m.type === 'user')
  if (!firstUser) return undefined

  const content = typeof firstUser.content === 'string'
    ? firstUser.content
    : extractTextFromBlocks(firstUser.content)

  return extractTeammateSummary(content)
}

/** Extract agentId from structured toolUseResult payload */
function extractAgentIdFromToolUseResult(toolUseResult: unknown): string | undefined {
  for (const record of getToolUseResultRecords(toolUseResult)) {
    const agentId = record.agentId ?? record.agent_id ?? record.teammateId ?? record.teammate_id
    if (typeof agentId === 'string' && agentId.trim()) {
      return agentId
    }
  }
  return undefined
}

/** Extract agentId from text payload (regex fallback) */
function extractAgentIdFromText(resultText: string): string | undefined {
  const agentIdMatch = resultText.match(/"agentId"\s*:\s*"([^"]+)"/)
  const agentIdSnakeMatch = resultText.match(/"agent_id"\s*:\s*"([^"]+)"/)
  return agentIdMatch?.[1] ?? agentIdSnakeMatch?.[1]
}

// =============================================================================
// Message Parsing
// =============================================================================

/** Parse JSONL content into SubagentMessage array with tool results merged */
function parseSubagentMessages(jsonl: string): SubagentMessage[] {
  const messages: SubagentMessage[] = []
  let messageIndex = 0

  for (const line of jsonl.split('\n')) {
    if (!line.trim()) continue
    try {
      const entry = JSON.parse(line) as SubagentSessionEntry
      const msg = parseEntryToMessage(entry, messageIndex)
      if (msg) messages.push(msg)
    } catch {
      // Skip malformed lines
    }
    messageIndex += 1
  }

  // Merge tool results into their corresponding tool calls across messages
  // Tool results are in user messages, tool calls are in preceding assistant messages
  const toolResults = new Map<string, { result: string; isError: boolean }>()

  // First pass: collect all tool results
  for (const msg of messages) {
    if (msg.type === 'user' && msg.toolResults) {
      for (const tr of msg.toolResults) {
        toolResults.set(tr.toolUseId, { result: tr.content, isError: tr.isError })
      }
    }
  }

  // Second pass: merge results into tool calls in assistant messages
  for (const msg of messages) {
    if (msg.type === 'assistant' && msg.toolCalls) {
      for (const tc of msg.toolCalls) {
        const result = toolResults.get(tc.id)
        if (result) {
          tc.result = result.result
          tc.isError = result.isError
        }
      }
    }
  }

  return messages
}

/** Convert RawSessionEntry to SubagentMessage */
function parseEntryToMessage(entry: SubagentSessionEntry, messageIndex: number): SubagentMessage | null {
  if (!entry.message) return null

  const msg: SubagentMessage = {
    uuid: entry.uuid ?? `generated-${messageIndex}`,
    parentUuid: getEntryParentUuid(entry),
    type: entry.message.role === 'user' ? 'user' : entry.message.role === 'assistant' ? 'assistant' : 'system',
    timestamp: new Date(entry.timestamp ?? ''),
    role: entry.message.role,
    content: entry.message.content,
    toolUseResult: getEntryToolUseResult(entry),
  }

  // Extract tool calls from assistant messages
  if (entry.message.role === 'assistant' && Array.isArray(entry.message.content)) {
    msg.toolCalls = entry.message.content
      .filter((b): b is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
        b.type === 'tool_use')
      .map((b) => ({ id: b.id, name: b.name, input: b.input }))
  }

  // Extract tool results from user messages
  if (entry.message.role === 'user') {
    const toolResults = getToolResultBlocks(entry.message.content).map((b) => ({
        toolUseId: b.tool_use_id,
        content: typeof b.content === 'string' ? b.content : extractTextFromBlocks(b.content),
        isError: b.is_error ?? false,
      }))

    const sourceToolUseId = getEntrySourceToolUseId(entry)
    const toolUseResult = getEntryToolUseResult(entry)
    const fallbackContent = extractToolUseResultText(toolUseResult)

    if (
      sourceToolUseId &&
      fallbackContent &&
      !toolResults.some((result) => result.toolUseId === sourceToolUseId)
    ) {
      toolResults.push({
        toolUseId: sourceToolUseId,
        content: fallbackContent,
        isError: isToolUseResultError(toolUseResult),
      })
    }

    if (toolResults.length > 0) {
      msg.toolResults = toolResults
    }
  }

  return msg
}

/** Extract text from content blocks */
function extractTextFromBlocks(blocks: ContentBlock[]): string {
  return blocks
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
}

/** Extract tool_result blocks from message content */
function getToolResultBlocks(content: string | ContentBlock[]): ToolResultBlock[] {
  if (!Array.isArray(content)) return []
  return content.filter(
    (block): block is ToolResultBlock =>
      block.type === 'tool_result' && typeof block.tool_use_id === 'string'
  )
}

/** Resolve parentUuid from mixed camel/snake entry contracts */
function getEntryParentUuid(entry: SubagentSessionEntry): string | null {
  const parentUuid = entry.parentUuid ?? entry.parent_uuid
  return typeof parentUuid === 'string' ? parentUuid : null
}

/** Resolve source tool_use id from mixed camel/snake entry contracts */
function getEntrySourceToolUseId(entry: SubagentSessionEntry): string | undefined {
  const sourceToolUseId =
    entry.sourceToolUseID ?? entry.sourceToolUseId ?? entry.source_tool_use_id
  return typeof sourceToolUseId === 'string' && sourceToolUseId.trim() ? sourceToolUseId : undefined
}

/** Resolve toolUseResult from mixed camel/snake entry contracts */
function getEntryToolUseResult(entry: SubagentSessionEntry): unknown {
  return entry.toolUseResult ?? entry.tool_use_result
}

type TeammateSpawnInfo = {
  color: string
  agentId?: string
}

/** Extract teammate spawn metadata from toolUseResult payload */
function extractTeammateSpawnInfo(toolUseResult: unknown): TeammateSpawnInfo | undefined {
  for (const record of getToolUseResultRecords(toolUseResult)) {
    const status = pickStringField(record, 'status') ?? pickStringField(record, 'event')
    if (status?.toLowerCase() !== 'teammate_spawned') continue

    const color = pickStringField(record, 'color')
      ?? pickStringField(record, 'memberColor')
      ?? pickStringField(record, 'member_color')
    if (!color) continue

    const agentId = extractAgentIdFromToolUseResult(record)
    return {
      color,
      agentId,
    }
  }

  return undefined
}

/** Enumerate possible toolUseResult records (root + known nested payloads) */
function getToolUseResultRecords(toolUseResult: unknown): Record<string, unknown>[] {
  const rootRecord = parseToolUseResultRecord(toolUseResult)
  if (!rootRecord) return []

  const records = [rootRecord]
  for (const key of ['result', 'payload', 'data']) {
    const nested = rootRecord[key]
    if (isRecord(nested)) {
      records.push(nested)
    }
  }
  return records
}

function parseToolUseResultRecord(toolUseResult: unknown): Record<string, unknown> | undefined {
  if (isRecord(toolUseResult)) return toolUseResult
  if (typeof toolUseResult !== 'string') return undefined

  try {
    const parsed = JSON.parse(toolUseResult) as unknown
    return isRecord(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

/** Convert toolUseResult payload to displayable text */
function extractToolUseResultText(toolUseResult: unknown): string {
  if (typeof toolUseResult === 'string') return toolUseResult
  if (!isRecord(toolUseResult)) return ''

  const value =
    pickStringField(toolUseResult, 'error') ??
    pickStringField(toolUseResult, 'stderr') ??
    pickStringField(toolUseResult, 'stdout') ??
    pickStringField(toolUseResult, 'content') ??
    pickStringField(toolUseResult, 'message') ??
    pickStringField(toolUseResult, 'result')

  if (value) return value

  try {
    return JSON.stringify(toolUseResult)
  } catch {
    return ''
  }
}

/** Infer error status from toolUseResult payload */
function isToolUseResultError(toolUseResult: unknown): boolean {
  if (typeof toolUseResult === 'string') {
    return toolUseResult.startsWith('Error:')
  }
  if (!isRecord(toolUseResult)) return false
  return toolUseResult.isError === true || toolUseResult.is_error === true
}

function pickStringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]
  return typeof value === 'string' && value.trim() ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// =============================================================================
// Metrics & Parallel Detection
// =============================================================================

/** Calculate metrics from messages */
function calculateMetrics(messages: SubagentMessage[], durationMs: number): SessionMetrics {
  return {
    durationMs,
    totalTokens: 0, // Not available from raw JSONL
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    messageCount: messages.length,
  }
}

/** Detect parallel execution (100ms overlap window) */
function detectParallelExecution(subagents: Process[]): void {
  if (subagents.length < 2) return

  const sorted = [...subagents].sort(compareByStartTimeThenId)
  let groupStartTime = Number.NaN
  let group: Process[] = []

  for (const subagent of sorted) {
    const startTime = toSortableTime(subagent.startTime)

    if (group.length === 0) {
      group = [subagent]
      groupStartTime = startTime
      continue
    }

    if (startTime - groupStartTime <= PARALLEL_WINDOW_MS) {
      group.push(subagent)
      continue
    }

    if (group.length > 1) {
      for (const parallelSubagent of group) {
        parallelSubagent.isParallel = true
      }
    }

    group = [subagent]
    groupStartTime = startTime
  }

  if (group.length > 1) {
    for (const parallelSubagent of group) {
      parallelSubagent.isParallel = true
    }
  }
}

/** Determine if subagent messages indicate ongoing activity */
function checkMessagesOngoing(messages: SubagentMessage[]): boolean {
  type ActivityType =
    | 'text_output'
    | 'thinking'
    | 'tool_use'
    | 'tool_result'
    | 'interruption'
    | 'exit_plan_mode'

  const activities: ActivityType[] = []
  const shutdownToolUseIds = new Set<string>()

  for (const message of messages) {
    if (message.type === 'assistant' && Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.type === 'thinking' && block.thinking) {
          activities.push('thinking')
        } else if (block.type === 'tool_use') {
          if (block.name === 'ExitPlanMode') {
            activities.push('exit_plan_mode')
          } else if (isShutdownResponse(block.name, block.input)) {
            shutdownToolUseIds.add(block.id)
            activities.push('interruption')
          } else {
            activities.push('tool_use')
          }
        } else if (block.type === 'text' && block.text.trim()) {
          if (isRequestInterruptedText(block.text)) {
            activities.push('interruption')
          } else {
            activities.push('text_output')
          }
        }
      }
      continue
    }

    if (message.type === 'user' && Array.isArray(message.content)) {
      const isRejection = isUserRejectedToolUse(message.toolUseResult)

      for (const block of message.content) {
        if (block.type === 'tool_result') {
          const resultText = typeof block.content === 'string'
            ? block.content
            : extractTextFromBlocks(block.content)
          if (shutdownToolUseIds.has(block.tool_use_id) || isRejection || isRequestInterruptedText(resultText)) {
            activities.push('interruption')
          } else {
            activities.push('tool_result')
          }
        } else if (block.type === 'text' && isRequestInterruptedText(block.text)) {
          activities.push('interruption')
        }
      }
    }
  }

  let hasWorkActivity = false
  let hasUnclosedWork = false

  for (const activity of activities) {
    if (activity === 'thinking' || activity === 'tool_use' || activity === 'tool_result') {
      hasWorkActivity = true
      hasUnclosedWork = true
      continue
    }

    if (hasWorkActivity) {
      hasUnclosedWork = false
    }
  }

  return hasWorkActivity && hasUnclosedWork
}

function isShutdownResponse(name: string, input: Record<string, unknown>): boolean {
  return name === 'SendMessage' && input?.type === 'shutdown_response' && input?.approve === true
}

function isUserRejectedToolUse(toolUseResult: unknown): boolean {
  if (typeof toolUseResult === 'string') {
    return /rejected tool use/i.test(toolUseResult)
  }

  for (const record of getToolUseResultRecords(toolUseResult)) {
    const status = pickStringField(record, 'status')
    if (status && ['user_rejected_tool_use', 'user_rejected', 'rejected'].includes(status)) {
      return true
    }

    const message = pickStringField(record, 'message') ?? pickStringField(record, 'error')
    if (message && /rejected tool use/i.test(message)) {
      return true
    }
  }

  return false
}

function isRequestInterruptedText(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  return normalized.startsWith('[request interrupted by user')
    || normalized.includes('user rejected tool use')
}

function compareByStartTimeThenId(a: Process, b: Process): number {
  const timeDiff = toSortableTime(a.startTime) - toSortableTime(b.startTime)
  if (timeDiff !== 0) return timeDiff
  return a.id.localeCompare(b.id)
}

function toSortableTime(value: Date): number {
  const time = value.getTime()
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER
}

// =============================================================================
// Display Helpers
// =============================================================================

/** Get set of Task IDs that have associated subagents (for filtering) */
export function getTaskIdsWithSubagents(subagents: Process[]): Set<string> {
  return new Set(subagents.map((s) => s.parentTaskId).filter((id): id is string => !!id))
}
