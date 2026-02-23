import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { useWorktreeStore } from '@/stores/worktree-store'
import { useTaskStore } from '@/stores/task-store'
import type { Worktree, MergeStrategy } from '@/types'

interface MergeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  worktree: Worktree
}

const STRATEGIES: Array<{ value: MergeStrategy; label: string; desc: string }> = [
  { value: 'merge', label: 'Merge commit', desc: 'Preserves full history (Recommended)' },
  { value: 'squash', label: 'Squash & merge', desc: 'Combines all commits into one' },
  { value: 'rebase', label: 'Rebase', desc: 'Applies commits on top of main' },
]

export function MergeDialog({ open, onOpenChange, worktree }: MergeDialogProps) {
  const [strategy, setStrategy] = useState<MergeStrategy>('merge')
  const [runTests, setRunTests] = useState(true)
  const [deleteAfter, setDeleteAfter] = useState(true)
  const updateWorktreeStatus = useWorktreeStore((s) => s.updateStatus)
  const updateTaskStatus = useTaskStore((s) => s.updateStatus)

  function handleMerge() {
    updateWorktreeStatus(worktree.id, 'merged')
    if (worktree.taskId) updateTaskStatus(worktree.taskId, 'done')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Merge to Main</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium">Merge Strategy</p>
            <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as MergeStrategy)} className="space-y-2">
              {STRATEGIES.map(({ value, label, desc }) => (
                <label key={value} className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value={value} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Options</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Run tests before merging</p>
                <p className="text-xs text-muted-foreground">Ensure all tests pass first</p>
              </div>
              <Switch checked={runTests} onCheckedChange={setRunTests} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Delete worktree after merge</p>
                <p className="text-xs text-muted-foreground">Clean up the worktree branch</p>
              </div>
              <Switch checked={deleteAfter} onCheckedChange={setDeleteAfter} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleMerge}>Merge to Main</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
