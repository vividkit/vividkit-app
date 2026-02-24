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
  provider: string
  email: string
  status: 'active' | 'paused' | 'exhausted'
}

export interface ProjectConfig {
  aiProvider: string
  apiKey: string
  theme: 'light' | 'dark'
}
