import { Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSettingsStore } from '@/stores/settings-store'

export function SettingsGeneral() {
  const { settings, updateSettings } = useSettingsStore()

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <Globe className="size-5 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Language</p>
          <p className="text-xs text-muted-foreground">Interface display language</p>
        </div>
        <Select
          value={settings.language}
          onValueChange={(v) => updateSettings({ language: v as 'en' | 'vi' })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="vi">Vietnamese</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
