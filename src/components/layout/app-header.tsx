import { Bell, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTheme } from './theme-provider'

interface AppHeaderProps {
  title: string
  subtitle?: string
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="mr-2 flex items-center gap-1.5 text-xs text-muted-foreground">
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
