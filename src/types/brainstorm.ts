export type BrainstormStatus = 'idle' | 'running' | 'completed'

export interface BrainstormSession {
  id: string
  deckId: string
  prompt: string
  reportPath?: string
  sessionLogPath?: string
  status: BrainstormStatus
  createdAt: string
  updatedAt?: string
}
