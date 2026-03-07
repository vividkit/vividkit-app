export type AccountStatus = 'active' | 'paused' | 'exhausted'

export interface CcsAccount {
  id: string
  projectId?: string
  provider: string
  name: string
  email?: string
  status: AccountStatus
  configPath?: string
  createdAt: string
  updatedAt: string
}
