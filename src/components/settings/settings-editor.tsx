import { Palette, Save, Type } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/components/layout'
import { useSettingsStore } from '@/stores/settings-store'
import type { AppSettings } from '@/types'

type FontSize = AppSettings['fontSize']
type Theme = AppSettings['theme']

export function SettingsEditor() {
  const { t } = useTranslation()
  const { settings, updateSettings } = useSettingsStore()
  const { updateTheme } = useTheme()

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Palette className="size-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{t('settings.editor.theme')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.editor.themeDescription')}</p>
          </div>
          <Select value={settings.theme} onValueChange={(v) => updateTheme(v as Theme)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t('settings.editor.light')}</SelectItem>
              <SelectItem value="dark">{t('settings.editor.dark')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Save className="size-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{t('settings.editor.autoSave')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.editor.autoSaveDescription')}</p>
          </div>
          <Switch
            checked={settings.autoSave}
            onCheckedChange={(v) => updateSettings({ autoSave: v })}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Type className="size-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{t('settings.editor.fontSize')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.editor.fontSizeDescription')}</p>
          </div>
          <Select
            value={String(settings.fontSize)}
            onValueChange={(v) => updateSettings({ fontSize: Number(v) as FontSize })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {([12, 14, 16, 18] as FontSize[]).map((s) => (
                <SelectItem key={s} value={String(s)}>{s}px</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  )
}
