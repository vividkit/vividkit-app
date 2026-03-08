import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/stores/project-store'
import { useDeckStore } from '@/stores/deck-store'
import { createProject } from '@/lib/tauri'

export type GitMethod = 'local' | 'clone'

export interface OnboardingFormData {
  gitMethod: GitMethod
  gitPath: string
  cloneUrl: string
  projectName: string
  projectSummary: string
}

const TOTAL_STEPS = 4

export function useOnboarding() {
  const navigate = useNavigate()
  const addProject = useProjectStore((s) => s.addProject)
  const setActiveProject = useProjectStore((s) => s.setActiveProject)
  const loadDecks = useDeckStore((s) => s.loadDecks)

  const [step, setStep] = useState(0)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<OnboardingFormData>({
    gitMethod: 'local',
    gitPath: '',
    cloneUrl: '',
    projectName: '',
    projectSummary: '',
  })

  const patch = useCallback((updates: Partial<OnboardingFormData>) => {
    setFormData((s) => ({ ...s, ...updates }))
    setError(null)
  }, [])

  const next = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)), [])
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), [])

  const canFinish = formData.projectName.trim().length > 0

  const finish = useCallback(async () => {
    if (!canFinish || creating) return
    setCreating(true)
    setError(null)

    try {
      const gitPath = formData.gitMethod === 'local' ? formData.gitPath : formData.cloneUrl
      const project = await createProject(
        formData.projectName.trim(),
        formData.projectSummary.trim() || undefined,
        gitPath,
      )

      // Add to stores
      addProject(project)
      setActiveProject(project.id)

      // Load auto-created default deck
      await loadDecks(project.id)

      navigate('/')
    } catch (e) {
      setError(String(e))
    } finally {
      setCreating(false)
    }
  }, [canFinish, creating, formData, addProject, setActiveProject, loadDecks, navigate])

  return { step, formData, patch, next, back, finish, canFinish, creating, error }
}
