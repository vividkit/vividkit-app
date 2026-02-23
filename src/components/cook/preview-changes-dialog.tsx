import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTaskStore } from '@/stores/task-store'
import type { Task } from '@/types'

const MOCK_FILES = [
  { name: 'src/components/feature.tsx', additions: 45, deletions: 2 },
  { name: 'src/stores/feature-store.ts', additions: 12, deletions: 0 },
  { name: 'src/types/index.ts', additions: 5, deletions: 1 },
]

interface PreviewChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onClose: () => void
}

export function PreviewChangesDialog({ open, onOpenChange, task, onClose }: PreviewChangesDialogProps) {
  const navigate = useNavigate()
  const updateStatus = useTaskStore((s) => s.updateStatus)

  function handleMerge() {
    if (task) updateStatus(task.id, 'done')
    onOpenChange(false)
    navigate('/tasks')
  }

  function handleDiscard() {
    if (task) updateStatus(task.id, 'todo')
    onOpenChange(false)
    navigate('/tasks')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Preview Changes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Worktree</p>
            <p className="text-sm font-mono">{task ? `task-${task.id.slice(0, 8)}` : 'unknown'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Files Changed</p>
            <div className="space-y-1">
              {MOCK_FILES.map((f) => (
                <div key={f.name} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs truncate">{f.name}</span>
                  <span className="text-xs shrink-0 ml-2">
                    <span className="text-green-600">+{f.additions}</span>
                    {f.deletions > 0 && <span className="text-red-500 ml-1">-{f.deletions}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md bg-muted p-3 font-mono text-xs space-y-1">
            <p className="text-green-600">+ import &#123; Feature &#125; from './feature'</p>
            <p className="text-green-600">+ export function Feature() &#123;</p>
            <p className="text-green-600">+   return &lt;div&gt;Feature&lt;/div&gt;</p>
            <p className="text-green-600">+ &#125;</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Back to Cook</Button>
          <Button variant="destructive" onClick={handleDiscard}>Discard</Button>
          <Button onClick={handleMerge}>Merge to Main</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
