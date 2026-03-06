import { Badge } from '@/components/ui/badge'
import { FileText, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tailPathSegments } from '@/lib/session-path-utils'

interface Props {
  isRunning: boolean
  exitCode: number | null
  sessionLogPath?: string
}

export function StreamStatusBar({ isRunning, exitCode, sessionLogPath }: Props) {
  const { t } = useTranslation()
  const isDone = exitCode !== null
  const isInProgress = isRunning && !isDone

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-muted/30 text-xs text-muted-foreground shrink-0">
      {isInProgress && (
        <div className="inline-flex items-center gap-2 rounded-md border border-info/30 bg-info/10 px-2.5 py-1 text-info">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="font-medium">{t('common.messages.sessionInProgress')}</span>
        </div>
      )}
      {!isInProgress && !isDone && (
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span>{t('common.status.ready')}</span>
        </div>
      )}
      {isDone && (
        <Badge
          variant={exitCode === 0 ? 'outline' : 'destructive'}
          className="text-[10px] h-5 px-1.5"
        >
          {t('ccsStream.tool.exitCode', { code: exitCode })}
        </Badge>
      )}

      {sessionLogPath && (
        <div className="ml-auto flex items-center gap-1.5 min-w-0">
          <FileText className="h-3 w-3 shrink-0" />
          <span
            className="truncate max-w-[260px] font-mono text-[10px]"
            title={sessionLogPath}
          >
            {tailPathSegments(sessionLogPath, 2)}
          </span>
        </div>
      )}
    </div>
  )
}
