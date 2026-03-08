import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { readPlanFile } from '@/lib/tauri'

interface BrainstormReportPanelProps {
  sessionLogPath?: string | null
  onClose: () => void
}

export function BrainstormReportPanel({ sessionLogPath, onClose }: BrainstormReportPanelProps) {
  const { t } = useTranslation()
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sessionLogPath) return
    setLoading(true)
    readPlanFile(sessionLogPath)
      .then((text) => setContent(text))
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [sessionLogPath])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
          <ArrowLeft className="size-4" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">
          {t('brainstorm.reportDialog.title')}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
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
    </div>
  )
}
