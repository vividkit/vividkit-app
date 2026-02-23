import { useEffect, useRef } from 'react'
import { FlameKindling } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { getTerminalTheme } from '@/lib/utils'
import { useTaskStore } from '@/stores/task-store'
import type { Task } from '@/types'

const COOK_LINES = [
  '\x1b[33m$ Creating worktree...\x1b[0m\r\n',
  'git worktree add .worktrees/task-branch\r\n',
  '\x1b[36mImplementing changes...\x1b[0m\r\n',
  '> Writing code...\r\n',
  '> Running tests...\r\n',
  '\x1b[32m✓ Implementation complete!\x1b[0m\r\n',
  '\x1b[36mFiles changed:\x1b[0m\r\n',
  '  src/components/feature.tsx (+45/-2)\r\n',
  '  src/stores/feature-store.ts (+12)\r\n',
]

interface TaskCookSheetProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskCookSheet({ task, open, onOpenChange }: TaskCookSheetProps) {
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
      if (i < COOK_LINES.length) { term.write(COOK_LINES[i++]) } else { clearInterval(interval) }
    }, 500)

    return () => {
      clearInterval(interval)
      term.dispose()
      termRef.current = null
    }
  }, [open, task, updateStatus])

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
            <SheetTitle className="text-base truncate">{task?.name ?? 'Cooking…'}</SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex-1 p-4 min-h-0">
          <div ref={containerRef} className="h-full rounded-lg border border-border bg-terminal-background" style={{ minHeight: 300 }} />
        </div>
        <div className="px-4 pb-4 flex gap-2 shrink-0">
          <Button variant="destructive" size="sm" onClick={handleDiscard}>Discard</Button>
          <Button size="sm" className="flex-1" onClick={handleMerge}>Merge to Main</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
