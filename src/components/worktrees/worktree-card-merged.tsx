import { GitBranch } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Worktree } from '@/types'

interface WorktreeCardMergedProps {
  worktree: Worktree
}

export function WorktreeCardMerged({ worktree }: WorktreeCardMergedProps) {
  return (
    <Card className="opacity-70">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <GitBranch className="size-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-medium truncate line-through text-muted-foreground">
            {worktree.branch}
          </p>
          {worktree.mergedAt && (
            <p className="text-xs text-muted-foreground">
              Merged {new Date(worktree.mergedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <Badge variant="secondary" className="bg-success/10 text-success text-xs shrink-0">Merged</Badge>
      </CardContent>
    </Card>
  )
}
