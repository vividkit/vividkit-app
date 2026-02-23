import { useState } from 'react'
import { GitBranch, Eye, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWorktreeStore } from '@/stores/worktree-store'
import { MergeDialog } from './merge-dialog'
import type { Worktree } from '@/types'

interface WorktreeCardReadyProps {
  worktree: Worktree
}

export function WorktreeCardReady({ worktree }: WorktreeCardReadyProps) {
  const [showMerge, setShowMerge] = useState(false)
  const worktrees = useWorktreeStore((s) => s.worktrees)
  const addWorktree = useWorktreeStore((s) => s.addWorktree)

  function handleDelete() {
    // Remove by replacing store without this worktree
    const remaining = worktrees.filter((w) => w.id !== worktree.id)
    // Re-init store via replacing (simplest approach without removeWorktree action)
    remaining.forEach((w) => addWorktree(w))
  }

  return (
    <>
      <Card className="border-warning/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
              <GitBranch className="size-4 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono font-medium truncate">{worktree.branch}</p>
              <p className="text-xs text-muted-foreground">{worktree.filesChanged} files changed</p>
            </div>
            <Badge variant="outline" className="text-warning border-warning/40 text-xs shrink-0">
              Ready to Merge
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs h-7">
              <Eye className="size-3 mr-1" /> View Files
            </Button>
            <Button size="sm" className="text-xs h-7" onClick={() => setShowMerge(true)}>
              Merge
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={handleDelete}>
              <Trash2 className="size-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <MergeDialog open={showMerge} onOpenChange={setShowMerge} worktree={worktree} />
    </>
  )
}
