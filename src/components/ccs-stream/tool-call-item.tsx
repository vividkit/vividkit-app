import { useMemo, useState } from 'react'
import { diffLines } from 'diff'
import { Check, ChevronRight, Copy } from 'lucide-react'
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
const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'jsx', jsx: 'jsx', py: 'python', rs: 'rust',
  go: 'go', rb: 'ruby', ruby: 'ruby', json: 'json', yml: 'yaml', yaml: 'yaml', md: 'markdown', sh: 'bash', bash: 'bash',
}
const normalizeToolName = (name: unknown) => {
  const key = typeof name === 'string' ? name.match(/(?:^|[./:])([a-z]+)$/i)?.[1]?.toLowerCase() : undefined
  return key === 'read' ? 'Read' : key === 'write' ? 'Write' : key === 'edit' ? 'Edit' : key === 'multiedit' ? 'MultiEdit' : typeof name === 'string' ? name : 'UnknownTool'
}
const clipText = (text: string) => (text.length > MAX_PREVIEW_CHARS ? text.slice(0, MAX_PREVIEW_CHARS) : text)
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

  const toolName = normalizeToolName(tool.name)
  const isRead = toolName === 'Read'
  const isWrite = toolName === 'Write'
  const isEdit = toolName === 'Edit'
  const isMultiEdit = toolName === 'MultiEdit'
  const hasResult = tool.result !== undefined

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
        <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/30">
          <ChevronRight className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
          <span className="shrink-0 text-xs font-semibold text-foreground">{toolName}</span>
          {getToolSummary(input) && <span className="flex-1 truncate text-xs text-muted-foreground">{getToolSummary(input)}</span>}
          {hasResult ? <span className={`ml-auto shrink-0 text-[10px] font-medium ${tool.isError ? 'text-destructive' : 'text-success'}`}>{tool.isError ? 'error' : 'done'}</span> : <span className="ml-auto h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-warning" />}
        </button>
      )}

      {shouldShowBody && (
        <div className={hideHeader ? 'space-y-2' : 'space-y-2 bg-muted/20 px-3 pb-2'}>
          {(isRead || isWrite) && hasResult && (
            <div className="overflow-hidden rounded border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-1.5 text-xs">
                <span className="rounded border border-border bg-background px-1.5 py-0.5 font-medium text-foreground">{toolName}</span>
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
          {isEdit && hasOldString && hasNewString && renderDiffBlock(toolName, filePath, language, clipText(oldString), clipText(newString))}
          {isMultiEdit && multiEdits.map((edit, idx) => <div key={idx} className="space-y-1"><div className="text-[11px] text-muted-foreground">Edit #{idx + 1}</div>{renderDiffBlock(toolName, filePath, language, edit.oldString, edit.newString)}</div>)}
          {((isEdit && (!hasOldString || !hasNewString)) || (isMultiEdit && multiEdits.length === 0)) && <pre className="stream-scrollbar max-h-48 overflow-x-auto whitespace-pre-wrap rounded border border-border bg-card p-2 font-mono text-sm">{JSON.stringify(input, null, 2)}</pre>}
          {!isRead && !isWrite && !isEdit && !isMultiEdit && <pre className="stream-scrollbar max-h-48 overflow-x-auto whitespace-pre-wrap rounded border border-border bg-card p-2 font-mono text-sm">{JSON.stringify(input, null, 2)}</pre>}
          {hasResult && !(isRead || isWrite) && (
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
