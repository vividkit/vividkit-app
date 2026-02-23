import { GitBranch, Clock, Eye, Pause, Square } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWorktreeStore } from '@/stores/worktree-store'
import type { Worktree } from '@/types'

interface WorktreeCardActiveProps {
  worktree: Worktree
}

export function WorktreeCardActive({ worktree }: WorktreeCardActiveProps) {
  const updateStatus = useWorktreeStore((s) => s.updateStatus)

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <GitBranch className="size-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono font-medium truncate">{worktree.branch}</p>
            <p className="text-xs text-muted-foreground">{worktree.filesChanged} files changed</p>
          </div>
          <Badge variant="secondary" className="bg-success/10 text-success text-xs shrink-0">Active</Badge>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" /> Cooking in progress…
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" className="text-xs h-7">
            <Eye className="size-3 mr-1" /> View Files
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => updateStatus(worktree.id, 'ready')}>
            <Pause className="size-3 mr-1" /> Pause
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => updateStatus(worktree.id, 'ready')}>
            <Square className="size-3 mr-1" /> Stop
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
