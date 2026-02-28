import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

interface Props {
  isRunning: boolean
  exitCode: number | null
  sessionLogPath?: string
}

export function StreamStatusBar({ isRunning, exitCode, sessionLogPath }: Props) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-muted/30 text-xs text-muted-foreground shrink-0">
      {/* Status */}
      {isRunning && (
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
          <span className="text-warning font-medium">Running</span>
        </div>
      )}
      {!isRunning && exitCode === null && (
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span>Ready</span>
        </div>
      )}
      {!isRunning && exitCode !== null && (
        <Badge
          variant={exitCode === 0 ? 'outline' : 'destructive'}
          className="text-[10px] h-5 px-1.5"
        >
          exit {exitCode}
        </Badge>
      )}

      {/* Session log path */}
      {sessionLogPath && (
        <div className="ml-auto flex items-center gap-1.5 min-w-0">
          <FileText className="h-3 w-3 shrink-0" />
          <span
            className="truncate max-w-[260px] font-mono text-[10px]"
            title={sessionLogPath}
          >
            {sessionLogPath.split('/').slice(-2).join('/')}
          </span>
        </div>
      )}
    </div>
  )
}
