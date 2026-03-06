import { AppHeader } from '@/components/layout'
import { useTranslation } from 'react-i18next'
import { WorktreeGroup } from '@/components/worktrees'
import { useWorktreeStore } from '@/stores/worktree-store'

export default function WorktreesPage() {
  const { t } = useTranslation()
  const worktrees = useWorktreeStore((s) => s.worktrees)

  const active = worktrees.filter((w) => w.status === 'active')
  const ready = worktrees.filter((w) => w.status === 'ready')
  const merged = worktrees.filter((w) => w.status === 'merged')

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={t('pages.worktrees.title')} subtitle={t('pages.worktrees.subtitleTotal', { count: worktrees.length })} />
      <div className="p-6 space-y-8">
        {worktrees.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {t('pages.worktrees.empty')}
          </div>
        ) : (
          <>
            <WorktreeGroup status="active" worktrees={active} />
            <WorktreeGroup status="ready" worktrees={ready} />
            <WorktreeGroup status="merged" worktrees={merged} />
          </>
        )}
      </div>
    </div>
  )
}
