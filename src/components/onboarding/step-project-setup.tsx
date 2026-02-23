import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { OnboardingState } from './onboarding-wizard'

interface StepProjectSetupProps {
  state: OnboardingState
  patch: (u: Partial<OnboardingState>) => void
  onNext: () => void
  onBack: () => void
  onFinish: () => void
}

export function StepProjectSetup({ state, patch, onBack, onFinish }: StepProjectSetupProps) {
  const gitSummary = state.gitMethod === 'local'
    ? state.gitPath || '(no path)'
    : state.cloneUrl || '(no url)'

  return (
    <div className="max-w-lg w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Project Setup</h2>
        <p className="text-muted-foreground mt-1">Name your project and launch VividKit</p>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2 text-sm">
        <p className="font-medium">Summary</p>
        <p className="text-muted-foreground">
          Git: <span className="font-mono text-foreground">{gitSummary}</span>
        </p>
        <p className="text-muted-foreground">
          Method: <span className="text-foreground capitalize">{state.gitMethod}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Project Name <span className="text-destructive">*</span></label>
          <Input
            value={state.projectName}
            onChange={(e) => patch({ projectName: e.target.value })}
            placeholder="My Awesome App"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Summary <span className="text-muted-foreground text-xs">(optional)</span></label>
          <Textarea
            value={state.projectSummary}
            onChange={(e) => patch({ projectSummary: e.target.value })}
            placeholder="Brief description of this project…"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button
          onClick={onFinish}
          className="flex-1"
          disabled={!state.projectName.trim()}
        >
          Launch VividKit
        </Button>
      </div>
    </div>
  )
}
