import { useEffect } from 'react'
import { useTaskStore } from '@/stores/task-store'
import { useDeckStore } from '@/stores/deck-store'

export function useTasks() {
  const { activeDeckId } = useDeckStore()
  const { tasks, loaded, loadTasks, addTask, updateStatus, removeTask, updateTaskInfo } = useTaskStore()

  useEffect(() => {
    if (activeDeckId) {
      loadTasks(activeDeckId)
    }
  }, [activeDeckId])

  return { tasks, loaded, activeDeckId, addTask, updateStatus, removeTask, updateTaskInfo }
}
