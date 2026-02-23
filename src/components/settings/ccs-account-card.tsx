import { Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Project } from '@/types'

type CcsAccount = Project['ccsAccounts'][number]
type AccountStatus = CcsAccount['status']

const STATUS_MAP: Record<AccountStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'text-success border-success/40' },
  paused: { label: 'Paused', className: 'text-warning border-warning/40' },
  exhausted: { label: 'Exhausted', className: 'text-destructive border-destructive/40' },
}

interface CcsAccountCardProps {
  account: CcsAccount
}

export function CcsAccountCard({ account }: CcsAccountCardProps) {
  const status = STATUS_MAP[account.status]
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
      <Badge variant="outline" className={cn('text-xs', status.className)}>
        {status.label}
      </Badge>
    </div>
  )
}
