import { ExternalLink, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useKeyInsights } from '@/hooks/use-key-insights'

interface KeyInsightsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyInsightsDialog({ open, onOpenChange }: KeyInsightsDialogProps) {
  const { t, i18n } = useTranslation()
  const { insights, removeInsight } = useKeyInsights()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('brainstorm.insightsDialog.title')}</DialogTitle>
        </DialogHeader>
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('brainstorm.insightsDialog.empty')}
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {insights.map((insight) => (
              <div key={insight.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(i18n.language).format(new Date(insight.createdAt))}
                  </p>
                </div>
                {insight.reportPath && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    title={t('brainstorm.insightsDialog.viewReport')}
                  >
                    <ExternalLink className="size-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive shrink-0"
                  onClick={() => void removeInsight(insight.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
