import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { readPlanFile } from '@/lib/tauri'

interface ReportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionLogPath?: string | null
}

export function ReportPreviewDialog({ open, onOpenChange, sessionLogPath }: ReportPreviewDialogProps) {
  const { t } = useTranslation()
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !sessionLogPath) return
    setLoading(true)
    readPlanFile(sessionLogPath)
      .then((text) => setContent(text))
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [open, sessionLogPath])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t('brainstorm.reportDialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('common.labels.loading')}
            </p>
          )}
          {!loading && !content && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('brainstorm.reportDialog.noContent')}
            </p>
          )}
          {!loading && content && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
