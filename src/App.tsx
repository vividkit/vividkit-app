import { useEffect } from 'react'
import { ThemeProvider } from '@/components/layout'
import { applyLanguage } from '@/i18n/app-language'
import { useSettingsStore } from '@/stores/settings-store'
import { useProjectStore } from '@/stores/project-store'
import { useDeckStore } from '@/stores/deck-store'
import { AppRouter } from './router'
import './App.css'

export default function App() {
  const language = useSettingsStore((s) => s.settings.language)
  const loadFromDb = useSettingsStore((s) => s.loadFromDb)
  const loadProjects = useProjectStore((s) => s.loadProjects)
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const activeDeckId = useDeckStore((s) => s.activeDeckId)
  const loadDecks = useDeckStore((s) => s.loadDecks)

  useEffect(() => {
    void loadFromDb()
    void loadProjects()
  }, [loadFromDb, loadProjects])

  // Load decks when project is available but no deck is active
  useEffect(() => {
    if (!activeProjectId || activeDeckId) return
    void loadDecks(activeProjectId)
  }, [activeProjectId, activeDeckId, loadDecks])

  useEffect(() => {
    void applyLanguage(language)
  }, [language])

  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  )
}
