import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSettingsStore } from '@/stores/settings-store'

export function SettingsGeneral() {
  const { t } = useTranslation()
  const { settings, updateSettings } = useSettingsStore()

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <Globe className="size-5 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{t('settings.general.language')}</p>
          <p className="text-xs text-muted-foreground">{t('settings.general.languageDescription')}</p>
        </div>
        <Select
          value={settings.language}
          onValueChange={(v) => updateSettings({ language: v as 'en' | 'vi' })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t('settings.general.english')}</SelectItem>
            <SelectItem value="vi">{t('settings.general.vietnamese')}</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
