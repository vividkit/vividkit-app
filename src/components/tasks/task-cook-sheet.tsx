import { useEffect, useMemo, useRef } from 'react'
import { FlameKindling } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { getTerminalTheme } from '@/lib/utils'
import { useTaskStore } from '@/stores/task-store'
import type { Task } from '@/types'

interface TaskCookSheetProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskCookSheet({ task, open, onOpenChange }: TaskCookSheetProps) {
  const { t } = useTranslation()
  const cookLines = useMemo(
    () => [
      `\x1b[33m${t('tasks.cookSheet.terminal.creatingWorktree')}\x1b[0m\r\n`,
      `${t('tasks.cookSheet.terminal.worktreeCommand')}\r\n`,
      `\x1b[36m${t('tasks.cookSheet.terminal.implementingChanges')}\x1b[0m\r\n`,
      `${t('tasks.cookSheet.terminal.writingCode')}\r\n`,
      `${t('tasks.cookSheet.terminal.runningTests')}\r\n`,
      `\x1b[32m${t('tasks.cookSheet.terminal.implementationComplete')}\x1b[0m\r\n`,
      `\x1b[36m${t('tasks.cookSheet.terminal.filesChanged')}\x1b[0m\r\n`,
      `${t('tasks.cookSheet.terminal.changedFile1')}\r\n`,
      `${t('tasks.cookSheet.terminal.changedFile2')}\r\n`,
    ],
    [t],
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const updateStatus = useTaskStore((s) => s.updateStatus)

  useEffect(() => {
    if (!open || !containerRef.current || !task) return
    updateStatus(task.id, 'in_progress')

    const term = new Terminal({ theme: getTerminalTheme(), fontSize: 12 })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term

    let i = 0
    const interval = setInterval(() => {
      if (i < cookLines.length) { term.write(cookLines[i++]) } else { clearInterval(interval) }
    }, 500)

    return () => {
      clearInterval(interval)
      term.dispose()
      termRef.current = null
    }
  }, [open, task, updateStatus, cookLines])

  function handleMerge() {
    if (task) updateStatus(task.id, 'done')
    onOpenChange(false)
  }

  function handleDiscard() {
    if (task) updateStatus(task.id, 'todo')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <FlameKindling className="size-5 text-primary" />
            <SheetTitle className="text-base truncate">{task?.name ?? t('tasks.cookSheet.title')}</SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex-1 p-4 min-h-0">
          <div ref={containerRef} className="h-full rounded-lg border border-border bg-terminal-background" style={{ minHeight: 300 }} />
        </div>
        <div className="px-4 pb-4 flex gap-2 shrink-0">
          <Button variant="destructive" size="sm" onClick={handleDiscard}>{t('common.actions.discard')}</Button>
          <Button size="sm" className="flex-1" onClick={handleMerge}>{t('tasks.cookSheet.mergeToMain')}</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
