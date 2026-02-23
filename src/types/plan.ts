export type PhaseStatus = 'pending' | 'in_progress' | 'done'

export interface Phase {
  id: string
  planId: string
  name: string
  description?: string
  filePath?: string
  order: number
  status: PhaseStatus
}

export interface Plan {
  id: string
  deckId: string
  name: string
  reportPath?: string
  planPath?: string
  phases: Phase[]
  createdAt: string
}
