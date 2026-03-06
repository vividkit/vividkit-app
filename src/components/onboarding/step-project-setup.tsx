import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from 'react-i18next'
import type { OnboardingState } from './onboarding-wizard'

interface StepProjectSetupProps {
  state: OnboardingState
  patch: (u: Partial<OnboardingState>) => void
  onNext: () => void
  onBack: () => void
  onFinish: () => void
}

export function StepProjectSetup({ state, patch, onBack, onFinish }: StepProjectSetupProps) {
  const { t } = useTranslation()
  const gitSummary = state.gitMethod === 'local'
    ? state.gitPath || t('common.defaults.noPath')
    : state.cloneUrl || t('common.defaults.noUrl')

  return (
    <div className="max-w-lg w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('onboarding.projectSetup.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('onboarding.projectSetup.description')}</p>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2 text-sm">
        <p className="font-medium">{t('onboarding.projectSetup.summary')}</p>
        <p className="text-muted-foreground">
          {t('common.labels.git')}: <span className="font-mono text-foreground">{gitSummary}</span>
        </p>
        <p className="text-muted-foreground">
          {t('common.labels.method')}: <span className="text-foreground capitalize">{state.gitMethod}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('onboarding.projectSetup.projectName')} <span className="text-destructive">*</span></label>
          <Input
            value={state.projectName}
            onChange={(e) => patch({ projectName: e.target.value })}
            placeholder={t('onboarding.projectSetup.projectNamePlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('onboarding.projectSetup.summaryLabel')} <span className="text-muted-foreground text-xs">({t('common.labels.optional')})</span>
          </label>
          <Textarea
            value={state.projectSummary}
            onChange={(e) => patch({ projectSummary: e.target.value })}
            placeholder={t('onboarding.projectSetup.summaryPlaceholder')}
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">{t('common.actions.back')}</Button>
        <Button
          onClick={onFinish}
          className="flex-1"
          disabled={!state.projectName.trim()}
        >
          {t('onboarding.projectSetup.launch')}
        </Button>
      </div>
    </div>
  )
}
