import { useEffect, useMemo, useRef } from 'react'
import { FlameKindling } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { getTerminalTheme } from '@/lib/utils'

interface CookSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string
  planName: string
}

export function CookSheet({ open, onOpenChange, planName }: CookSheetProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const cookLines = useMemo(
    () => [
      `\x1b[33m${t('plans.cookSheet.lines.start')}\x1b[0m\r\n`,
      `${t('plans.cookSheet.lines.phase1')}\r\n`,
      `${t('plans.cookSheet.lines.phase2')}\r\n`,
      `${t('plans.cookSheet.lines.phase3')}\r\n`,
      `${t('plans.cookSheet.lines.phase4')}\r\n`,
      `\x1b[32m✓ ${t('plans.cookSheet.lines.done')}\x1b[0m\r\n`,
    ],
    [t],
  )

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
      if (i < cookLines.length) { term.write(cookLines[i++]) } else { clearInterval(interval) }
    }, 600)

    return () => {
      clearInterval(interval)
      term.dispose()
      termRef.current = null
    }
  }, [cookLines, open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <FlameKindling className="size-5 text-primary" />
            <SheetTitle className="text-base">{planName}</SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex-1 p-4 min-h-0">
          <div ref={containerRef} className="h-full rounded-lg border border-border bg-terminal-background" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
