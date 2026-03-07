import { useState } from 'react'
import { FolderOpen, GitBranch } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { open } from '@tauri-apps/plugin-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateGitRepo } from '@/lib/tauri'
import { cn } from '@/lib/utils'
import type { OnboardingFormData, GitMethod } from '@/hooks/use-onboarding'

interface StepGitSetupProps {
  state: OnboardingFormData
  patch: (u: Partial<OnboardingFormData>) => void
  onNext: () => void
  onBack: () => void
}

export function StepGitSetup({ state, patch, onNext, onBack }: StepGitSetupProps) {
  const { t } = useTranslation()
  const [browsing, setBrowsing] = useState(false)
  const [gitValid, setGitValid] = useState<boolean | null>(null)
  const [initializing, setInitializing] = useState(false)

  async function browse() {
    setBrowsing(true)
    try {
      const selected = await open({ directory: true, multiple: false })
      if (selected) {
        patch({ gitPath: selected })
        const valid = await validateGitRepo(selected)
        setGitValid(valid)
      }
    } catch {
      // dialog cancelled or failed
    } finally {
      setBrowsing(false)
    }
  }

  async function onPathBlur() {
    if (state.gitPath.trim()) {
      const valid = await validateGitRepo(state.gitPath.trim())
      setGitValid(valid)
    } else {
      setGitValid(null)
    }
  }

  async function handleInitGit() {
    if (!state.gitPath.trim() || initializing) return
    setInitializing(true)
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('init_git_repo', { path: state.gitPath.trim() })
      setGitValid(true)
    } catch {
      // init failed
    } finally {
      setInitializing(false)
    }
  }

  const cards: { value: GitMethod; label: string; desc: string }[] = [
    {
      value: 'local',
      label: t('onboarding.gitSetup.localRepository'),
      desc: t('onboarding.gitSetup.localRepositoryDesc'),
    },
    {
      value: 'clone',
      label: t('onboarding.gitSetup.cloneRepository'),
      desc: t('onboarding.gitSetup.cloneRepositoryDesc'),
    },
  ]

  return (
    <div className="max-w-lg w-full space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('onboarding.gitSetup.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('onboarding.gitSetup.description')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ value, label, desc }) => (
          <button
            key={value}
            onClick={() => patch({ gitMethod: value })}
            className={cn(
              'p-4 rounded-lg border-2 text-left transition-all',
              state.gitMethod === value
                ? 'border-primary shadow-md bg-accent'
                : 'border-border hover:border-primary/40',
            )}
          >
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </button>
        ))}
      </div>

      {state.gitMethod === 'local' ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('onboarding.gitSetup.projectPath')}</label>
          <div className="flex gap-2">
            <Input
              value={state.gitPath}
              onChange={(e) => patch({ gitPath: e.target.value })}
              onBlur={onPathBlur}
              placeholder={t('onboarding.gitSetup.projectPathPlaceholder')}
              className="flex-1 font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={browse} disabled={browsing}>
              <FolderOpen className="size-4" />
            </Button>
          </div>
          {gitValid === false && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-destructive">{t('onboarding.gitSetup.notAGitRepo')}</p>
              <button
                type="button"
                onClick={handleInitGit}
                disabled={initializing}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                <GitBranch className="size-3" />
                {initializing ? t('onboarding.gitSetup.initializing') : t('onboarding.gitSetup.initGit')}
              </button>
            </div>
          )}
          {gitValid === true && (
            <p className="text-xs text-success">{t('onboarding.gitSetup.validGitRepo')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('onboarding.gitSetup.repositoryUrl')}</label>
            <Input
              value={state.cloneUrl}
              onChange={(e) => patch({ cloneUrl: e.target.value })}
              placeholder={t('onboarding.gitSetup.repositoryUrlPlaceholder')}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('onboarding.gitSetup.destinationPath')}</label>
            <div className="flex gap-2">
              <Input
                value={state.gitPath}
                onChange={(e) => patch({ gitPath: e.target.value })}
                placeholder={t('onboarding.gitSetup.destinationPathPlaceholder')}
                className="flex-1 font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={browse} disabled={browsing}>
                <FolderOpen className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">{t('common.actions.back')}</Button>
        <Button onClick={onNext} className="flex-1">{t('common.actions.continue')}</Button>
      </div>
    </div>
  )
}
