import { useEffect, useRef, useState, useMemo } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useTranslation } from 'react-i18next'
import { UserMessage } from './user-message'
import { AIMessage } from './ai-message'
import { SystemLine } from './system-line'
import { QuestionCard } from './question-card'
import { StreamStatusBar } from './stream-status-bar'
import { Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  analyzeSessionStreamState,
  parseSessionLine,
  sessionEntriesToConversation,
  type RawSessionEntry,
  type ToolCall,
  isSubagentToolName,
} from '@/lib/jsonl-session-parser'
import { resumeCcsSession, sendCcsInput, watchSessionLog, stopSessionLogWatch } from '@/lib/tauri'
import { resolveSubagents } from '@/lib/subagent-resolver'
import {
  buildParentTaskSubagentMap,
  collectTaskIdsWithSubagents,
  compareSubagentsByStartTimeThenId,
} from '@/lib/display-item-builder'
import {
  sessionFileIdFromLogPath,
  sessionRootDirFromLogPath,
  sessionWatchIdFromLogPath,
} from '@/lib/session-path-utils'
import type { Process } from '@/types/subagent'

interface Props {
  sessionLogPath?: string
  isRunning: boolean
  exitCode: number | null
  activeRunId?: string | null
  ccsCwd?: string
  profileName?: string
  hideSystemLines?: boolean
  hideStatusBar?: boolean
  hideJsonlPaths?: boolean
  disableInput?: boolean
  initialPrompt?: string
  onStop?: () => void
  isStopping?: boolean
}

function collectTaskCalls(entries: RawSessionEntry[]): ToolCall[] {
  return entries
    .filter((entry) => entry.message?.role === 'assistant')
    .flatMap((entry) =>
      Array.isArray(entry.message?.content)
        ? entry.message.content
            .filter(
              (block): block is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
                block.type === 'tool_use' && isSubagentToolName(block.name)
            )
            .map((block) => ({ id: block.id, name: block.name, input: block.input }))
        : []
    )
}

export function StreamView({ sessionLogPath, isRunning, exitCode, activeRunId, ccsCwd, profileName, hideSystemLines, hideStatusBar, hideJsonlPaths, disableInput, initialPrompt, onStop, isStopping }: Props) {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<RawSessionEntry[]>([])
  const [subagents, setSubagents] = useState<Process[]>([])
  const [resolveTick, setResolveTick] = useState(0)
  const [manualInput, setManualInput] = useState('')
  const [sendingManual, setSendingManual] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)
  const resolveRequestRef = useRef(0)
  const resolveInFlightRef = useRef(false)
  const resolveQueuedRef = useRef(false)
  const entriesRef = useRef<RawSessionEntry[]>([])
  const taskCallsRef = useRef<ToolCall[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset state when session changes
  useEffect(() => {
    resolveRequestRef.current += 1
    setEntries([])
    setSubagents([])
    setResolveTick(0)
  }, [sessionLogPath])

  const taskCalls = useMemo(() => collectTaskCalls(entries), [entries])
  const hasTaskCalls = taskCalls.length > 0
  const isProcessRunning = isRunning && exitCode === null
  const streamState = useMemo(() => analyzeSessionStreamState(entries), [entries])
  const isStreamInProgress = isProcessRunning
    && (streamState.isOngoing || !streamState.hasEndingEvent)

  useEffect(() => {
    entriesRef.current = entries
    taskCallsRef.current = taskCalls
  }, [entries, taskCalls])

  // Poll subagents while running so nested execution keeps updating even if main log is quiet.
  useEffect(() => {
    if (!sessionLogPath || !isProcessRunning || !hasTaskCalls) return
    const timer = window.setInterval(() => {
      setResolveTick((prev) => prev + 1)
    }, 700)
    return () => window.clearInterval(timer)
  }, [sessionLogPath, isProcessRunning, hasTaskCalls])

  // Resolve subagents periodically during active runs.
  useEffect(() => {
    if (!sessionLogPath || !isProcessRunning) return
    const latestTaskCalls = taskCallsRef.current
    if (latestTaskCalls.length === 0) return

    const sessionDir = sessionRootDirFromLogPath(sessionLogPath)
    const requestId = ++resolveRequestRef.current
    let active = true
    const timeoutId = window.setTimeout(() => {
      if (resolveInFlightRef.current) {
        resolveQueuedRef.current = true
        return
      }
      resolveInFlightRef.current = true
      resolveSubagents(sessionDir, latestTaskCalls, entriesRef.current)
        .then((resolved) => {
          if (!active || requestId !== resolveRequestRef.current) return
          setSubagents(resolved)
        })
        .catch(() => {
          if (!active || requestId !== resolveRequestRef.current) return
          // Keep previous subagent state on transient resolve failure.
        })
        .finally(() => {
          resolveInFlightRef.current = false
          if (active && resolveQueuedRef.current) {
            resolveQueuedRef.current = false
            setResolveTick((prev) => prev + 1)
          }
        })
    }, 120)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [sessionLogPath, isProcessRunning, resolveTick])

  // Resolve once on final output updates after run completion.
  useEffect(() => {
    if (!sessionLogPath || isProcessRunning) return

    if (!hasTaskCalls) {
      resolveRequestRef.current += 1
      resolveInFlightRef.current = false
      resolveQueuedRef.current = false
      setSubagents((prev) => (prev.length === 0 ? prev : []))
      return
    }

    const sessionDir = sessionRootDirFromLogPath(sessionLogPath)
    const requestId = ++resolveRequestRef.current
    let active = true
    const timeoutId = window.setTimeout(() => {
      resolveSubagents(sessionDir, taskCalls, entries)
        .then((resolved) => {
          if (!active || requestId !== resolveRequestRef.current) return
          setSubagents(resolved)
        })
        .catch(() => {
          if (!active || requestId !== resolveRequestRef.current) return
          // Keep previous subagent state on transient resolve failure.
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [sessionLogPath, isProcessRunning, hasTaskCalls, taskCalls, entries])

  useEffect(() => {
    if (!sessionLogPath) return
    const sessionId = sessionWatchIdFromLogPath(sessionLogPath)
    let unlisten: (() => void) | null = null
    let active = true

    // Register event listener first, then start watcher
    listen<{ session_id: string; line: string }>('ccs_session_log_line', (e) => {
      if (e.payload.session_id !== sessionId) return
      const parsed = parseSessionLine(e.payload.line)
      if (parsed) setEntries((prev) => [...prev, parsed])
    }).then((fn) => {
      if (!active) { fn(); return }
      unlisten = fn
    })

    // Start Rust file watcher — reads from beginning of file
    watchSessionLog(sessionId, sessionLogPath).catch(() => {})

    return () => {
      active = false
      unlisten?.()
      stopSessionLogWatch(sessionId).catch(() => {})
    }
  }, [sessionLogPath])

  // Auto-scroll to bottom when entries change
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 300
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  const items = sessionEntriesToConversation(entries)
  const latestAIItemId = useMemo(() => {
    for (let i = items.length - 1; i >= 0; i -= 1) {
      if (items[i].type === 'ai') return items[i].id
    }
    return undefined
  }, [items])
  const sessionId = sessionLogPath ? sessionFileIdFromLogPath(sessionLogPath) : undefined
  // Disable manual input when an AskUserQuestion is pending (last visible item is a question)
  const hasPendingQuestion = useMemo(() => {
    for (let i = items.length - 1; i >= 0; i -= 1) {
      if (items[i].type === 'question') return true
      if (items[i].type === 'ai' || items[i].type === 'user') break
    }
    return false
  }, [items])
  const canSendManual = Boolean(!hasPendingQuestion && ((activeRunId && isProcessRunning) || sessionId))
  const taskIdsWithSubagents = useMemo(() => collectTaskIdsWithSubagents(subagents), [subagents])
  const subagentSessionPaths = useMemo(() => {
    const unique = new Set<string>()
    for (const subagent of subagents) {
      const filePath = subagent.filePath?.trim()
      if (filePath) unique.add(filePath)
    }
    return Array.from(unique)
  }, [subagents])
  const subagentScanDir = useMemo(() => {
    if (!sessionLogPath) return undefined
    const sessionRootDir = sessionRootDirFromLogPath(sessionLogPath)
    const separator = sessionLogPath.includes('\\') ? '\\' : '/'
    return `${sessionRootDir}${separator}subagents`
  }, [sessionLogPath])

  // Group resolved subagents by AI group so they render inside the AI section.
  const aiGroupSubagentMap = useMemo(() => {
    const grouped = new Map<string, Process[]>()
    if (subagents.length === 0) return grouped
    const subagentsByParentTaskId = buildParentTaskSubagentMap(subagents)
    const insertedSubagentIds = new Set<string>()
    const appendToGroup = (aiGroupId: string, list: Process[]) => {
      if (list.length === 0) return
      const current = grouped.get(aiGroupId) ?? []
      const seen = new Set(current.map((subagent) => subagent.id))
      for (const subagent of list) {
        if (seen.has(subagent.id)) continue
        current.push(subagent)
        seen.add(subagent.id)
      }
      current.sort(compareSubagentsByStartTimeThenId)
      grouped.set(aiGroupId, current)
    }
    for (const item of items) {
      if (item.type !== 'ai') continue
      const linkedSubagents: Process[] = []
      for (const tc of item.toolCalls) {
        if (!isSubagentToolName(tc.name)) continue
        const subagentMatches = subagentsByParentTaskId.get(tc.id) ?? []
        for (const subagent of subagentMatches) {
          if (insertedSubagentIds.has(subagent.id)) continue
          insertedSubagentIds.add(subagent.id)
          linkedSubagents.push(subagent)
        }
      }
      appendToGroup(item.id, linkedSubagents)
    }

    const orphanSubagents = subagents
      .filter((subagent) => !insertedSubagentIds.has(subagent.id))
      .sort(compareSubagentsByStartTimeThenId)
    if (orphanSubagents.length > 0) {
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const item = items[i]
        if (item.type !== 'ai') continue
        appendToGroup(item.id, orphanSubagents)
        break
      }
    }

    return grouped
  }, [items, subagents])

  async function handleManualSend() {
    const text = manualInput.trim()
    if (!text || sendingManual) return
    setSendingManual(true)
    setManualError(null)
    try {
      if (activeRunId && isProcessRunning) {
        await sendCcsInput(activeRunId, `${text}\r`)
      } else if (sessionId) {
        await resumeCcsSession(sessionId, text, ccsCwd || '.')
      } else {
        throw new Error(t('ccsStream.stream.errors.noActiveRun'))
      }
      setManualInput('')
    } catch (e) {
      const message = typeof e === 'string'
        ? e
        : e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string'
          ? (e as { message: string }).message
          : t('ccsStream.stream.errors.failedToSend')
      setManualError(message)
    } finally {
      setSendingManual(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {!hideStatusBar && (
        <StreamStatusBar
          isRunning={isStreamInProgress}
          exitCode={exitCode}
          sessionLogPath={sessionLogPath}
        />
      )}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto py-6 space-y-6">
        {initialPrompt && (
          <div className="flex justify-end px-4">
            <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-primary text-primary-foreground text-sm leading-relaxed">
              {initialPrompt}
            </div>
          </div>
        )}
        {items.length === 0 && isStreamInProgress && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {t('ccsStream.stream.waitingForOutput')}
            </span>
          </div>
        )}
        {items.length === 0 && !isStreamInProgress && !initialPrompt && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            {t('ccsStream.stream.emptyState')}
          </div>
        )}
        {items.map((item) =>
          item.type === 'user' ? (
            <UserMessage key={item.id} item={item} />
          ) : item.type === 'system' ? (
            hideSystemLines ? null : <SystemLine key={item.id} item={item} />
          ) : item.type === 'question' ? (
            <QuestionCard
              key={item.id}
              item={item}
              activeRunId={activeRunId ?? null}
              sessionId={sessionId}
              ccsCwd={ccsCwd}
            />
          ) : (
            <AIMessage
              key={item.id}
              item={item}
              isLast={item.id === latestAIItemId}
              isSessionRunning={isStreamInProgress}
              taskIdsWithSubagents={taskIdsWithSubagents}
              subagents={aiGroupSubagentMap.get(item.id) ?? []}
              profileName={profileName}
            />
          ),
        )}
        <div ref={bottomRef} />
      </div>
      {!disableInput && (
      <div className="shrink-0 border-t border-border p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Textarea
            value={manualInput}
            onChange={(e) => {
              if (manualError) setManualError(null)
              setManualInput(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void handleManualSend()
              }
            }}
            placeholder={t('ccsStream.stream.replyPlaceholder')}
            className="flex-1 min-h-[72px] max-h-[200px]"
            disabled={!canSendManual || sendingManual}
          />
          {/* Stop button when running, Send button otherwise */}
          {isStreamInProgress && onStop ? (
            <button
              onClick={onStop}
              disabled={isStopping}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
              title={isStopping ? t('common.actions.stopping') : t('common.actions.stop')}
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <Button
              size="sm"
              onClick={() => void handleManualSend()}
              disabled={!canSendManual || sendingManual || manualInput.trim().length === 0}
            >
              {sendingManual ? t('ccsStream.stream.sending') : t('ccsStream.stream.send')}
            </Button>
          )}
        </div>
        {manualError && <p className="text-xs text-destructive">{manualError}</p>}
        {import.meta.env.DEV && !hideJsonlPaths && (
          <div className="rounded-md border border-border/70 bg-muted/20 px-2.5 py-2 text-[10px]">
            <div className="mb-1 font-medium text-foreground">{t('ccsStream.stream.sessionJsonlPaths')}</div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-muted-foreground">{t('ccsStream.stream.main')}</span>
              <span className="font-mono break-all text-foreground" title={sessionLogPath ?? undefined}>
                {sessionLogPath ?? '-'}
              </span>
            </div>
            <div className="mt-1 flex items-start gap-2">
              <span className="shrink-0 text-muted-foreground">
                {t('ccsStream.stream.subagent')} ({subagentSessionPaths.length}):
              </span>
              {subagentSessionPaths.length === 0 ? (
                <span className="font-mono text-foreground">-</span>
              ) : (
                <span className="font-mono break-all text-foreground">
                  {subagentSessionPaths.join(' | ')}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-start gap-2">
              <span className="shrink-0 text-muted-foreground">{t('ccsStream.stream.subagentScanDir')}</span>
              <span className="font-mono break-all text-foreground" title={subagentScanDir}>
                {subagentScanDir ?? '-'}
              </span>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
