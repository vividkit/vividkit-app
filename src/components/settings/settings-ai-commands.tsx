import { Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CcsAccountCard } from './ccs-account-card'
import { CommandProviderRow } from './command-provider-row'
import { useCcsAccountStore } from '@/stores/ccs-account-store'

export function SettingsAiCommands() {
  const { t } = useTranslation()
  const { accounts } = useCcsAccountStore()
  const activeAccounts = accounts.filter((a) => a.status === 'active')
  const commands = [
    { command: '/plan', description: t('settings.aiCommands.commands.plan') },
    { command: '/brainstorm', description: t('settings.aiCommands.commands.brainstorm') },
    { command: '/cook', description: t('settings.aiCommands.commands.cook') },
    { command: '/review', description: t('settings.aiCommands.commands.review') },
    { command: '/test', description: t('settings.aiCommands.commands.test') },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Bot className="size-4" /> {t('settings.aiCommands.providersTitle')}
        </h3>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded-lg">
            {t('settings.aiCommands.emptyAccountsPrefix')}{' '}
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">ccs detect</code>{' '}
            {t('settings.aiCommands.emptyAccountsSuffix')}
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
        <h3 className="text-sm font-semibold mb-3">{t('settings.aiCommands.mappingTitle')}</h3>
        {commands.map(({ command, description }) => (
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
