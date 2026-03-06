import { useEffect } from 'react'
import { ThemeProvider } from '@/components/layout'
import { applyLanguage } from '@/i18n/app-language'
import { useSettingsStore } from '@/stores/settings-store'
import { AppRouter } from './router'
import './App.css'

export default function App() {
  const language = useSettingsStore((s) => s.settings.language)

  useEffect(() => {
    void applyLanguage(language)
  }, [language])

  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  )
}
