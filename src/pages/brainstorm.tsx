import { useState, useCallback } from 'react'
import { AppHeader } from '@/components/layout'
import { DeckContextBar, BrainstormTerminal, BrainstormInput, BrainstormActions } from '@/components/brainstorm'
import { useBrainstormStore } from '@/stores/brainstorm-store'
import { useDeckStore } from '@/stores/deck-store'

type SessionStatus = 'idle' | 'running' | 'completed'

export default function BrainstormPage() {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [prompt, setPrompt] = useState('')
  const addSession = useBrainstormStore((s) => s.addSession)
  const { activeDeckId } = useDeckStore()

  function handleSubmit(text: string) {
    setPrompt(text)
    setStatus('running')
    addSession({
      id: crypto.randomUUID(),
      deckId: activeDeckId ?? '',
      prompt: text,
      status: 'running',
      createdAt: new Date().toISOString(),
    })
  }

  const handleComplete = useCallback(() => setStatus('completed'), [])

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Brainstorm" />
      <DeckContextBar />
      <div className="flex flex-col flex-1 p-4 gap-3 min-h-0">
        <BrainstormTerminal status={status} onComplete={handleComplete} />
        {status === 'completed' && <BrainstormActions prompt={prompt} />}
        <BrainstormInput onSubmit={handleSubmit} disabled={status === 'running'} />
      </div>
    </div>
  )
}
