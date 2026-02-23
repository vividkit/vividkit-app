import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Sparkles, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReportPreviewDialog } from './report-preview-dialog'
import { useBrainstormStore } from '@/stores/brainstorm-store'
import { useDeckStore } from '@/stores/deck-store'
import { useProjectStore } from '@/stores/project-store'

interface BrainstormActionsProps {
  prompt: string
}

export function BrainstormActions({ prompt }: BrainstormActionsProps) {
  const navigate = useNavigate()
  const [showReport, setShowReport] = useState(false)
  const [saved, setSaved] = useState(false)
  const addInsight = useBrainstormStore((s) => s.addInsight)
  const { activeDeckId } = useDeckStore()
  const { activeProjectId } = useProjectStore()

  function saveInsight() {
    if (saved) return
    addInsight({
      id: crypto.randomUUID(),
      projectId: activeProjectId ?? '',
      deckId: activeDeckId ?? '',
      title: prompt.slice(0, 60),
      reportPath: '',
      createdAt: new Date().toISOString(),
    })
    setSaved(true)
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setShowReport(true)}>
          <FileText className="size-3.5 mr-1.5" /> View Report
        </Button>
        <Button size="sm" onClick={() => navigate('/generate-plan')}>
          <Sparkles className="size-3.5 mr-1.5" /> Create Implementation Plan
        </Button>
        <Button variant="ghost" size="sm" onClick={saveInsight} disabled={saved}>
          <Lightbulb className="size-3.5 mr-1.5" />
          {saved ? 'Saved!' : 'Save as Key Insight'}
        </Button>
      </div>
      <ReportPreviewDialog open={showReport} onOpenChange={setShowReport} prompt={prompt} />
    </>
  )
}
