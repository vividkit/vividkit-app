import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronsUpDown, Plus } from 'lucide-react'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandItem, CommandSeparator,
} from '@/components/ui/command'
import { useProjectStore } from '@/stores/project-store'
import { useDeckStore } from '@/stores/deck-store'
import { cn } from '@/lib/utils'

export function ProjectSwitcher() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { projects, activeProjectId, setActiveProject } = useProjectStore()
  const { decks, activeDeckId, loadDecks, resetDecks } = useDeckStore()
  const [open, setOpen] = useState(false)

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const activeDeck = decks.find((d) => d.id === activeDeckId)
  const projectInitial = activeProject?.name?.charAt(0)?.toUpperCase() ?? 'V'

  async function handleSelectProject(id: string) {
    if (id === activeProjectId) { setOpen(false); return }
    setActiveProject(id)
    resetDecks()
    await loadDecks(id)
    setOpen(false)
  }

  function handleNewProject() {
    setOpen(false)
    navigate('/new-project')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex flex-1 min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-secondary transition-colors text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
            {projectInitial}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {activeProject?.name ?? t('navigation.sidebar.noProject')}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {activeDeck?.name ?? t('navigation.sidebar.selectProject')}
            </p>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start" side="bottom">
        <Command>
          <CommandEmpty>{t('navigation.sidebar.noProject')}</CommandEmpty>
          <CommandGroup heading={t('navigation.sidebar.projects')}>
            {projects.map((p) => (
              <CommandItem
                key={p.id}
                value={p.id}
                onSelect={() => handleSelectProject(p.id)}
                className={cn('gap-2', p.id === activeProjectId && 'font-semibold')}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{p.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem onSelect={handleNewProject} className="gap-2 text-muted-foreground">
              <Plus className="h-4 w-4" />
              {t('navigation.sidebar.newProject')}
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
