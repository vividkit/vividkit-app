import { useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { open } from '@tauri-apps/plugin-dialog'
import { cn } from '@/lib/utils'
import type { OnboardingState, GitMethod } from './onboarding-wizard'

const OPEN_FOLDER_PICKER_FAILED_KEY = 'onboarding.git_setup.open_folder_picker_failed'

interface StepGitSetupProps {
  state: OnboardingState
  patch: (u: Partial<OnboardingState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepGitSetup({ state, patch, onNext, onBack }: StepGitSetupProps) {
  const [browsing, setBrowsing] = useState(false)

  async function browse() {
    setBrowsing(true)
    try {
      const selected = await open({ directory: true, multiple: false })
      if (typeof selected === 'string' && selected.length > 0) {
        patch({ gitPath: selected })
      }
    } catch (error) {
      console.error('Onboarding folder browse failed:', error)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vividkit:toast', {
          detail: { type: 'error', message: OPEN_FOLDER_PICKER_FAILED_KEY },
        }))
      }
    } finally {
      setBrowsing(false)
    }
  }

  const cards: { value: GitMethod; label: string; desc: string }[] = [
    { value: 'local', label: 'Local Repository', desc: 'Use an existing project on your machine' },
    { value: 'clone', label: 'Clone Repository', desc: 'Clone a remote Git repository' },
  ]

  return (
    <div className="max-w-lg w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Git Setup</h2>
        <p className="text-muted-foreground mt-1">Choose how to connect your project</p>
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
          <label className="text-sm font-medium">Project Path</label>
          <div className="flex gap-2">
            <Input
              value={state.gitPath}
              onChange={(e) => patch({ gitPath: e.target.value })}
              placeholder="/Users/you/my-project"
              className="flex-1 font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={browse} disabled={browsing}>
              <FolderOpen className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Repository URL</label>
            <Input
              value={state.cloneUrl}
              onChange={(e) => patch({ cloneUrl: e.target.value })}
              placeholder="https://github.com/user/repo.git"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Destination Path</label>
            <div className="flex gap-2">
              <Input
                value={state.gitPath}
                onChange={(e) => patch({ gitPath: e.target.value })}
                placeholder="/Users/you/projects"
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
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={onNext} className="flex-1">Continue</Button>
      </div>
    </div>
  )
}
