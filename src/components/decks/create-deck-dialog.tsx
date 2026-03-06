import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
          <DialogTitle>{t('pages.decks.createDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('pages.decks.createDialog.name')} <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('pages.decks.createDialog.namePlaceholder')}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t('pages.decks.createDialog.description')} <span className="text-xs">({t('common.labels.optional')})</span>
            </label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={t('pages.decks.createDialog.descriptionPlaceholder')}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {t('pages.decks.createDialog.createButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
