import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { StepGitSetup } from '@/components/onboarding/step-git-setup'
import { useProjectStore } from '@/stores/project-store'
import { useState } from 'react'
import type { OnboardingState } from '@/components/onboarding/onboarding-wizard'
import { baseNameFromPath } from '@/lib/session-path-utils'

export default function NewProjectPage() {
  const navigate = useNavigate()
  const addProject = useProjectStore((s) => s.addProject)
  const [state, setState] = useState<OnboardingState>({
    gitMethod: 'local', gitPath: '', cloneUrl: '', projectName: '', projectSummary: '',
  })

  function patch(u: Partial<OnboardingState>) { setState((s) => ({ ...s, ...u })) }

  function handleCreate() {
    addProject({
      id: crypto.randomUUID(),
      name: baseNameFromPath(state.gitPath) ?? 'New Project',
      gitPath: state.gitMethod === 'local' ? state.gitPath : state.cloneUrl,
      ccsConnected: false,
      ccsAccounts: [],
      createdAt: new Date().toISOString(),
    })
    navigate('/')
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="New Project" />
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="size-4 mr-1" /> Back
        </Button>
        <div className="max-w-lg">
          <StepGitSetup state={state} patch={patch} onNext={handleCreate} onBack={() => navigate(-1)} />
        </div>
      </div>
    </div>
  )
}
