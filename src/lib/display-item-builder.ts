/**
 * Display Item Builder
 *
 * Builds display items for CCS stream rendering.
 * Filters Task calls that have matching subagents (avoid duplicate display).
 *
 * Ported from claude-devtools/src/renderer/utils/displayItemBuilder.ts
 */

import { isSubagentToolName, type ToolCall, type AIGroup } from '@/lib/jsonl-session-parser'
import type { Process, SubagentDisplayItem } from '@/types/subagent'

/** Display item types for rendering */
export type DisplayItem =
  | { type: 'tool'; tool: ToolCall }
  | { type: 'subagent'; subagent: Process }

/**
 * Filter tool calls to exclude Task calls with matching subagents.
 * Task calls without matching subagents (orphans) are still displayed.
 */
export function filterToolCallsWithSubagents(
  toolCalls: ToolCall[],
  taskIdsWithSubagents: Set<string>
): ToolCall[] {
  return toolCalls.filter((tool) => {
    // Keep non-Task calls
    if (!isSubagentToolName(tool.name)) return true
    // Keep orphaned Task calls (no matching subagent)
    if (!taskIdsWithSubagents.has(tool.id)) return true
    // Filter out Task calls with matching subagents
    return false
  })
}

/** Stable comparator for subagent display ordering. */
export function compareSubagentsByStartTimeThenId(a: Process, b: Process): number {
  const aTime = Number.isFinite(a.startTime.getTime()) ? a.startTime.getTime() : Number.MAX_SAFE_INTEGER
  const bTime = Number.isFinite(b.startTime.getTime()) ? b.startTime.getTime() : Number.MAX_SAFE_INTEGER
  const timeDiff = aTime - bTime
  if (timeDiff !== 0) return timeDiff
  return a.id.localeCompare(b.id)
}

/** Build parentTaskId -> subagents[] map with deterministic ordering. */
export function buildParentTaskSubagentMap(subagents: Process[]): Map<string, Process[]> {
  const linked = subagents
    .filter((s): s is Process & { parentTaskId: string } => typeof s.parentTaskId === 'string')
    .sort(compareSubagentsByStartTimeThenId)

  const byParentTaskId = new Map<string, Process[]>()
  for (const subagent of linked) {
    const existing = byParentTaskId.get(subagent.parentTaskId) ?? []
    existing.push(subagent)
    byParentTaskId.set(subagent.parentTaskId, existing)
  }
  return byParentTaskId
}

/** Collect all Task tool IDs that already have linked subagents. */
export function collectTaskIdsWithSubagents(subagents: Process[]): Set<string> {
  return new Set(buildParentTaskSubagentMap(subagents).keys())
}

/**
 * Build subagent display items from resolved processes.
 * Returns items sorted by start time, then id.
 */
export function buildSubagentDisplayItems(subagents: Process[]): SubagentDisplayItem[] {
  return subagents
    .filter((s) => s.parentTaskId) // Only include linked subagents
    .sort(compareSubagentsByStartTimeThenId)
    .map((subagent) => ({ type: 'subagent' as const, subagent }))
}

/**
 * Enrich AI groups with filtered tool calls.
 * Mutates groups in place to remove Task calls with subagents.
 */
export function enrichAIGroupsWithFilter(
  groups: AIGroup[],
  taskIdsWithSubagents: Set<string>
): void {
  for (const group of groups) {
    group.toolCalls = filterToolCallsWithSubagents(group.toolCalls, taskIdsWithSubagents)
  }
}
