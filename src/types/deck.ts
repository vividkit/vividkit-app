export interface Deck {
  id: string
  projectId: string
  name: string
  description?: string
  isActive: boolean
  basedOnInsightId?: string
  createdAt: string
  updatedAt?: string
}
