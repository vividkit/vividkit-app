import { AppHeader } from '@/components/layout'
import { useTranslation } from 'react-i18next'
import { SettingsGeneral, SettingsAiCommands, SettingsGit, SettingsEditor } from '@/components/settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={t('pages.settings.title')} />
      <div className="p-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">{t('pages.settings.tabs.general')}</TabsTrigger>
            <TabsTrigger value="ai-commands">{t('pages.settings.tabs.aiCommands')}</TabsTrigger>
            <TabsTrigger value="git">{t('pages.settings.tabs.git')}</TabsTrigger>
            <TabsTrigger value="editor">{t('pages.settings.tabs.editor')}</TabsTrigger>
          </TabsList>
          <TabsContent value="general"><SettingsGeneral /></TabsContent>
          <TabsContent value="ai-commands"><SettingsAiCommands /></TabsContent>
          <TabsContent value="git"><SettingsGit /></TabsContent>
          <TabsContent value="editor"><SettingsEditor /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
