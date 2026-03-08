import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout'
import { PhaseIndicator } from '@/components/generate-plan'
import { ProfileSelector } from '@/components/brainstorm'
import { StreamView } from '@/components/ccs-stream'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGeneratePlan } from '@/hooks/use-generate-plan'

export default function GeneratePlanPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [profile, setProfile] = useState('')
  const [context, setContext] = useState('')
  const gen = useGeneratePlan()

  function handleStart() {
    void gen.startGeneration(profile || 'default', context || undefined)
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={t('pages.generatePlan.title')} subtitle={t('pages.generatePlan.subtitle')} />
      <div className="flex flex-col flex-1 p-6 gap-4 min-h-0">
        {/* Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <ProfileSelector value={profile} onChange={setProfile} disabled={gen.isRunning} />
          <Input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t('generatePlan.contextPlaceholder')}
            disabled={gen.isRunning}
            className="flex-1 font-mono text-sm"
          />
          <Button onClick={handleStart} disabled={gen.isRunning || !gen.listenerReady}>
            {t('pages.generatePlan.generate')}
          </Button>
          {gen.isRunning && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void gen.stopGeneration()}
              disabled={gen.isStopping}
            >
              {gen.isStopping ? t('common.actions.stopping') : t('common.actions.stop')}
            </Button>
          )}
        </div>

        {/* Pipeline progress */}
        <div className="shrink-0">
          <PhaseIndicator currentPhase={gen.done ? 4 : gen.isRunning ? 0 : gen.currentStep} />
        </div>

        {/* StreamView */}
        <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden">
          <StreamView
            key={gen.streamKey}
            sessionLogPath={gen.sessionLogPath ?? undefined}
            isRunning={gen.isRunning}
            exitCode={gen.exitCode}
            activeRunId={gen.activeRunId}
            ccsCwd={gen.ccsCwd}
          />
        </div>

        {/* Completion actions */}
        {gen.done && gen.planId && (
          <div className="flex gap-3 shrink-0">
            <Button onClick={() => navigate(`/plans/${gen.planId}?new=true`)}>
              {t('pages.generatePlan.viewPlan')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/tasks')}>
              {t('pages.generatePlan.goToTasks')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
