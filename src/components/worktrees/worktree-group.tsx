import { useTranslation } from 'react-i18next'
import { WorktreeCardActive } from './worktree-card-active'
import { WorktreeCardReady } from './worktree-card-ready'
import { WorktreeCardMerged } from './worktree-card-merged'
import type { Worktree, WorktreeStatus } from '@/types'

interface WorktreeGroupProps {
  status: WorktreeStatus
  worktrees: Worktree[]
}

export function WorktreeGroup({ status, worktrees }: WorktreeGroupProps) {
  const { t } = useTranslation()
  if (worktrees.length === 0) return null

  const groupLabels: Record<WorktreeStatus, string> = {
    active: t('worktrees.groups.active'),
    ready: t('worktrees.groups.ready'),
    merged: t('worktrees.groups.merged'),
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {groupLabels[status]} ({worktrees.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {worktrees.map((wt) => {
          if (status === 'active') return <WorktreeCardActive key={wt.id} worktree={wt} />
          if (status === 'ready') return <WorktreeCardReady key={wt.id} worktree={wt} />
          return <WorktreeCardMerged key={wt.id} worktree={wt} />
        })}
      </div>
    </div>
  )
}
