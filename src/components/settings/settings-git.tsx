import { useState } from 'react'
import { GitBranch, FolderOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSettingsStore } from '@/stores/settings-store'

export function SettingsGit() {
  const { t } = useTranslation()
  const { settings, updateSettings } = useSettingsStore()
  const [branch, setBranch] = useState(settings.defaultBranch)
  const [worktreesDir, setWorktreesDir] = useState(settings.worktreesDir)

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <GitBranch className="size-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{t('settings.git.defaultBranch')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.git.defaultBranchDescription')}</p>
          </div>
          <Input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            onBlur={() => updateSettings({ defaultBranch: branch })}
            placeholder={t('settings.git.defaultBranchPlaceholder')}
            className="w-36 text-sm font-mono"
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <FolderOpen className="size-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{t('settings.git.worktreesDirectory')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.git.worktreesDirectoryDescription')}</p>
          </div>
          <Input
            value={worktreesDir}
            onChange={(e) => setWorktreesDir(e.target.value)}
            onBlur={() => updateSettings({ worktreesDir })}
            placeholder={t('settings.git.worktreesDirectoryPlaceholder')}
            className="w-36 text-sm font-mono"
          />
        </CardContent>
      </Card>
    </div>
  )
}
