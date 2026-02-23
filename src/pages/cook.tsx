import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/layout'
import { CookProgressBar, CookSteps, CookTerminal, CookControls, PreviewChangesDialog } from '@/components/cook'
import { useTaskStore } from '@/stores/task-store'

export default function CookPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId) ?? null)
  const updateStatus = useTaskStore((s) => s.updateStatus)

  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const isPausedRef = useRef(false)

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPausedRef.current) {
        setProgress((p) => {
          if (p >= 100) { clearInterval(interval); return 100 }
          return p + 2
        })
      }
    }, 200)
    return () => clearInterval(interval)
  }, [])

  function handleStop() {
    if (taskId) updateStatus(taskId, 'todo')
    navigate('/tasks')
  }

  const taskName = (task as { name?: string } | null)?.name ?? 'Cook Session'

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={taskName} subtitle={`/cook/${taskId?.slice(0, 8)}`} />
      <div className="flex flex-col flex-1 p-6 gap-4 min-h-0">
        <CookProgressBar progress={progress} />
        <CookSteps progress={progress} />
        <CookTerminal progress={progress} />
        <CookControls
          isPaused={isPaused}
          onPauseResume={() => setIsPaused((p) => !p)}
          onStop={handleStop}
          onPreview={() => setShowPreview(true)}
        />
      </div>
      <PreviewChangesDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        task={task}
        onClose={() => setShowPreview(false)}
      />
    </div>
  )
}
