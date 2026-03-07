import { useTranslation } from 'react-i18next'
import { useOnboarding } from '@/hooks/use-onboarding'
import { ProgressIndicator } from './progress-indicator'
import { StepWelcome } from './step-welcome'
import { StepGitSetup } from './step-git-setup'
import { StepAiTools } from './step-ai-tools'
import { StepProjectSetup } from './step-project-setup'

export type { OnboardingFormData as OnboardingState, GitMethod } from '@/hooks/use-onboarding'

export function OnboardingWizard() {
  const { t } = useTranslation()
  const { step, formData, patch, next, back, finish, creating, error } = useOnboarding()

  const steps = [
    t('onboarding.steps.welcome'),
    t('onboarding.steps.gitSetup'),
    t('onboarding.steps.aiTools'),
    t('onboarding.steps.projectSetup'),
  ]

  const stepProps = { state: formData, patch, onNext: next, onBack: back, onFinish: finish, creating, error }

  return (
    <div className="flex min-h-screen bg-background">
      <ProgressIndicator currentStep={step} steps={steps} />
      <div className="flex-1 flex items-center justify-center p-8">
        {step === 0 && <StepWelcome onNext={next} />}
        {step === 1 && <StepGitSetup {...stepProps} />}
        {step === 2 && <StepAiTools {...stepProps} />}
        {step === 3 && <StepProjectSetup {...stepProps} />}
      </div>
    </div>
  )
}
