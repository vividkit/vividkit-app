import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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

export function MergeDialog({ open, onOpenChange, worktree }: MergeDialogProps) {
  const { t } = useTranslation()
  const [strategy, setStrategy] = useState<MergeStrategy>('merge')
  const [runTests, setRunTests] = useState(true)
  const [deleteAfter, setDeleteAfter] = useState(true)
  const updateWorktreeStatus = useWorktreeStore((s) => s.updateStatus)
  const updateTaskStatus = useTaskStore((s) => s.updateStatus)
  const strategies: Array<{ value: MergeStrategy; label: string; desc: string }> = [
    {
      value: 'merge',
      label: t('worktrees.mergeDialog.strategies.merge.label'),
      desc: t('worktrees.mergeDialog.strategies.merge.description'),
    },
    {
      value: 'squash',
      label: t('worktrees.mergeDialog.strategies.squash.label'),
      desc: t('worktrees.mergeDialog.strategies.squash.description'),
    },
    {
      value: 'rebase',
      label: t('worktrees.mergeDialog.strategies.rebase.label'),
      desc: t('worktrees.mergeDialog.strategies.rebase.description'),
    },
  ]

  function handleMerge() {
    updateWorktreeStatus(worktree.id, 'merged')
    if (worktree.taskId) updateTaskStatus(worktree.taskId, 'done')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('worktrees.mergeDialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('worktrees.mergeDialog.strategy')}</p>
            <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as MergeStrategy)} className="space-y-2">
              {strategies.map(({ value, label, desc }) => (
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
            <p className="text-sm font-medium">{t('worktrees.mergeDialog.options')}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">{t('worktrees.mergeDialog.runTests')}</p>
                <p className="text-xs text-muted-foreground">{t('worktrees.mergeDialog.runTestsDescription')}</p>
              </div>
              <Switch checked={runTests} onCheckedChange={setRunTests} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">{t('worktrees.mergeDialog.deleteAfter')}</p>
                <p className="text-xs text-muted-foreground">{t('worktrees.mergeDialog.deleteAfterDescription')}</p>
              </div>
              <Switch checked={deleteAfter} onCheckedChange={setDeleteAfter} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.actions.cancel')}</Button>
          <Button onClick={handleMerge}>{t('worktrees.mergeDialog.mergeToMain')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
