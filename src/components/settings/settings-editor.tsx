import { Palette, Save, Type } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore } from '@/stores/settings-store'
import type { AppSettings } from '@/types'

type FontSize = AppSettings['fontSize']
type Theme = AppSettings['theme']

export function SettingsEditor() {
  const { settings, updateSettings } = useSettingsStore()

  function setTheme(theme: Theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    updateSettings({ theme })
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Palette className="size-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">App color scheme</p>
          </div>
          <Select value={settings.theme} onValueChange={(v) => setTheme(v as Theme)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Save className="size-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Auto-save</p>
            <p className="text-xs text-muted-foreground">Automatically save file changes</p>
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
            <p className="text-sm font-medium">Font Size</p>
            <p className="text-xs text-muted-foreground">Editor and terminal font size</p>
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
