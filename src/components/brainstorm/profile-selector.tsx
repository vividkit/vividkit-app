import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCcsAccountStore } from '@/stores/ccs-account-store'
import { getCcsAccounts } from '@/lib/tauri'

interface ProfileSelectorProps {
  value: string
  onChange: (profile: string) => void
  disabled?: boolean
}

export function ProfileSelector({ value, onChange, disabled }: ProfileSelectorProps) {
  const { t } = useTranslation()
  const { accounts, setAccounts } = useCcsAccountStore()

  useEffect(() => {
    if (accounts.length > 0) return
    getCcsAccounts()
      .then((accs) => {
        setAccounts(accs)
        if (!value && accs.length > 0) onChange(accs[0].name)
      })
      .catch((e) => console.error('[ProfileSelector] load accounts:', e))
  }, [accounts.length, setAccounts, value, onChange])

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder={t('brainstorm.profileSelector.placeholder')} />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.name}>
            {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
