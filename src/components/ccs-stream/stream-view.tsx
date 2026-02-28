import { useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { UserMessage } from './user-message'
import { AIMessage } from './ai-message'
import { SystemLine } from './system-line'
import { QuestionCard } from './question-card'
import { StreamStatusBar } from './stream-status-bar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  parseSessionLine,
  sessionEntriesToConversation,
  type RawSessionEntry,
} from '@/lib/jsonl-session-parser'
import { resumeCcsSession, sendCcsInput, watchSessionLog, stopSessionLogWatch } from '@/lib/tauri'

interface Props {
  sessionLogPath?: string
  isRunning: boolean
  exitCode: number | null
  activeRunId?: string | null
  ccsCwd?: string
}

// Derive a stable session_id from the log path (last two path segments)
function sessionIdFromPath(path: string): string {
  return path.split('/').slice(-2).join('/')
}

export function StreamView({ sessionLogPath, isRunning, exitCode, activeRunId, ccsCwd }: Props) {
  const [entries, setEntries] = useState<RawSessionEntry[]>([])
  const [manualInput, setManualInput] = useState('')
  const [sendingManual, setSendingManual] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEntries([])
  }, [sessionLogPath])

  useEffect(() => {
    if (!sessionLogPath) return
    const sessionId = sessionIdFromPath(sessionLogPath)
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
  const sessionId = sessionLogPath ? sessionLogPath.split('/').slice(-1)[0].replace(/\.jsonl$/, '') : undefined
  const canSendManual = Boolean((activeRunId && isRunning) || sessionId)

  async function handleManualSend() {
    const text = manualInput.trim()
    if (!text || sendingManual) return
    setSendingManual(true)
    setManualError(null)
    try {
      if (activeRunId && isRunning) {
        await sendCcsInput(activeRunId, `${text}\r`)
      } else if (sessionId) {
        await resumeCcsSession(sessionId, text, ccsCwd || '.')
      } else {
        throw new Error('No active run or session to continue')
      }
      setManualInput('')
    } catch (e) {
      const message = typeof e === 'string'
        ? e
        : e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string'
          ? (e as { message: string }).message
          : 'Failed to send message'
      setManualError(message)
    } finally {
      setSendingManual(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <StreamStatusBar
        isRunning={isRunning}
        exitCode={exitCode}
        sessionLogPath={sessionLogPath}
      />
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto py-6 space-y-6">
        {items.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            {sessionLogPath
              ? 'Waiting for session output...'
              : 'Start a CCS run to see stream output here.'}
          </div>
        )}
        {items.map((item, idx) =>
          item.type === 'user' ? (
            <UserMessage key={item.id} item={item} />
          ) : item.type === 'system' ? (
            <SystemLine key={item.id} item={item} />
          ) : item.type === 'question' ? (
            <QuestionCard
              key={item.id}
              item={item}
              activeRunId={activeRunId ?? null}
              sessionId={sessionId}
              ccsCwd={ccsCwd}
            />
          ) : (
            <AIMessage key={item.id} item={item} isLast={idx === items.length - 1} />
          ),
        )}
        <div ref={bottomRef} />
      </div>
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
            placeholder="Reply to assistant... (Cmd/Ctrl + Enter to send)"
            className="flex-1 min-h-[72px] max-h-[200px]"
            disabled={!canSendManual || sendingManual}
          />
          <Button
            size="sm"
            onClick={() => void handleManualSend()}
            disabled={!canSendManual || sendingManual || manualInput.trim().length === 0}
          >
            {sendingManual ? 'Sending...' : 'Send'}
          </Button>
        </div>
        {manualError && <p className="text-xs text-destructive">{manualError}</p>}
      </div>
    </div>
  )
}
