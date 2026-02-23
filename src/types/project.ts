export interface Project {
  id: string
  name: string
  description?: string
  gitPath: string
  ccsConnected: boolean
  ccsAccounts: CcsAccount[]
  createdAt: string
}

export interface CcsAccount {
  provider: 'claude' | 'gemini' | 'copilot' | 'openrouter'
  email: string
  status: 'active' | 'paused' | 'exhausted'
}

export interface ProjectConfig {
  aiProvider: string
  apiKey: string
  theme: 'light' | 'dark'
}
