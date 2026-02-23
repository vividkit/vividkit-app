import { Progress } from '@/components/ui/progress'

interface CookProgressBarProps {
  progress: number
}

export function CookProgressBar({ progress }: CookProgressBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Cooking…</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}
