import { useState, useRef } from 'react'
import { AppHeader } from '@/components/layout'
import { useTranslation } from 'react-i18next'
import { SettingsGeneral, SettingsAiCommands, SettingsGit, SettingsEditor } from '@/components/settings'
import { CcsTestConsole } from '@/components/settings/ccs-test-console'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SettingsPage() {
  const { t } = useTranslation()
  const [devMode, setDevMode] = useState(false)
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Triple-click version number to toggle dev mode
  function handleVersionClick() {
    clickCountRef.current += 1
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0 }, 500)
    if (clickCountRef.current >= 3) {
      setDevMode((v) => !v)
      clickCountRef.current = 0
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader
        title={t('pages.settings.title')}
      />
      <div className="p-6">
        <p
          className="text-xs text-muted-foreground mb-4 cursor-default select-none"
          onClick={handleVersionClick}
        >
          {devMode ? 'v0.1.0 (Dev Mode)' : 'v0.1.0'}
        </p>
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">{t('pages.settings.tabs.general')}</TabsTrigger>
            <TabsTrigger value="ai-commands">{t('pages.settings.tabs.aiCommands')}</TabsTrigger>
            <TabsTrigger value="git">{t('pages.settings.tabs.git')}</TabsTrigger>
            <TabsTrigger value="editor">{t('pages.settings.tabs.editor')}</TabsTrigger>
            {devMode && <TabsTrigger value="ccs-test">CCS Test</TabsTrigger>}
          </TabsList>
          <TabsContent value="general"><SettingsGeneral /></TabsContent>
          <TabsContent value="ai-commands"><SettingsAiCommands /></TabsContent>
          <TabsContent value="git"><SettingsGit /></TabsContent>
          <TabsContent value="editor"><SettingsEditor /></TabsContent>
          {devMode && <TabsContent value="ccs-test"><CcsTestConsole /></TabsContent>}
        </Tabs>
      </div>
    </div>
  )
}
