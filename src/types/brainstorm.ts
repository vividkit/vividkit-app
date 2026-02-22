export interface Idea {
  id: string
  content: string
  createdAt: string
}

export interface BrainstormSession {
  id: string
  projectId: string
  ideas: Idea[]
}
