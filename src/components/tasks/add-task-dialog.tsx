import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTaskStore } from '@/stores/task-store'
import { useDeckStore } from '@/stores/deck-store'
import type { TaskPriority } from '@/types'

interface AddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const { t } = useTranslation()
  const addTask = useTaskStore((s) => s.addTask)
  const { activeDeckId } = useDeckStore()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (!name.trim()) return
    addTask({
      id: crypto.randomUUID(),
      deckId: activeDeckId ?? '',
      type: 'custom',
      name: name.trim(),
      description: desc.trim() || undefined,
      status: 'todo',
      priority,
    })
    setName('')
    setDesc('')
    setPriority('medium')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('tasks.addDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('tasks.addDialog.name')} <span className="text-destructive">*</span></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('tasks.addDialog.namePlaceholder')} autoFocus />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t('tasks.addDialog.description')}</label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('tasks.addDialog.descriptionPlaceholder')} rows={2} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('tasks.addDialog.priority')}</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPriority(p)}
                >
                  {t(`tasks.priorities.${p}`)}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.actions.cancel')}</Button>
            <Button type="submit" disabled={!name.trim()}>{t('tasks.toolbar.addTask')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
