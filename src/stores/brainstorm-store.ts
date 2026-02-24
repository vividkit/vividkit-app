import { create } from 'zustand'
import {
  createBrainstormSession as createBrainstormSessionCommand,
  createKeyInsight as createKeyInsightCommand,
  deleteKeyInsight as deleteKeyInsightCommand,
  listBrainstormSessions,
  listKeyInsights,
  updateBrainstormSession as updateBrainstormSessionCommand,
} from '@/lib/tauri'
import type { BrainstormSession, KeyInsight } from '@/types'

type SessionInput = Pick<BrainstormSession, 'deckId' | 'prompt'> & Partial<Pick<BrainstormSession, 'status' | 'reportPath'>>
type InsightInput = Pick<KeyInsight, 'projectId' | 'deckId' | 'title' | 'reportPath'>

interface BrainstormStore {
  sessions: BrainstormSession[]
  insights: KeyInsight[]
  loading: boolean
  initialized: boolean
  error: string | null
  loadSessions: (deckId: string) => Promise<void>
  loadInsights: (deckId: string) => Promise<void>
  addSession: (input: SessionInput | BrainstormSession) => Promise<BrainstormSession | null>
  updateSession: (id: string, patch: Pick<SessionInput, 'status' | 'reportPath'>) => Promise<BrainstormSession | null>
  addInsight: (input: InsightInput | KeyInsight) => Promise<KeyInsight | null>
  removeInsight: (id: string) => Promise<boolean>
  clearError: () => void
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function notifyError(message: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vividkit:toast', { detail: { type: 'error', message } }))
  }
}

function upsertSession(sessions: BrainstormSession[], next: BrainstormSession): BrainstormSession[] {
  const exists = sessions.some((session) => session.id === next.id)
  if (exists) {
    return sessions.map((session) => (session.id === next.id ? next : session))
  }
  return [next, ...sessions]
}

function upsertInsight(insights: KeyInsight[], next: KeyInsight): KeyInsight[] {
  const exists = insights.some((insight) => insight.id === next.id)
  if (exists) {
    return insights.map((insight) => (insight.id === next.id ? next : insight))
  }
  return [next, ...insights]
}

export const useBrainstormStore = create<BrainstormStore>((set, get) => ({
  sessions: [],
  insights: [],
  loading: false,
  initialized: false,
  error: null,
  loadSessions: async (deckId) => {
    set({ loading: true, error: null })
    try {
      const sessions = await listBrainstormSessions(deckId)
      set({ sessions, loading: false, initialized: true })
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, initialized: true, error: message })
      notifyError(message)
    }
  },
  loadInsights: async (deckId) => {
    set({ loading: true, error: null })
    try {
      const insights = await listKeyInsights(deckId)
      set({ insights, loading: false, initialized: true })
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, initialized: true, error: message })
      notifyError(message)
    }
  },
  addSession: async (input) => {
    set({ loading: true, error: null })
    try {
      let session = await createBrainstormSessionCommand({ deckId: input.deckId, prompt: input.prompt })
      if (input.status !== undefined || input.reportPath !== undefined) {
        session = await updateBrainstormSessionCommand({
          id: session.id,
          status: input.status,
          reportPath: input.reportPath,
        })
      }
      set((state) => ({ sessions: upsertSession(state.sessions, session), loading: false }))
      return session
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  updateSession: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const session = await updateBrainstormSessionCommand({ id, ...patch })
      set((state) => ({ sessions: upsertSession(state.sessions, session), loading: false }))
      return session
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  addInsight: async (input) => {
    set({ loading: true, error: null })
    try {
      const insight = await createKeyInsightCommand({
        projectId: input.projectId,
        deckId: input.deckId,
        title: input.title,
        reportPath: input.reportPath,
      })
      set((state) => ({ insights: upsertInsight(state.insights, insight), loading: false }))
      return insight
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return null
    }
  },
  removeInsight: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteKeyInsightCommand(id)
      set((state) => ({ insights: state.insights.filter((insight) => insight.id !== id), loading: false }))
      return true
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      notifyError(message)
      return false
    }
  },
  clearError: () => {
    if (get().error) {
      set({ error: null })
    }
  },
}))
