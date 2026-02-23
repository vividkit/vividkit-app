import { AppHeader } from '@/components/layout'
import { SettingsGeneral, SettingsAiCommands, SettingsGit, SettingsEditor } from '@/components/settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Settings" />
      <div className="p-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ai-commands">AI & Commands</TabsTrigger>
            <TabsTrigger value="git">Git</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
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
