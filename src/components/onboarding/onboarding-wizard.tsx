import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const STEPS = ['Welcome', 'Git Setup', 'AI Tools', 'Project Setup']

export function OnboardingWizard() {
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

  function next() { setStep((s) => Math.min(s + 1, STEPS.length - 1)) }
  function back() { setStep((s) => Math.max(s - 1, 0)) }

  function finish() {
    addProject({
      id: crypto.randomUUID(),
      name: state.projectName || 'My Project',
      description: state.projectSummary,
      gitPath: state.gitMethod === 'local' ? state.gitPath : state.cloneUrl,
      ccsConnected: false,
      ccsAccounts: [],
      createdAt: new Date().toISOString(),
    })
    navigate('/')
  }

  const stepProps = { state, patch, onNext: next, onBack: back, onFinish: finish }

  return (
    <div className="flex min-h-screen bg-background">
      <ProgressIndicator currentStep={step} steps={STEPS} />
      <div className="flex-1 flex items-center justify-center p-8">
        {step === 0 && <StepWelcome onNext={next} />}
        {step === 1 && <StepGitSetup {...stepProps} />}
        {step === 2 && <StepAiTools {...stepProps} />}
        {step === 3 && <StepProjectSetup {...stepProps} />}
      </div>
    </div>
  )
}
