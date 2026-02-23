import { Terminal } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSettingsStore } from '@/stores/settings-store'
import type { Project } from '@/types'

type CcsAccount = Project['ccsAccounts'][number]

interface CommandProviderRowProps {
  command: string
  description: string
  activeAccounts: CcsAccount[]
}

export function CommandProviderRow({ command, description, activeAccounts }: CommandProviderRowProps) {
  const { settings, updateSettings } = useSettingsStore()
  const current = settings.commandProviders[command] ?? ''

  function handleChange(v: string) {
    updateSettings({
      commandProviders: { ...settings.commandProviders, [command]: v },
    })
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <Terminal className="size-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-medium">{command}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Select value={current} onValueChange={handleChange} disabled={activeAccounts.length === 0}>
        <SelectTrigger className="w-36 text-xs">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {activeAccounts.map((acc) => (
            <SelectItem key={acc.provider} value={acc.provider}>
              {acc.provider.charAt(0).toUpperCase() + acc.provider.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
