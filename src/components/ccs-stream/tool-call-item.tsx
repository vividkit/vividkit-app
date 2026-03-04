import { useMemo, useState, type ReactNode } from 'react'
import { diffLines } from 'diff'
import { Check, ChevronRight, Copy, FileCode, PenLine, Search, Terminal, Wrench } from 'lucide-react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import ruby from 'react-syntax-highlighter/dist/esm/languages/prism/ruby'
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'
import { useTheme } from '@/components/layout'
import type { ToolCall } from '@/lib/jsonl-session-parser'

;[
  ['bash', bash],
  ['go', go],
  ['json', json],
  ['jsx', jsx],
  ['markdown', markdown],
  ['python', python],
  ['ruby', ruby],
  ['rust', rust],
  ['tsx', tsx],
  ['typescript', tsx],
  ['yaml', yaml],
].forEach(([name, lang]) => SyntaxHighlighter.registerLanguage(name as string, lang))

interface Props { tool: ToolCall; defaultExpanded?: boolean; hideHeader?: boolean }
const MAX_PREVIEW_CHARS = 40000
const MAX_GLOB_MATCHES_PREVIEW = 300
const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'jsx', jsx: 'jsx', py: 'python', rs: 'rust',
  go: 'go', rb: 'ruby', ruby: 'ruby', json: 'json', yml: 'yaml', yaml: 'yaml', md: 'markdown', sh: 'bash', bash: 'bash',
}
const toToolNameParts = (name: string): string[] =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[./:]/)
    .flatMap((part) => part.split(/[^a-z0-9]+/))
    .filter((part) => part.length > 0)

const hasToolVariant = (name: string, target: 'task' | 'agent'): boolean =>
  toToolNameParts(name).some(
    (part) => part === target || part.startsWith(target) || part.endsWith(target)
  )

const normalizeToolName = (name: unknown) => {
  if (typeof name !== 'string') return 'UnknownTool'
  const trimmed = name.trim()
  if (!trimmed) return 'UnknownTool'
  if (trimmed === 'Task') return 'Task'
  if (trimmed === 'Agent') return 'Agent'
  const key = trimmed.match(/(?:^|[./:])([a-z]+)$/i)?.[1]?.toLowerCase() ?? trimmed.toLowerCase()
  if (key === 'read') return 'Read'
  if (key === 'write') return 'Write'
  if (key === 'edit') return 'Edit'
  if (key === 'multiedit') return 'MultiEdit'
  if (key === 'glob') return 'Glob'
  if (key === 'bash') return 'Bash'
  return trimmed
}
const toolIconForName = (toolName: string): ReactNode => {
  if (toolName === 'Read') return <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  if (toolName === 'Write' || toolName === 'Edit' || toolName === 'MultiEdit') return <PenLine className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  if (toolName === 'Glob') return <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  if (toolName === 'Bash') return <Terminal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  return <Wrench className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
}
const clipText = (text: string) => (text.length > MAX_PREVIEW_CHARS ? text.slice(0, MAX_PREVIEW_CHARS) : text)
const stripAnsiCodes = (text: string) =>
  text
    .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, '')
    .replace(/\u009d[^\u0007]*(?:\u0007|\u001b\\)/g, '')
    .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '')
    .replace(/\u009b[0-9;?]*[ -/]*[@-~]/g, '')
const getToolSummary = (input: Record<string, unknown>) => { const first = Object.values(input)[0]; return typeof first === 'string' ? first.split('\n')[0].slice(0, 80) : '' }
const pickFilePath = (input: Record<string, unknown>) => { const path = input.file_path ?? input.path; return typeof path === 'string' ? path : 'unknown' }
const inferLanguage = (path: string) => EXT_TO_LANG[path.split('.').pop()?.toLowerCase() ?? ''] ?? 'text'
const toBaseName = (path: string) => path.split(/[\\/]/).pop() ?? path
const sanitizeReadOutput = (text: string) => {
  const prefixRe = /^\s*(\d+)\s*(?:->|→)([ \t]*)/
  const removePrefix = (line: string) => line.replace(prefixRe, (_match, _num, spaces: string) => (spaces.length > 0 ? spaces.slice(1) : ''))
  const plainLine = (line: string) => removePrefix(line).trim()
  let lines = text.split('\n')
  const open = lines.findIndex((line) => /^<system-reminder>\s*$/i.test(plainLine(line)))
  if (open !== -1) {
    const close = lines.findIndex((line, idx) => idx >= open && /^<\/system-reminder>\s*$/i.test(plainLine(line)))
    if (close !== -1 && lines.slice(close + 1).every((line) => plainLine(line).length === 0)) lines = lines.slice(0, open)
  }
  const nonEmpty = lines.filter((line) => line.trim().length > 0)
  const nums = nonEmpty.map((line) => prefixRe.exec(line)).filter((m): m is RegExpExecArray => m !== null).map((m) => Number(m[1]))
  const sequential = nums.every((num, idx) => idx === 0 || num === nums[idx - 1] + 1)
  const shouldStrip = nums.length > 0 && sequential && nums.length >= Math.ceil(nonEmpty.length * 0.4)
  return (shouldStrip ? lines.map(removePrefix) : lines).join('\n').trim()
}
const readString = (record: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}
const extractTaggedContent = (raw: string, tag: 'stdout' | 'stderr') => {
  const regex = new RegExp(`<local-command-${tag}>([\\s\\S]*?)<\\/local-command-${tag}>`, 'gi')
  const parts = [...raw.matchAll(regex)].map((match) => match[1].trim()).filter((text) => text.length > 0)
  return { hasTag: new RegExp(`<local-command-${tag}>`, 'i').test(raw), text: parts.join('\n') }
}
const parseBashResult = (raw: string) => {
  const stdoutTagged = extractTaggedContent(raw, 'stdout')
  const stderrTagged = extractTaggedContent(raw, 'stderr')
  if (stdoutTagged.hasTag || stderrTagged.hasTag) {
    return { stdout: stdoutTagged.text, stderr: stderrTagged.text, exitCode: undefined as number | undefined }
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      const text = parsed
        .map((block) =>
          typeof block === 'object' && block !== null && 'text' in block
            ? String((block as { text?: unknown }).text ?? '')
            : JSON.stringify(block)
        )
        .join('\n')
        .trim()
      return { stdout: text, stderr: '', exitCode: undefined as number | undefined }
    }
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>
      const stdout = readString(record, 'stdout', 'content', 'result', 'message')
      const stderr = readString(record, 'stderr', 'error')
      const exit = record.exitCode ?? record.exit_code
      const exitCode =
        typeof exit === 'number'
          ? exit
          : typeof exit === 'string' && /^-?\d+$/.test(exit.trim())
            ? Number(exit)
            : undefined
      if (stdout || stderr || exitCode !== undefined) return { stdout, stderr, exitCode }
    }
  } catch {
    // keep raw text fallback
  }
  return { stdout: raw.trim(), stderr: '', exitCode: undefined as number | undefined }
}
const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}
const isLikelyPathLine = (line: string) => {
  if (!line) return false
  if (line.length > 260) return false
  if (line.includes('Reason:') || line.includes('Tip:')) return false
  return /[\\/]/.test(line) || /\.[a-z0-9]{1,8}$/i.test(line)
}
const parseGlobResult = (raw: string) => {
  const cleaned = stripAnsiCodes(raw).trim()
  if (!cleaned) return { matches: [] as string[], text: '' }

  try {
    const parsed = JSON.parse(cleaned) as unknown
    if (Array.isArray(parsed)) {
      const matches = toStringArray(parsed)
      if (matches.length > 0) return { matches, text: '' }
    }
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>
      const arrayKeys = ['matches', 'paths', 'files', 'file_paths', 'filePaths', 'filenames', 'results']
      for (const key of arrayKeys) {
        const matches = toStringArray(record[key])
        if (matches.length > 0) return { matches, text: '' }
      }
      const fallbackText = readString(record, 'output', 'content', 'message', 'error', 'result')
      return { matches: [], text: stripAnsiCodes(fallbackText || cleaned).trim() }
    }
  } catch {
    // not JSON payload, continue with plain-text parsing
  }

  const normalizedLines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, '').replace(/^"+|"+$/g, ''))
  const pathLikeLines = normalizedLines.filter(isLikelyPathLine)
  if (pathLikeLines.length >= 1 && pathLikeLines.length >= Math.ceil(normalizedLines.length * 0.6)) {
    return { matches: pathLikeLines, text: '' }
  }

  return { matches: [], text: cleaned }
}
const formatStructuredOutput = (raw: string): string => {
  const cleaned = stripAnsiCodes(raw).trim()
  if (!cleaned) return ''
  try {
    const parsed = JSON.parse(cleaned) as unknown
    if (typeof parsed === 'string') return parsed.trim()
    return JSON.stringify(parsed, null, 2)
  } catch {
    return cleaned
  }
}
function renderDiffBlock(toolName: string, filePath: string, language: string, oldString: string, newString: string) {
  const rows = diffLines(oldString, newString).flatMap((part) => {
    const lines = part.value.replace(/\r\n/g, '\n').split('\n')
    const normalized = lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines
    return normalized.map((line) => ({ line, kind: part.added ? 'add' : part.removed ? 'remove' : 'context' }))
  })
  const added = rows.filter((row) => row.kind === 'add').length
  const removed = rows.filter((row) => row.kind === 'remove').length

  return (
    <div className="overflow-hidden rounded border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-1.5 text-xs">
        <span className="rounded border border-border bg-background px-1.5 py-0.5 font-medium text-foreground">{toolName}</span>
        <span className="truncate font-mono text-foreground">{toBaseName(filePath)}</span>
        <span className="rounded border border-border bg-background/70 px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">{language}</span>
        <span className="text-success">+{added}</span>
        <span className="text-destructive">-{removed}</span>
      </div>
      <div className="stream-scrollbar max-h-56 overflow-auto font-mono text-xs">
        {rows.map((row, index) => (
          <div
            key={`${row.kind}-${index}`}
            className={`flex gap-2 px-2 py-0.5 ${
              row.kind === 'add' ? 'border-l-2 border-success/40 bg-success/10 text-success' :
              row.kind === 'remove' ? 'border-l-2 border-destructive/40 bg-destructive/10 text-destructive' :
              'border-l-2 border-transparent text-muted-foreground'
            }`}
          >
            <span className="w-8 shrink-0 text-right opacity-70">{index + 1}</span>
            <span className="w-3 shrink-0">{row.kind === 'add' ? '+' : row.kind === 'remove' ? '-' : ' '}</span>
            <span className="flex-1 whitespace-pre-wrap break-all">{row.line || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
export function ToolCallItem({ tool, defaultExpanded = false, hideHeader = false }: Props) {
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [copied, setCopied] = useState(false)
  const shouldShowBody = hideHeader || expanded
  const resultText = useMemo(() => (shouldShowBody ? (tool.result ?? '') : ''), [shouldShowBody, tool.result])
  const resultPreview = clipText(resultText)
  const resultTruncated = resultPreview.length < resultText.length
  const input: Record<string, unknown> = tool.input && typeof tool.input === 'object' ? tool.input : {}

  const isTaskTool = hasToolVariant(tool.name, 'task')
  const isAgentTool = hasToolVariant(tool.name, 'agent')
  const isTaskOrAgentTool = isTaskTool || isAgentTool
  const toolName = normalizeToolName(tool.name)
  const isRead = toolName === 'Read'
  const isWrite = toolName === 'Write'
  const isEdit = toolName === 'Edit'
  const isMultiEdit = toolName === 'MultiEdit'
  const isBash = toolName === 'Bash'
  const isGlob = toolName === 'Glob'
  const hasResult = tool.result !== undefined
  const taskFamilySummary = readString(
    input,
    'subject',
    'description',
    'prompt',
    'instruction',
    'message',
    'query'
  ) || readString(input, 'subagent_type', 'subagentType', 'agent_type', 'agentType', 'name')
  const summary = isTaskOrAgentTool
    ? (taskFamilySummary || getToolSummary(input))
    : getToolSummary(input)

  const filePath = pickFilePath(input)
  const language = inferLanguage(filePath)
  const syntaxStyle = theme === 'dark' ? oneDark : oneLight
  const hasOldString = typeof input.old_string === 'string'
  const hasNewString = typeof input.new_string === 'string'
  const oldString = hasOldString ? (input.old_string as string) : ''
  const newString = hasNewString ? (input.new_string as string) : ''
  const writeContent = typeof input.content === 'string' ? input.content : resultText
  const rawCodeContent = isWrite ? writeContent : isRead ? sanitizeReadOutput(resultText) : resultText
  const codeContent = clipText(rawCodeContent)
  const previewTruncated = rawCodeContent.length > codeContent.length
  const bashDescription = typeof input.description === 'string' ? input.description : ''
  const bashCommand = typeof input.command === 'string' ? input.command : ''
  const bashResult = useMemo(
    () =>
      isBash
        ? parseBashResult(resultText)
        : { stdout: '', stderr: '', exitCode: undefined as number | undefined },
    [isBash, resultText]
  )
  const bashStdoutPreview = clipText(bashResult.stdout)
  const bashStderrPreview = clipText(bashResult.stderr)
  const bashTruncated =
    bashStdoutPreview.length < bashResult.stdout.length ||
    bashStderrPreview.length < bashResult.stderr.length
  const globPattern = typeof input.pattern === 'string' ? input.pattern : (typeof input.glob === 'string' ? input.glob : '')
  const globPath = typeof input.path === 'string' ? input.path : (typeof input.cwd === 'string' ? input.cwd : '')
  const globResult = useMemo(
    () =>
      isGlob
        ? parseGlobResult(resultText)
        : { matches: [] as string[], text: '' },
    [isGlob, resultText]
  )
  const globMatches = globResult.matches.slice(0, MAX_GLOB_MATCHES_PREVIEW)
  const globMatchTruncated = globMatches.length < globResult.matches.length
  const globOutputPreview = clipText(globResult.text)
  const globOutputTruncated = globOutputPreview.length < globResult.text.length
  const taskOrAgentInputText = readString(
    input,
    'subject',
    'description',
    'prompt',
    'instruction',
    'message',
    'query'
  )
  const taskOrAgentMetadata = [
    { label: 'type', value: readString(input, 'subagent_type', 'subagentType', 'agent_type', 'agentType') },
    { label: 'id', value: readString(input, 'agent_id', 'agentId', 'teammate_id', 'teammateId') },
  ].filter((entry): entry is { label: string; value: string } => entry.value.length > 0)
  const taskOrAgentFallbackInput = useMemo(() => {
    if (taskOrAgentInputText || taskOrAgentMetadata.length > 0) return ''
    if (Object.keys(input).length === 0) return ''
    return JSON.stringify(input, null, 2)
  }, [input, taskOrAgentInputText, taskOrAgentMetadata])
  const taskOrAgentOutputText = useMemo(
    () => (isTaskOrAgentTool ? formatStructuredOutput(resultText) : ''),
    [isTaskOrAgentTool, resultText]
  )
  const taskOrAgentOutputPreview = clipText(taskOrAgentOutputText)
  const taskOrAgentOutputTruncated = taskOrAgentOutputPreview.length < taskOrAgentOutputText.length

  const multiEdits = Array.isArray(input.edits)
    ? input.edits
        .map((edit) => {
          if (typeof edit !== 'object' || !edit) return null
          const oldValue = (edit as { old_string?: unknown }).old_string
          const newValue = (edit as { new_string?: unknown }).new_string
          return typeof oldValue === 'string' && typeof newValue === 'string'
            ? { oldString: clipText(oldValue), newString: clipText(newValue) }
            : null
        })
        .filter((v): v is { oldString: string; newString: string } => v !== null)
    : []

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={hideHeader ? '' : 'group'}>
      {!hideHeader && (
        <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-muted/35">
          {toolIconForName(toolName)}
          <span className="shrink-0 text-xs font-semibold text-foreground">{toolName}</span>
          {summary ? (
            <>
              <span className="shrink-0 text-xs text-muted-foreground">-</span>
              <span className="flex-1 truncate text-xs text-muted-foreground">{summary}</span>
            </>
          ) : (
            <span className="flex-1" />
          )}
          {hasResult ? (
            <span
              className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${tool.isError ? 'bg-destructive' : 'bg-success'}`}
              title={tool.isError ? 'error' : 'done'}
            />
          ) : (
            <span className="ml-auto h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-warning" />
          )}
          <ChevronRight className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      )}

      {shouldShowBody && (
        <div className={hideHeader ? 'space-y-2' : 'space-y-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2'}>
          {(isRead || isWrite) && hasResult && (
            <div className="overflow-hidden rounded border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-1.5 text-xs">
                {isRead ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded border border-border bg-background text-muted-foreground">
                    <FileCode className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="rounded border border-border bg-background px-1.5 py-0.5 font-medium text-foreground">{toolName}</span>
                )}
                <span className="truncate font-mono text-foreground">{toBaseName(filePath)}</span>
                <span className="rounded border border-border bg-background/70 px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">{language}</span>
                {!tool.isError && <button onClick={() => void handleCopy(codeContent)} className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted" title="Copy code">{copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}</button>}
              </div>
              {(previewTruncated || resultTruncated) && <div className="border-b border-border bg-muted/20 px-3 py-1 text-[11px] text-muted-foreground">Preview truncated for performance</div>}
              {tool.isError ? (
                <pre className="stream-scrollbar max-h-48 overflow-x-auto whitespace-pre-wrap bg-destructive/5 p-2 font-mono text-sm text-destructive">{resultPreview}</pre>
              ) : (
                <div className="stream-scrollbar max-h-56 overflow-auto">
                  <SyntaxHighlighter language={language} style={syntaxStyle} showLineNumbers customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.875rem', background: 'transparent', whiteSpace: 'pre' }} codeTagProps={{ style: { background: 'transparent' } }} lineNumberStyle={{ minWidth: '2.4rem', opacity: 0.55, userSelect: 'none' }}>{codeContent || '\n'}</SyntaxHighlighter>
                </div>
              )}
            </div>
          )}
          {(isRead || isWrite) && !hasResult && <div className="rounded border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">Waiting for {toolName} result...</div>}
          {isBash && (
            <div className="overflow-hidden rounded border border-border bg-card">
              <div className="space-y-3 p-3">
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Input</div>
                  {bashDescription && <div className="mb-1 text-xs text-muted-foreground">{bashDescription}</div>}
                  <pre className="stream-scrollbar max-h-40 overflow-x-auto whitespace-pre-wrap rounded border border-border bg-muted/20 px-2.5 py-2 font-mono text-xs text-foreground">{bashCommand || '(empty command)'}</pre>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Output</span>
                    {typeof bashResult.exitCode === 'number' && (
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] ${bashResult.exitCode === 0 ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
                        exit {bashResult.exitCode}
                      </span>
                    )}
                  </div>
                  {!hasResult && <div className="rounded border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">Waiting for Bash result...</div>}
                  {hasResult && (
                    <div className="overflow-hidden rounded border border-border bg-black/[0.035]">
                      {bashTruncated && <div className="border-b border-border bg-muted/20 px-3 py-1 text-[11px] text-muted-foreground">Preview truncated for performance</div>}
                      {bashStdoutPreview && <pre className="stream-scrollbar max-h-48 overflow-x-auto whitespace-pre-wrap px-3 py-2 font-mono text-xs text-foreground">{bashStdoutPreview}</pre>}
                      {bashStderrPreview && <pre className={`stream-scrollbar max-h-40 overflow-x-auto whitespace-pre-wrap border-t border-border px-3 py-2 font-mono text-xs ${tool.isError ? 'bg-destructive/5 text-destructive' : 'text-destructive'}`}>{bashStderrPreview}</pre>}
                      {!bashStdoutPreview && !bashStderrPreview && <div className="px-3 py-2 text-xs text-muted-foreground">(empty output)</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {isGlob && (
            <div className="overflow-hidden rounded border border-border bg-card">
              <div className="space-y-3 p-3">
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Input</div>
                  <div className="overflow-hidden rounded border border-border bg-muted/20">
                    <div className="flex items-start gap-2 border-b border-border px-3 py-2 text-xs">
                      <span className="w-14 shrink-0 font-medium text-muted-foreground">pattern</span>
                      <code className="font-mono text-foreground">{globPattern || '(not provided)'}</code>
                    </div>
                    <div className="flex items-start gap-2 px-3 py-2 text-xs">
                      <span className="w-14 shrink-0 font-medium text-muted-foreground">path</span>
                      <code className="break-all font-mono text-foreground">{globPath || '(not provided)'}</code>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Output</span>
                    {globResult.matches.length > 0 && (
                      <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] normal-case text-foreground">
                        {globResult.matches.length} matches
                      </span>
                    )}
                  </div>
                  {!hasResult && <div className="rounded border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">Waiting for Glob result...</div>}
                  {hasResult && globMatches.length > 0 && (
                    <div className="overflow-hidden rounded border border-border bg-black/[0.025]">
                      {globMatchTruncated && <div className="border-b border-border bg-muted/20 px-3 py-1 text-[11px] text-muted-foreground">Preview truncated for performance</div>}
                      <div className="stream-scrollbar max-h-56 overflow-auto py-1">
                        {globMatches.map((match, idx) => (
                          <div key={`${match}-${idx}`} className="flex items-start gap-2 px-3 py-1.5 text-xs">
                            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                            <code className="break-all font-mono text-foreground">{match}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasResult && globMatches.length === 0 && (
                    <div>
                      {globOutputTruncated && <div className="rounded-t border border-border border-b-0 bg-muted/20 px-3 py-1 text-[11px] text-muted-foreground">Preview truncated for performance</div>}
                      <pre className={`stream-scrollbar max-h-48 overflow-x-auto whitespace-pre-wrap rounded border p-2 font-mono text-sm ${tool.isError ? 'border-destructive/20 bg-destructive/5 text-destructive' : 'border-border bg-card'}`}>{globOutputPreview || '(empty output)'}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {isTaskOrAgentTool && (
            <div className="overflow-hidden rounded border border-border bg-card">
              <div className="space-y-3 p-3">
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Input</div>
                  {taskOrAgentInputText ? (
                    <pre className="stream-scrollbar max-h-40 overflow-x-auto whitespace-pre-wrap rounded border border-border bg-muted/20 px-2.5 py-2 font-mono text-xs text-foreground">
                      {taskOrAgentInputText}
                    </pre>
                  ) : taskOrAgentFallbackInput ? (
                    <pre className="stream-scrollbar max-h-40 overflow-x-auto whitespace-pre-wrap rounded border border-border bg-muted/20 px-2.5 py-2 font-mono text-xs text-foreground">
                      {taskOrAgentFallbackInput}
                    </pre>
                  ) : (
                    <div className="rounded border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      (not provided)
                    </div>
                  )}
                  {taskOrAgentMetadata.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded border border-border bg-muted/10">
                      {taskOrAgentMetadata.map((entry, index) => (
                        <div
                          key={`${entry.label}-${index}`}
                          className={`flex items-start gap-2 px-3 py-2 text-xs ${index > 0 ? 'border-t border-border' : ''}`}
                        >
                          <span className="w-10 shrink-0 font-medium text-muted-foreground">{entry.label}</span>
                          <code className="break-all font-mono text-foreground">{entry.value}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Output</div>
                  {!hasResult && (
                    <div className="rounded border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      Waiting for {toolName} result...
                    </div>
                  )}
                  {hasResult && (
                    <div>
                      {taskOrAgentOutputTruncated && (
                        <div className="rounded-t border border-border border-b-0 bg-muted/20 px-3 py-1 text-[11px] text-muted-foreground">
                          Preview truncated for performance
                        </div>
                      )}
                      <pre
                        className={`stream-scrollbar max-h-48 overflow-x-auto whitespace-pre-wrap rounded border p-2 font-mono text-sm ${
                          tool.isError
                            ? 'border-destructive/20 bg-destructive/5 text-destructive'
                            : 'border-border bg-card'
                        }`}
                      >
                        {taskOrAgentOutputPreview || '(empty output)'}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {isEdit && hasOldString && hasNewString && renderDiffBlock(toolName, filePath, language, clipText(oldString), clipText(newString))}
          {isMultiEdit && multiEdits.map((edit, idx) => <div key={idx} className="space-y-1"><div className="text-[11px] text-muted-foreground">Edit #{idx + 1}</div>{renderDiffBlock(toolName, filePath, language, edit.oldString, edit.newString)}</div>)}
          {((isEdit && (!hasOldString || !hasNewString)) || (isMultiEdit && multiEdits.length === 0)) && <pre className="stream-scrollbar max-h-48 overflow-x-auto whitespace-pre-wrap rounded border border-border bg-card p-2 font-mono text-sm">{JSON.stringify(input, null, 2)}</pre>}
          {!isRead && !isWrite && !isEdit && !isMultiEdit && !isBash && !isGlob && !isTaskOrAgentTool && <pre className="stream-scrollbar max-h-48 overflow-x-auto whitespace-pre-wrap rounded border border-border bg-card p-2 font-mono text-sm">{JSON.stringify(input, null, 2)}</pre>}
          {hasResult && !(isRead || isWrite || isBash || isGlob || isTaskOrAgentTool) && (
            <div>
              {resultTruncated && <div className="rounded-t border border-border border-b-0 bg-muted/20 px-3 py-1 text-[11px] text-muted-foreground">Preview truncated for performance</div>}
              <pre className={`stream-scrollbar max-h-48 overflow-x-auto whitespace-pre-wrap rounded border p-2 font-mono text-sm ${tool.isError ? 'border-destructive/20 bg-destructive/5 text-destructive' : 'border-border bg-card'}`}>{resultPreview}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
