import { useState } from 'react'
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
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Task name…" autoFocus />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional description…" rows={2} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 capitalize"
                  onClick={() => setPriority(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()}>Add Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
