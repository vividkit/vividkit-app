import { Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CcsAccount, AccountStatus } from '@/types'

const STATUS_CLASS: Record<AccountStatus, string> = {
  active: 'bg-success/10 text-success',
  paused: 'bg-warning/10 text-warning',
  exhausted: 'bg-destructive/10 text-destructive',
}

interface CcsAccountCardProps {
  account: CcsAccount
}

export function CcsAccountCard({ account }: CcsAccountCardProps) {
  const { t } = useTranslation()
  const providerLabel = account.provider.charAt(0).toUpperCase() + account.provider.slice(1)

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
      <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
        <Bot className="size-4 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{providerLabel}</p>
        <p className="text-xs text-muted-foreground truncate">{account.email}</p>
      </div>
      <Badge variant="secondary" className={cn('text-xs', STATUS_CLASS[account.status])}>
        {t(`settings.ccsAccount.${account.status}`)}
      </Badge>
    </div>
  )
}
