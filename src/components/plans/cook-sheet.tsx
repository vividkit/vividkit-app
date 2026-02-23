import { useEffect, useRef } from 'react'
import { FlameKindling } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { getTerminalTheme } from '@/lib/utils'
import type { Plan } from '@/types'
const COOK_LINES = [
  '\x1b[33m$ Executing plan phases...\x1b[0m\r\n',
  '> Phase 1: Analyzing requirements...\r\n',
  '> Phase 2: Setting up structure...\r\n',
  '> Phase 3: Implementing features...\r\n',
  '> Phase 4: Running tests...\r\n',
  '\x1b[32m✓ All phases completed successfully!\x1b[0m\r\n',
]

interface CookSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Plan
}

export function CookSheet({ open, onOpenChange, plan }: CookSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)

  useEffect(() => {
    if (!open || !containerRef.current) return
    const term = new Terminal({ theme: getTerminalTheme(), fontSize: 12 })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term

    let i = 0
    const interval = setInterval(() => {
      if (i < COOK_LINES.length) { term.write(COOK_LINES[i++]) } else { clearInterval(interval) }
    }, 600)

    return () => {
      clearInterval(interval)
      term.dispose()
      termRef.current = null
    }
  }, [open])

  const completed = plan.phases.filter((p) => p.status === 'done').length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <FlameKindling className="size-5 text-primary" />
            <SheetTitle className="text-base">{plan.name}</SheetTitle>
          </div>
          <Badge variant="outline" className="w-fit text-xs">
            {completed}/{plan.phases.length} phases
          </Badge>
        </SheetHeader>
        <div className="flex-1 p-4 min-h-0">
          <div ref={containerRef} className="h-full rounded-lg border border-border bg-terminal-background" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
