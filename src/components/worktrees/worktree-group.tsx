import { WorktreeCardActive } from './worktree-card-active'
import { WorktreeCardReady } from './worktree-card-ready'
import { WorktreeCardMerged } from './worktree-card-merged'
import type { Worktree, WorktreeStatus } from '@/types'

interface WorktreeGroupProps {
  status: WorktreeStatus
  worktrees: Worktree[]
}

const GROUP_LABELS: Record<WorktreeStatus, string> = {
  active: 'Active',
  ready: 'Ready to Merge',
  merged: 'Merged',
}

export function WorktreeGroup({ status, worktrees }: WorktreeGroupProps) {
  if (worktrees.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {GROUP_LABELS[status]} ({worktrees.length})
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
