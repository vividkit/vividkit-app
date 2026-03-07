import { useEffect } from 'react'
import { ThemeProvider } from '@/components/layout'
import { applyLanguage } from '@/i18n/app-language'
import { useSettingsStore } from '@/stores/settings-store'
import { useProjectStore } from '@/stores/project-store'
import { AppRouter } from './router'
import './App.css'

export default function App() {
  const language = useSettingsStore((s) => s.settings.language)
  const loadFromDb = useSettingsStore((s) => s.loadFromDb)
  const loadProjects = useProjectStore((s) => s.loadProjects)

  useEffect(() => {
    void loadFromDb()
    void loadProjects()
  }, [loadFromDb, loadProjects])

  useEffect(() => {
    void applyLanguage(language)
  }, [language])

  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  )
}
