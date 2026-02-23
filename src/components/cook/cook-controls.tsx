import { Pause, Play, Square, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CookControlsProps {
  isPaused: boolean
  onPauseResume: () => void
  onStop: () => void
  onPreview: () => void
}

export function CookControls({ isPaused, onPauseResume, onStop, onPreview }: CookControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onPauseResume}>
        {isPaused ? <><Play className="size-3.5 mr-1.5" /> Resume</> : <><Pause className="size-3.5 mr-1.5" /> Pause</>}
      </Button>
      <Button variant="outline" size="sm" onClick={onStop}>
        <Square className="size-3.5 mr-1.5" /> Stop
      </Button>
      <Button variant="outline" size="sm" onClick={onPreview}>
        <Eye className="size-3.5 mr-1.5" /> Preview Changes
      </Button>
    </div>
  )
}
