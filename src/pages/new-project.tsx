import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { StepGitSetup } from '@/components/onboarding/step-git-setup'
import { useProjectStore } from '@/stores/project-store'
import { useDeckStore } from '@/stores/deck-store'
import { createProject, listDecks } from '@/lib/tauri'
import { baseNameFromPath } from '@/lib/session-path-utils'
import type { OnboardingFormData } from '@/hooks/use-onboarding'

export default function NewProjectPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const projects = useProjectStore((s) => s.projects)
  const addProject = useProjectStore((s) => s.addProject)
  const setActiveProject = useProjectStore((s) => s.setActiveProject)
  const addDeck = useDeckStore((s) => s.addDeck)
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck)

  const [state, setState] = useState<OnboardingFormData>({
    gitMethod: 'local', gitPath: '', cloneUrl: '', projectName: '', projectSummary: '',
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function patch(u: Partial<OnboardingFormData>) {
    setState((s) => ({ ...s, ...u }))
    setError(null)
  }

  async function handleCreate() {
    const gitPath = state.gitMethod === 'local' ? state.gitPath.trim() : state.cloneUrl.trim()
    if (!gitPath) return

    // Check duplicate path
    const duplicate = projects.some((p) => p.gitPath === gitPath)
    if (duplicate) {
      setError(t('pages.newProject.duplicatePath'))
      return
    }

    const name = baseNameFromPath(gitPath) ?? t('navigation.sidebar.newProject')

    setCreating(true)
    setError(null)
    try {
      const project = await createProject(name, undefined, gitPath)
      addProject(project)
      setActiveProject(project.id)

      // Load auto-created default deck
      const decks = await listDecks(project.id)
      if (decks.length > 0) {
        addDeck(decks[0])
        setActiveDeck(decks[0].id)
      }

      navigate('/')
    } catch (e) {
      setError(String(e))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={t('pages.newProject.title')} />
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="size-4 mr-1" /> {t('common.actions.back')}
        </Button>
        <div className="max-w-lg space-y-3">
          <StepGitSetup state={state} patch={patch} onNext={() => void handleCreate()} onBack={() => navigate(-1)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {creating && <p className="text-sm text-muted-foreground">{t('common.messages.creating')}</p>}
        </div>
      </div>
    </div>
  )
}
