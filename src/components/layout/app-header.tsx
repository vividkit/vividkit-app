import { Bell, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useSettingsStore } from '@/stores/settings-store'

interface AppHeaderProps {
  title: string
  subtitle?: string
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { settings, updateSettings } = useSettingsStore()
  const isDark = settings.theme === 'dark'

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    updateSettings({ theme: next })
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
          <span className="size-2 rounded-full bg-success animate-pulse" />
          AI Connected
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="size-4" />
        </Button>
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
