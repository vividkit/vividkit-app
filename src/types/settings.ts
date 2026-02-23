export interface AppSettings {
  language: 'en' | 'vi'
  theme: 'light' | 'dark'
  autoSave: boolean
  fontSize: 12 | 14 | 16 | 18
  defaultBranch: string
  worktreesDir: string
  commandProviders: Record<string, string>
}
