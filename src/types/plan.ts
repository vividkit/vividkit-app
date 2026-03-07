export type PhaseStatus = 'pending' | 'in_progress' | 'done'

export interface Phase {
  id: string
  planId: string
  name: string
  description?: string
  filePath?: string
  order: number
  orderIndex?: number
  status: PhaseStatus
  createdAt?: string
  updatedAt?: string
}

export interface Plan {
  id: string
  deckId: string
  name: string
  reportPath?: string
  planPath?: string
  phases: Phase[]
  createdAt: string
  updatedAt?: string
}
