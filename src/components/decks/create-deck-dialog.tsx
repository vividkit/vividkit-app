import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useDeckStore } from '@/stores/deck-store'

interface CreateDeckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDeckDialog({ open, onOpenChange }: CreateDeckDialogProps) {
  const addDeck = useDeckStore((s) => s.addDeck)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (!name.trim()) return
    addDeck({
      id: crypto.randomUUID(),
      projectId: '',
      name: name.trim(),
      description: desc.trim() || undefined,
      isActive: false,
      createdAt: new Date().toISOString(),
    })
    setName('')
    setDesc('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Deck Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MVP Sprint"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Description <span className="text-xs">(optional)</span>
            </label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Brief description…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Deck
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
