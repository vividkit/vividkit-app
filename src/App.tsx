import { useEffect } from 'react'
import { ThemeProvider } from '@/components/layout'
import { applyLanguage } from '@/i18n/app-language'
import { useSettingsStore } from '@/stores/settings-store'
import { useProjectStore } from '@/stores/project-store'
import { useDeckStore } from '@/stores/deck-store'
import { listDecks } from '@/lib/tauri'
import { AppRouter } from './router'
import './App.css'

export default function App() {
  const language = useSettingsStore((s) => s.settings.language)
  const loadFromDb = useSettingsStore((s) => s.loadFromDb)
  const loadProjects = useProjectStore((s) => s.loadProjects)
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const activeDeckId = useDeckStore((s) => s.activeDeckId)
  const addDeck = useDeckStore((s) => s.addDeck)
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck)

  useEffect(() => {
    void loadFromDb()
    void loadProjects()
  }, [loadFromDb, loadProjects])

  // Load decks when project is available but no deck is active
  useEffect(() => {
    if (!activeProjectId || activeDeckId) return
    listDecks(activeProjectId)
      .then((decks) => {
        for (const deck of decks) addDeck(deck)
        const active = decks.find((d) => d.isActive) ?? decks[0]
        if (active) setActiveDeck(active.id)
      })
      .catch((e) => console.error('[App] load decks:', e))
  }, [activeProjectId, activeDeckId, addDeck, setActiveDeck])

  useEffect(() => {
    void applyLanguage(language)
  }, [language])

  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  )
}
