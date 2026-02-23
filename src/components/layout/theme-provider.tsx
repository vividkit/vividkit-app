import { createContext, useContext, useEffect, useMemo } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import type { AppSettings } from '@/types'

type ThemeMode = AppSettings['theme']

interface ThemeContextValue {
  theme: ThemeMode
  updateTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const THEME_STORAGE_KEY = 'vividkit-theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSettingsStore((s) => s.settings.theme)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeMode(savedTheme)) {
      updateSettings({ theme: savedTheme })
    }
  }, [updateSettings])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      updateTheme: (nextTheme: ThemeMode) => updateSettings({ theme: nextTheme }),
      toggleTheme: () => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' }),
    }),
    [theme, updateSettings],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
