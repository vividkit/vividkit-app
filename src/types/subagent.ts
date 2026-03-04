/**
 * Subagent types for CCS stream rendering.
 * Ported from claude-devtools/src/main/types/chunks.ts
 */

import type { ContentBlock } from '@/lib/jsonl-session-parser'

// =============================================================================
// Session Metrics
// =============================================================================

/** Aggregated metrics for a session or subagent */
export interface SessionMetrics {
  /** Duration in milliseconds */
  durationMs: number
  /** Total tokens (input + output) */
  totalTokens: number
  /** Input tokens */
  inputTokens: number
  /** Output tokens */
  outputTokens: number
  /** Cache read tokens */
  cacheReadTokens: number
  /** Cache creation tokens */
  cacheCreationTokens: number
  /** Number of messages */
  messageCount: number
  /** Estimated cost in USD */
  costUsd?: number
}

// =============================================================================
// Team Colors
// =============================================================================

/** Color set for team member visualization */
export interface TeamColorSet {
  /** Border accent color */
  border: string
  /** Badge background (semi-transparent) */
  badge: string
  /** Text color for labels */
  text: string
}

/** Team metadata attached to subagent */
export interface TeamMetadata {
  teamName: string
  memberName: string
  memberColor: string
}

// =============================================================================
// Process (Subagent)
// =============================================================================

/** Parsed message from subagent JSONL (simplified version) */
export interface SubagentMessage {
  uuid: string
  parentUuid: string | null
  type: 'user' | 'assistant' | 'system'
  timestamp: Date
  role?: string
  content: ContentBlock[] | string
  // Tool calls for assistant messages
  toolCalls?: SubagentToolCall[]
  // Tool results for user messages
  toolResults?: SubagentToolResult[]
  // Enriched tool result payload from JSONL entry (if present)
  toolUseResult?: unknown
}

/** Tool call in subagent */
export interface SubagentToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  result?: string
  isError?: boolean
}

/** Tool result in subagent */
export interface SubagentToolResult {
  toolUseId: string
  content: string
  isError: boolean
}

/** Main session impact tokens */
export interface MainSessionImpact {
  /** Task tool_use input tokens */
  callTokens: number
  /** Task tool_result output tokens */
  resultTokens: number
  /** Total tokens affecting main session */
  totalTokens: number
}

/** Resolved subagent information */
export interface Process {
  /** Agent ID extracted from filename */
  id: string
  /** Path to the subagent JSONL file */
  filePath: string
  /** Parsed messages from the subagent session */
  messages: SubagentMessage[]
  /** When the subagent started */
  startTime: Date
  /** When the subagent ended */
  endTime: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Aggregated metrics for the subagent */
  metrics: SessionMetrics
  /** Task description from parent Task call */
  description?: string
  /** Subagent type from Task call (e.g., "Explore", "Plan") */
  subagentType?: string
  /** Whether executed in parallel with other subagents */
  isParallel: boolean
  /** The tool_use ID of the Task call that spawned this */
  parentTaskId?: string
  /** Whether this subagent is still in progress */
  isOngoing?: boolean
  /** Tokens consumed in main session context */
  mainSessionImpact?: MainSessionImpact
  /** Team metadata - present when this subagent is a team member */
  team?: TeamMetadata
  /** Link confidence from resolver matching */
  linkMethod?: 'result' | 'team' | 'fallback'
}

// =============================================================================
// Display Items
// =============================================================================

/** Subagent display item for rendering */
export interface SubagentDisplayItem {
  type: 'subagent'
  subagent: Process
}

/** Teammate message display item */
export interface TeammateMessageDisplayItem {
  type: 'teammate_message'
  teammateMessage: TeammateMessage
}

/** Parsed teammate message content */
export interface TeammateMessage {
  teammateId: string
  color?: string
  summary?: string
  content: string
  timestamp: Date
}

// =============================================================================
// Raw Subagent Data (from Rust)
// =============================================================================

/** Raw subagent data returned from Rust backend */
export interface RawSubagentData {
  id: string
  file_path: string
  raw_messages: string
  start_time: string
  end_time: string
  duration_ms: number
  message_count: number
  first_user_message: string | null
  is_warmup: boolean
  is_compact: boolean
}
