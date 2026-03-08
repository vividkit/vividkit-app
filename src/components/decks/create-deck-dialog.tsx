import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useDeckStore } from '@/stores/deck-store'
import { useProjectStore } from '@/stores/project-store'

interface CreateDeckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDeckDialog({ open, onOpenChange }: CreateDeckDialogProps) {
  const { t } = useTranslation()
  const createDeck = useDeckStore((s) => s.createDeck)
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [setActive, setSetActive] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (!name.trim() || !activeProjectId) return
    setLoading(true)
    try {
      await createDeck(activeProjectId, name.trim(), desc.trim() || undefined, undefined, setActive)
      setName('')
      setDesc('')
      setSetActive(false)
      onOpenChange(false)
    } catch (err) {
      console.error('[CreateDeckDialog]', err)
    } finally {
      setLoading(false)
    }
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
          <div className="flex items-center gap-2">
            <Checkbox
              id="set-active"
              checked={setActive}
              onCheckedChange={(checked) => setSetActive(checked === true)}
            />
            <Label htmlFor="set-active" className="text-sm font-normal cursor-pointer">
              {t('pages.decks.createDialog.setActive')}
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {t('pages.decks.createDialog.createButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
