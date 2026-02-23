import { useState } from 'react'
import { Bot, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { OnboardingState } from './onboarding-wizard'

type DetectStatus = 'idle' | 'detecting' | 'found'

interface StepAiToolsProps {
  state: OnboardingState
  patch: (u: Partial<OnboardingState>) => void
  onNext: () => void
  onBack: () => void
}

const CCS_ACCOUNTS = [
  { provider: 'Claude', status: 'active' as const },
  { provider: 'Gemini', status: 'active' as const },
  { provider: 'Copilot', status: 'paused' as const },
]

export function StepAiTools({ onNext, onBack }: StepAiToolsProps) {
  const [claudeStatus, setClaudeStatus] = useState<DetectStatus>('idle')
  const [ccsStatus, setCcsStatus] = useState<DetectStatus>('idle')

  function detect() {
    setClaudeStatus('detecting')
    setCcsStatus('detecting')
    setTimeout(() => {
      setClaudeStatus('found')
      setCcsStatus('found')
    }, 1200)
  }

  const statusBadge = (s: 'active' | 'paused') =>
    s === 'active' ? (
      <Badge variant="outline" className="text-success border-success/40">Active</Badge>
    ) : (
      <Badge variant="outline" className="text-warning border-warning/40">Paused</Badge>
    )

  return (
    <div className="max-w-lg w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">AI Tools</h2>
        <p className="text-muted-foreground mt-1">Detect your installed AI tools and accounts</p>
      </div>

      <div className="space-y-3">
        {/* Claude Code */}
        <div className="p-4 rounded-lg border border-border bg-card space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <span className="font-medium text-sm">Claude Code</span>
            </div>
            {claudeStatus === 'detecting' && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            {claudeStatus === 'found' && <CheckCircle className="size-4 text-success" />}
          </div>
          {claudeStatus === 'found' && (
            <p className="text-xs text-muted-foreground">v1.0.0 · Authenticated</p>
          )}
        </div>

        {/* CCS */}
        <div className="p-4 rounded-lg border border-border bg-card space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <span className="font-medium text-sm">CCS (Claude Code Switcher)</span>
            </div>
            {ccsStatus === 'detecting' && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            {ccsStatus === 'found' && <CheckCircle className="size-4 text-success" />}
          </div>
          {ccsStatus === 'found' && (
            <div className="flex gap-2 flex-wrap">
              {CCS_ACCOUNTS.map(({ provider, status }) => (
                <div key={provider} className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{provider}</span>
                  {statusBadge(status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {claudeStatus === 'idle' && (
        <Button variant="outline" className="w-full" onClick={detect}>
          Detect AI Tools
        </Button>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={onNext} className="flex-1">Continue</Button>
      </div>
    </div>
  )
}
