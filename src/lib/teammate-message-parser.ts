/**
 * Teammate Message Parser
 *
 * Parses <teammate-message> XML content into structured data.
 * Handles single or multiple blocks in one message.
 */

export interface ParsedTeammateContent {
  teammateId: string
  color: string
  summary: string
  content: string
}

/** Regex to match a single <teammate-message> block */
const TEAMMATE_BLOCK_RE = /<teammate-message\b([^>]*)>([\s\S]*?)<\/teammate-message>/gi

const TEAMMATE_ID_RE = /\b(?:teammate_id|teammateId|agent_id|agentId)=["']([^"']+)["']/i
const COLOR_RE = /\bcolor=["']([^"']*)["']/i
const SUMMARY_RE = /\bsummary=["']([^"']*)["']/i

/** Parse all <teammate-message> blocks from raw content */
export function parseAllTeammateMessages(rawContent: string): ParsedTeammateContent[] {
  const results: ParsedTeammateContent[] = []
  const regex = new RegExp(TEAMMATE_BLOCK_RE.source, TEAMMATE_BLOCK_RE.flags)

  let match: RegExpExecArray | null
  while ((match = regex.exec(rawContent)) !== null) {
    const attrs = match[1] ?? ''
    const content = match[2]?.trim() ?? ''
    const teammateId = TEAMMATE_ID_RE.exec(attrs)?.[1]
    if (!teammateId) continue

    const colorMatch = COLOR_RE.exec(attrs)
    const summaryMatch = SUMMARY_RE.exec(attrs)

    results.push({
      teammateId,
      color: colorMatch?.[1] ?? '',
      summary: summaryMatch?.[1] ?? '',
      content,
    })
  }

  return results
}

/** Check if a message content contains teammate message */
export function isTeammateMessage(content: string | unknown[]): boolean {
  const text = typeof content === 'string' ? content : ''
  return text.includes('<teammate-message')
}

/** Extract summary from first teammate-message in content */
export function extractTeammateSummary(content: string): string | undefined {
  const messages = parseAllTeammateMessages(content)
  return messages[0]?.summary
}
