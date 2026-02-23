import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ReportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt: string
}

export function ReportPreviewDialog({ open, onOpenChange, prompt }: ReportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Brainstorm Report</DialogTitle>
          <p className="text-xs text-muted-foreground">5 min read</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 text-[15px] leading-relaxed">
          <h2 className="text-lg font-bold">{prompt || 'Brainstorm Session'}</h2>
          <p className="text-muted-foreground">
            Analysis of your project requirements and architecture suggestions based on the brainstorm session.
          </p>
          <h3 className="font-semibold uppercase tracking-wide text-sm text-muted-foreground">Phases</h3>
          {['Core Architecture', 'UI Components', 'AI Integration', 'Testing Strategy'].map((phase, i) => (
            <div key={phase} className="flex gap-3 items-start">
              <div className="size-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="font-medium">{phase}</p>
                <p className="text-sm text-muted-foreground">
                  Implementation details and considerations for {phase.toLowerCase()}.
                </p>
              </div>
            </div>
          ))}
          <hr className="border-border" />
          <h3 className="font-semibold uppercase tracking-wide text-sm text-muted-foreground">Tech Stack</h3>
          <ul className="space-y-1.5">
            {['React 18 + TypeScript', 'Tauri v2 (Rust)', 'Zustand', 'xterm.js', 'shadcn/ui + Tailwind v4'].map((tech) => (
              <li key={tech} className="flex items-center gap-2 text-sm">
                <span className="size-1.5 rounded-full bg-primary shrink-0" />
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
