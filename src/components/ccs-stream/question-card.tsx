import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resumeCcsSession, sendCcsInput, stopCcs } from '@/lib/tauri'
import type { QuestionCard as QuestionCardType, Question } from '@/lib/jsonl-session-parser'

interface Props {
  item: QuestionCardType
  activeRunId: string | null
  sessionId?: string
  ccsCwd?: string
}

const ENTER_KEY = '\r'
const ARROW_DOWN = '\u001b[B'
const ARROW_UP = '\u001b[A'
const RESET_CURSOR_STEPS = 12

function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return String(error)
}

function moveDown(steps: number): string {
  if (steps <= 0) return ''
  return ARROW_DOWN.repeat(steps)
}

function resetCursorToTop(): string {
  return ARROW_UP.repeat(RESET_CURSOR_STEPS)
}

function buildQuestionInputChunks(q: Question, value: string | string[]): string[] {
  const chunks: string[] = [resetCursorToTop()]
  if (q.multiSelect) {
    const labels = Array.isArray(value) ? value : [value]
    const selectedIndexes = labels
      .map((label) => q.options.findIndex((opt) => opt.label === label))
      .filter((idx) => idx >= 0)
      .sort((a, b) => a - b)

    if (selectedIndexes.length === 0) {
      const fallback = labels.map((v) => v.trim()).filter(Boolean).join(', ')
      if (fallback) {
        chunks.push(moveDown(q.options.length), ENTER_KEY, fallback, ENTER_KEY, ENTER_KEY)
      } else {
        chunks.push(ENTER_KEY)
      }
      return chunks.filter(Boolean)
    }

    let cursor = 0
    for (const idx of selectedIndexes) {
      chunks.push(moveDown(idx - cursor), ENTER_KEY)
      cursor = idx
    }
    // Checkbox prompt includes "Type something" and then "Submit"
    const submitRow = q.options.length + 1
    chunks.push(moveDown(submitRow - cursor), ENTER_KEY)
    return chunks.filter(Boolean)
  }

  const text = Array.isArray(value) ? value.join(', ').trim() : value.trim()
  const matchedIndex = q.options.findIndex((opt) => opt.label === text)
  if (matchedIndex >= 0) {
    chunks.push(moveDown(matchedIndex), ENTER_KEY)
    return chunks.filter(Boolean)
  }

  // Fallback: open "Type something", type custom text, submit
  chunks.push(moveDown(q.options.length), ENTER_KEY, text, ENTER_KEY)
  return chunks.filter(Boolean)
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function toAnswerSummary(questions: Question[], answers: (string | string[])[]): string {
  return questions
    .map((q, idx) => {
      const raw = answers[idx]
      const value = Array.isArray(raw) ? raw.join(', ') : raw
      const header = q.header?.trim() ? q.header.trim() : `Q${idx + 1}`
      return `${header}: ${value.trim()}`
    })
    .join('\n')
}

// Renders a single question for selection (no submission yet)
function QuestionField({
  q,
  value,
  onChange,
  onSingleSelectOption,
  disabled,
}: {
  q: Question
  value: string | string[]
  onChange: (val: string | string[]) => void
  onSingleSelectOption?: () => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  const [showCustom, setShowCustom] = useState(false)
  const [customText, setCustomText] = useState('')

  function handleOptionClick(label: string) {
    if (disabled) return
    if (q.multiSelect) {
      const prev = Array.isArray(value) ? value : []
      const next = prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
      onChange(next)
    } else {
      onChange(label)
      onSingleSelectOption?.()
    }
  }

  function handleCustomChange(text: string) {
    setCustomText(text)
    onChange(text)
  }

  const selectedArr = Array.isArray(value) ? value : value ? [value] : []
  const isCustomActive = showCustom || (typeof value === 'string' && value && !q.options.find(o => o.label === value))

  return (
    <div className="space-y-2.5">
      {/* Question */}
      <p className="text-sm font-medium leading-snug">{q.question}</p>

      {/* Options */}
      <div className="space-y-1.5">
        {q.options.map((opt, i) => {
          const selected = selectedArr.includes(opt.label)
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => handleOptionClick(opt.label)}
              className={`w-full flex items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${selected
                  ? 'bg-primary/10 border border-primary/40 text-foreground'
                  : 'bg-muted/50 hover:bg-muted text-foreground border border-transparent'
                }`}
            >
              <span className={`shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded text-[10px] font-semibold transition-colors
                ${selected ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/15 text-muted-foreground'}`}>
                {i + 1}
              </span>
              <div className="min-w-0">
                <span className="font-medium">{opt.label}</span>
                {opt.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                )}
              </div>
            </button>
          )
        })}

        {/* Custom text option */}
        {!isCustomActive && !disabled && (
          <button
            onClick={() => setShowCustom(true)}
            className="w-full flex items-start gap-3 rounded-md px-3 py-2 text-left text-sm bg-muted/30 hover:bg-muted/60 border border-dashed border-border transition-colors text-muted-foreground"
          >
            <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-muted-foreground/10 text-[10px] font-semibold">
              {q.options.length + 1}
            </span>
            <span className="italic">{t('ccsStream.question.typeSomethingElse')}</span>
          </button>
        )}
        {isCustomActive && !disabled && (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={customText}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder={t('ccsStream.question.typeYourAnswer')}
              className="text-sm h-8 flex-1"
            />
            <button
              onClick={() => { setShowCustom(false); setCustomText(''); onChange('') }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Collects all answers then sends them sequentially via stdin
export function QuestionCard({ item, activeRunId, sessionId, ccsCwd }: Props) {
  const { t } = useTranslation()
  const questions = item.questions
  // answers[i] is string (single) or string[] (multiSelect)
  const [answers, setAnswers] = useState<(string | string[])[]>(() =>
    questions.map((q) => (q.multiSelect ? [] : ''))
  )
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Tab index — only used when multiple questions
  const [activeTab, setActiveTab] = useState(0)

  if (questions.length === 0) return null

  function setAnswer(i: number, val: string | string[]) {
    if (submitError) setSubmitError(null)
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? val : a)))
  }

  function isAnswered(val: string | string[]): boolean {
    return Array.isArray(val) ? val.length > 0 : val.trim().length > 0
  }

  const allAnswered = answers.every(isAnswered)

  async function handleSubmit() {
    console.log('[QuestionCard] handleSubmit activeRunId=', activeRunId, 'submitted=', submitted)
    if (submitted || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (sessionId) {
        const summary = toAnswerSummary(questions, answers)
        const output = await resumeCcsSession(sessionId, summary, ccsCwd || '.')
        console.log('[QuestionCard] resumeCcsSession sessionId=', sessionId, 'output_len=', output.length)
        if (activeRunId) {
          await stopCcs(activeRunId).catch(() => {})
        }
        setSubmitted(true)
        return
      }
      if (!activeRunId) throw new Error(t('ccsStream.question.errors.missingRunId'))
      // AskUserQuestion in CCS is an interactive TUI; send key sequences, not plain labels.
      for (let i = 0; i < questions.length; i += 1) {
        const chunks = buildQuestionInputChunks(questions[i], answers[i])
        console.log('[QuestionCard] sendCcsInput run_id=', activeRunId, 'q=', i, 'chunks=', chunks.length)
        for (const chunk of chunks) {
          await sendCcsInput(activeRunId, chunk)
          // Let TUI consume key events in order.
          await waitMs(120)
        }
        // Give prompt time to render the next question before continuing.
        await waitMs(180)
      }
      setSubmitted(true)
    } catch (e) {
      console.error('[QuestionCard] sendCcsInput error:', e)
      const detail = errorMessage(e)
      setSubmitError(
        detail
          ? t('ccsStream.question.errors.failedToSendWithDetail', { detail })
          : t('ccsStream.question.errors.failedToSend'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const isMulti = questions.length > 1

  return (
    <div className="px-4 space-y-3">
      {/* Awaiting indicator */}
      {!submitted && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
          <span>{t('ccsStream.question.awaitingInput')}</span>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card max-w-lg overflow-hidden">
        {/* Tab bar — only shown when multiple questions */}
        {isMulti && (
          <div className="flex border-b border-border overflow-x-auto">
            {questions.map((q, i) => {
              const answered = isAnswered(answers[i])
              const isActive = activeTab === i
              return (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors
                    ${isActive
                      ? 'border-primary text-foreground bg-background'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                >
                  {q.header || t('ccsStream.question.fallbackHeader', { index: i + 1 })}
                  {/* Answered indicator dot */}
                  {answered && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Single question — no tabs */}
          {!isMulti && (
            <>
              {questions[0].header && (
                <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  {questions[0].header}
                </span>
              )}
              <QuestionField
                q={questions[0]}
                value={answers[0]}
                onChange={(val) => setAnswer(0, val)}
                onSingleSelectOption={undefined}
                disabled={submitted || submitting}
              />
            </>
          )}

          {/* Multi question — show active tab only */}
          {isMulti && (
            <div>
              <QuestionField
                key={activeTab}
                q={questions[activeTab]}
                value={answers[activeTab]}
                onChange={(val) => setAnswer(activeTab, val)}
                onSingleSelectOption={() => {
                  const isCurrentMultiSelect = Boolean(questions[activeTab]?.multiSelect)
                  if (!isCurrentMultiSelect && activeTab < questions.length - 1) {
                    setActiveTab((t) => Math.min(questions.length - 1, t + 1))
                  }
                }}
                disabled={submitted || submitting}
              />
              {/* Tab navigation arrows */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <button
                  onClick={() => setActiveTab((t) => Math.max(0, t - 1))}
                  disabled={activeTab === 0}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← {t('ccsStream.question.prev')}
                </button>
                <span className="text-[10px] text-muted-foreground">
                  {activeTab + 1} / {questions.length}
                </span>
                <button
                  onClick={() => setActiveTab((t) => Math.min(questions.length - 1, t + 1))}
                  disabled={activeTab === questions.length - 1}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {t('ccsStream.question.next')} →
                </button>
              </div>
            </div>
          )}

          {/* Submit / status */}
          {!submitted ? (
            <Button
              size="sm"
              className="w-full mt-1"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting || (!activeRunId && !sessionId)}
            >
              {submitting
                ? t('ccsStream.question.sending')
                : (questions.length > 1
                  ? t('ccsStream.question.submitAnswers', { count: questions.length })
                  : t('ccsStream.question.submitAnswer'))}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center">{t('ccsStream.question.allAnswersSent')}</p>
          )}
          {submitError && (
            <p className="text-xs text-destructive text-center">{submitError}</p>
          )}
        </div>
      </div>
    </div>
  )
}
