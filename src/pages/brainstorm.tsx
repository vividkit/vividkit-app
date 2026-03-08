import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout'
import { BrainstormActions } from '@/components/brainstorm'
import { BrainstormStartView } from '@/components/brainstorm/brainstorm-start-view'
import { KeyInsightsDialog } from '@/components/brainstorm/key-insights-dialog'
import { BrainstormReportPanel } from '@/components/brainstorm/brainstorm-report-panel'
import { StreamView } from '@/components/ccs-stream'
import { useBrainstorm } from '@/hooks/use-brainstorm'
import { useKeyInsights } from '@/hooks/use-key-insights'
import { useDeckStore } from '@/stores/deck-store'
import { useProjectStore } from '@/stores/project-store'

export default function BrainstormPage() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState('')
  const [prompt, setPrompt] = useState('')
  const [showInsights, setShowInsights] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showStopOptions, setShowStopOptions] = useState(false)
  const brainstorm = useBrainstorm()
  const { addInsight } = useKeyInsights()
  const { decks, activeDeckId } = useDeckStore()
  const activeDeck = decks.find((d) => d.id === activeDeckId)
  const activeProject = useProjectStore((s) => {
    const pid = s.activeProjectId
    return pid ? s.projects.find((p) => p.id === pid) : undefined
  })

  const hasStarted = brainstorm.status !== 'idle'
  const isCompleted = brainstorm.status === 'completed'

  function handleSubmit(text: string) {
    setPrompt(text)
    void brainstorm.startSession(profile || 'default', text)
  }

  async function handleStop() {
    await brainstorm.stopSession()
    setShowStopOptions(true)
  }

  async function handleSaveInsight() {
    await addInsight(prompt.slice(0, 60), brainstorm.sessionLogPath ?? '')
    setShowStopOptions(false)
  }

  function handleClearSession() {
    setShowStopOptions(false)
  }

  const headerSubtitle = [activeProject?.name, activeDeck?.name].filter(Boolean).join(' / ')

  return (
    <div className="flex flex-col h-full">
      <AppHeader
        title={t('pages.brainstorm.title')}
        subtitle={headerSubtitle || undefined}
      />

      <div className="flex flex-col flex-1 min-h-0">
        {!hasStarted ? (
          <BrainstormStartView
            onSubmit={handleSubmit}
            disabled={!brainstorm.listenerReady}
            prompt={prompt}
            onPromptChange={setPrompt}
            profile={profile}
            onProfileChange={setProfile}
            onShowInsights={() => setShowInsights(true)}
          />
        ) : showReport ? (
          <BrainstormReportPanel
            sessionLogPath={brainstorm.reportPath}
            onClose={() => setShowReport(false)}
          />
        ) : (
          <div className="flex flex-col flex-1 p-4 gap-3 min-h-0">
            <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden">
              <StreamView
                key={brainstorm.streamKey}
                sessionLogPath={brainstorm.sessionLogPath ?? undefined}
                isRunning={brainstorm.isRunning}
                exitCode={brainstorm.exitCode}
                activeRunId={brainstorm.activeRunId}
                ccsCwd={brainstorm.ccsCwd}
                profileName={profile || 'default'}
                hideSystemLines
                hideStatusBar
                hideJsonlPaths
                disableInput={isCompleted || showStopOptions}
                initialPrompt={prompt}
                onStop={() => void handleStop()}
                isStopping={brainstorm.isStopping}
              />
            </div>
            {/* Post-stop options: save insight or clear */}
            {showStopOptions && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <span className="text-sm text-muted-foreground flex-1">
                  {t('brainstorm.stopOptions.prompt')}
                </span>
                <button
                  onClick={() => void handleSaveInsight()}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t('brainstorm.stopOptions.saveInsight')}
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                  onClick={handleClearSession}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t('brainstorm.stopOptions.clear')}
                </button>
              </div>
            )}
            {isCompleted && !showStopOptions && (
              <BrainstormActions
                prompt={prompt}
                sessionLogPath={brainstorm.sessionLogPath}
                reportPath={brainstorm.reportPath}
                onViewReport={() => setShowReport(true)}
              />
            )}
          </div>
        )}
      </div>

      <KeyInsightsDialog open={showInsights} onOpenChange={setShowInsights} />
    </div>
  )
}
