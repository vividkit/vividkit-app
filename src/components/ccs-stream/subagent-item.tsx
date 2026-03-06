import { useState, useMemo } from 'react'
import {
  ChevronRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Process } from '@/types/subagent'
import { getSubagentTypeColorSet, getTeamColorSet } from '@/lib/team-colors'
import { tailPathSegments } from '@/lib/session-path-utils'
import { ExecutionTrace } from './execution-trace'

interface Props {
  subagent: Process
  defaultExpanded?: boolean
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

export function SubagentItem({ subagent, defaultExpanded = false }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(defaultExpanded)

  const description = subagent.description ?? t('ccsStream.subagent.defaultDescription')
  const subagentType = subagent.subagentType ?? t('ccsStream.subagent.defaultType')
  const truncatedDesc = description.length > 80 ? description.slice(0, 80) + '...' : description

  const teamColors = subagent.team ? getTeamColorSet(subagent.team.memberColor) : null
  const typeColors = !teamColors ? getSubagentTypeColorSet(subagentType) : null
  const colors = teamColors ?? typeColors

  const isShutdownOnly = useMemo(() => {
    if (!subagent.team || !subagent.messages?.length) return false
    const assistantMsgs = subagent.messages.filter((m) => m.type === 'assistant')
    if (assistantMsgs.length !== 1) return false
    const calls = assistantMsgs[0].toolCalls ?? []
    return (
      calls.length === 1 &&
      calls[0].name === 'SendMessage' &&
      calls[0].input?.type === 'shutdown_response'
    )
  }, [subagent.team, subagent.messages])

  const toolCount = useMemo(() => {
    return subagent.messages?.filter(
      (m) => m.type === 'assistant' && (m.toolCalls?.length ?? 0) > 0
    ).length ?? 0
  }, [subagent.messages])

  const isOngoing = subagent.isOngoing ?? false
  const sessionLogPath = subagent.filePath?.trim()
  const compactSessionLogPath = sessionLogPath ? tailPathSegments(sessionLogPath, 2) : ''

  if (isShutdownOnly && teamColors && subagent.team) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-1.5 text-xs">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: teamColors.border }}
        />
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: teamColors.badge,
            color: teamColors.text,
          }}
        >
          {subagent.team.memberName}
        </span>
        <span className="text-muted-foreground">{t('ccsStream.subagent.shutdownConfirmed')}</span>
      </div>
    )
  }

  const badgeStyle = colors ? {
    backgroundColor: colors.badge,
    color: colors.text,
    border: `1px solid ${colors.border}40`,
  } : {}

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/50"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />

        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
          style={badgeStyle}
        >
          {subagent.team?.memberName ?? subagentType}
        </span>

        <span className="flex-1 truncate text-xs text-foreground">{truncatedDesc}</span>

        {sessionLogPath && (
          <span
            className="max-w-[240px] shrink-0 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            title={sessionLogPath}
          >
            {t('ccsStream.subagent.logPrefix')} {compactSessionLogPath}
          </span>
        )}

        {isOngoing ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin text-warning" />
        ) : (
          <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />
        )}

        <span className="shrink-0 text-[10px] text-muted-foreground">
          {formatDuration(subagent.durationMs)}
        </span>

        {toolCount > 0 && !expanded && (
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {t('ccsStream.subagent.toolsCount', { count: toolCount })}
          </span>
        )}

        {subagent.isParallel && (
          <span className="shrink-0 rounded bg-warning/20 px-1 py-0.5 text-[9px] font-medium text-warning">
            {t('ccsStream.subagent.parallel')}
          </span>
        )}
      </button>

      {expanded && (subagent.messages.length > 0 || Boolean(sessionLogPath)) && (
        <div className="border-t border-border bg-muted/10 p-3">
          {sessionLogPath && (
            <div className="mb-2 rounded border border-border/60 bg-background/70 px-2 py-1.5 text-[10px]">
              <span className="mr-1 text-muted-foreground">{t('ccsStream.subagent.sessionLog')}</span>
              <span
                className={`font-mono ${isOngoing ? 'text-warning' : 'text-foreground'}`}
                title={sessionLogPath}
              >
                {sessionLogPath}
              </span>
            </div>
          )}
          {subagent.messages.length > 0 && (
            <ExecutionTrace messages={subagent.messages} hideTextRows />
          )}
        </div>
      )}
    </div>
  )
}
