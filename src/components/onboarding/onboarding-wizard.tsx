import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProjectStore } from '@/stores/project-store'
import { ProgressIndicator } from './progress-indicator'
import { StepWelcome } from './step-welcome'
import { StepGitSetup } from './step-git-setup'
import { StepAiTools } from './step-ai-tools'
import { StepProjectSetup } from './step-project-setup'

export type GitMethod = 'local' | 'clone'

export interface OnboardingState {
  gitMethod: GitMethod
  gitPath: string
  cloneUrl: string
  projectName: string
  projectSummary: string
}

export function OnboardingWizard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const addProject = useProjectStore((s) => s.addProject)
  const [step, setStep] = useState(0)
  const [state, setState] = useState<OnboardingState>({
    gitMethod: 'local',
    gitPath: '',
    cloneUrl: '',
    projectName: '',
    projectSummary: '',
  })

  function patch(updates: Partial<OnboardingState>) {
    setState((s) => ({ ...s, ...updates }))
  }

  const steps = [
    t('onboarding.steps.welcome'),
    t('onboarding.steps.gitSetup'),
    t('onboarding.steps.aiTools'),
    t('onboarding.steps.projectSetup'),
  ]

  function next() { setStep((s) => Math.min(s + 1, steps.length - 1)) }
  function back() { setStep((s) => Math.max(s - 1, 0)) }

  function finish() {
    addProject({
      id: crypto.randomUUID(),
      name: state.projectName || t('onboarding.defaults.myProject'),
      description: state.projectSummary,
      gitPath: state.gitMethod === 'local' ? state.gitPath : state.cloneUrl,
      ccsConnected: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    navigate('/')
  }

  const stepProps = { state, patch, onNext: next, onBack: back, onFinish: finish }

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
