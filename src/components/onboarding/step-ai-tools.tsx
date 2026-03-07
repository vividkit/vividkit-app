import { useState } from 'react'
import { Bot, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { discoverCcsProfiles } from '@/lib/tauri'
import type { CcsAccount } from '@/types'
import type { OnboardingFormData } from '@/hooks/use-onboarding'

type DetectStatus = 'idle' | 'detecting' | 'found' | 'not_found'

interface StepAiToolsProps {
  state: OnboardingFormData
  patch: (u: Partial<OnboardingFormData>) => void
  onNext: () => void
  onBack: () => void
}

export function StepAiTools({ onNext, onBack }: StepAiToolsProps) {
  const { t } = useTranslation()
  const [ccsStatus, setCcsStatus] = useState<DetectStatus>('idle')
  const [accounts, setAccounts] = useState<CcsAccount[]>([])

  async function detect() {
    setCcsStatus('detecting')
    try {
      const result = await discoverCcsProfiles()
      setAccounts(result)
      setCcsStatus(result.length > 0 ? 'found' : 'not_found')
    } catch {
      setCcsStatus('not_found')
    }
  }

  const statusBadge = (s: string) =>
    s === 'active' ? (
      <Badge variant="secondary" className="bg-success/10 text-success">{t('onboarding.aiTools.active')}</Badge>
    ) : (
      <Badge variant="secondary" className="bg-warning/10 text-warning">{t('onboarding.aiTools.paused')}</Badge>
    )

  return (
    <div className="max-w-lg w-full space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('onboarding.aiTools.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('onboarding.aiTools.description')}</p>
      </div>

      <div className="space-y-3">
        {/* CCS Profiles */}
        <div className="p-4 rounded-lg border border-border bg-card space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <span className="font-medium text-sm">{t('onboarding.aiTools.ccs')}</span>
            </div>
            {ccsStatus === 'detecting' && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            {ccsStatus === 'found' && <CheckCircle className="size-4 text-success" />}
            {ccsStatus === 'not_found' && <AlertCircle className="size-4 text-warning" />}
          </div>
          {ccsStatus === 'found' && (
            <div className="flex gap-2 flex-wrap">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{acc.name}</span>
                  {statusBadge(acc.status)}
                </div>
              ))}
            </div>
          )}
          {ccsStatus === 'not_found' && (
            <p className="text-xs text-muted-foreground">{t('onboarding.aiTools.notFound')}</p>
          )}
        </div>
      </div>

      {ccsStatus === 'idle' && (
        <Button variant="outline" className="w-full" onClick={detect}>
          {t('onboarding.aiTools.detect')}
        </Button>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">{t('common.actions.back')}</Button>
        <Button onClick={onNext} className="flex-1">{t('common.actions.continue')}</Button>
      </div>
    </div>
  )
}
