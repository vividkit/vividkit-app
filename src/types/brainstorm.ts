export interface BrainstormSession {
  id: string
  deckId: string
  prompt: string
  reportPath?: string
  status: 'idle' | 'running' | 'completed'
  createdAt: string
}

export interface KeyInsight {
  id: string
  projectId: string
  deckId: string
  title: string
  reportPath: string
  createdAt: string
}

export interface Idea {
  id: string
  content: string
  createdAt: string
}
