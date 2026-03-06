import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'

interface ReportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt: string
}

export function ReportPreviewDialog({ open, onOpenChange, prompt }: ReportPreviewDialogProps) {
  const { t } = useTranslation()
  const phases = [
    t('brainstorm.reportDialog.phaseNames.coreArchitecture'),
    t('brainstorm.reportDialog.phaseNames.uiComponents'),
    t('brainstorm.reportDialog.phaseNames.aiIntegration'),
    t('brainstorm.reportDialog.phaseNames.testingStrategy'),
  ]
  const techStack = ['React 18 + TypeScript', 'Tauri v2 (Rust)', 'Zustand', 'xterm.js', 'shadcn/ui + Tailwind v4']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t('brainstorm.reportDialog.title')}</DialogTitle>
          <p className="text-xs text-muted-foreground">{t('brainstorm.reportDialog.readTime')}</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 text-[15px] leading-relaxed">
          <h2 className="text-lg font-bold">{prompt || t('brainstorm.reportDialog.defaultTitle')}</h2>
          <p className="text-muted-foreground">
            {t('brainstorm.reportDialog.analysisIntro')}
          </p>
          <h3 className="font-semibold uppercase tracking-wide text-sm text-muted-foreground">{t('brainstorm.reportDialog.phases')}</h3>
          {phases.map((phase, i) => (
            <div key={phase} className="flex gap-3 items-start">
              <div className="size-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="font-medium">{phase}</p>
                <p className="text-sm text-muted-foreground">
                  {t('brainstorm.reportDialog.phaseDescription', { phase: phase.toLowerCase() })}
                </p>
              </div>
            </div>
          ))}
          <hr className="border-border" />
          <h3 className="font-semibold uppercase tracking-wide text-sm text-muted-foreground">{t('brainstorm.reportDialog.techStack')}</h3>
          <ul className="space-y-1.5">
            {techStack.map((tech) => (
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
