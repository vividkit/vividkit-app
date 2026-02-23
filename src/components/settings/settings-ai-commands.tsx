import { Bot } from 'lucide-react'
import { CcsAccountCard } from './ccs-account-card'
import { CommandProviderRow } from './command-provider-row'
import { useProjectStore } from '@/stores/project-store'
import type { Project } from '@/types'

type CcsAccount = Project['ccsAccounts'][number]

const COMMANDS = [
  { command: '/plan', description: 'Generate implementation plans' },
  { command: '/brainstorm', description: 'AI-assisted ideation sessions' },
  { command: '/cook', description: 'Execute coding tasks' },
  { command: '/review', description: 'Code review and analysis' },
  { command: '/test', description: 'Test generation and execution' },
]

export function SettingsAiCommands() {
  const { projects, activeProjectId } = useProjectStore()
  const activeProject = projects.find((p: Project) => p.id === activeProjectId)
  const accounts: CcsAccount[] = activeProject?.ccsAccounts ?? []
  const activeAccounts = accounts.filter((a) => a.status === 'active')

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Bot className="size-4" /> AI Providers
        </h3>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded-lg">
            No CCS accounts connected. Run{' '}
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">ccs detect</code> to set up accounts.
          </p>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc, i) => (
              <CcsAccountCard key={`${acc.provider}-${i}`} account={acc} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold mb-3">Command → Provider Mapping</h3>
        {COMMANDS.map(({ command, description }) => (
          <CommandProviderRow
            key={command}
            command={command}
            description={description}
            activeAccounts={activeAccounts}
          />
        ))}
      </div>
    </div>
  )
}
