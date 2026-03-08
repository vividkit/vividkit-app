import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Sparkles, Lightbulb } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useKeyInsights } from '@/hooks/use-key-insights'

interface BrainstormActionsProps {
  prompt: string
  sessionLogPath?: string | null
  reportPath?: string | null
  onViewReport?: () => void
}

export function BrainstormActions({ prompt, sessionLogPath, reportPath, onViewReport }: BrainstormActionsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const { addInsight } = useKeyInsights()

  async function saveInsight() {
    if (saved) return
    await addInsight(prompt.slice(0, 60), sessionLogPath ?? '')
    setSaved(true)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {reportPath && (
        <Button variant="outline" size="sm" onClick={onViewReport}>
          <FileText className="size-3.5 mr-1.5" /> {t('brainstorm.actions.viewReport')}
        </Button>
      )}
      <Button size="sm" onClick={() => navigate('/generate-plan')}>
        <Sparkles className="size-3.5 mr-1.5" /> {t('brainstorm.actions.createPlan')}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => void saveInsight()} disabled={saved}>
        <Lightbulb className="size-3.5 mr-1.5" />
        {saved ? t('brainstorm.actions.saved') : t('brainstorm.actions.saveAsInsight')}
      </Button>
    </div>
  )
}
