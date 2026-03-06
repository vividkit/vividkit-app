import { Progress } from '@/components/ui/progress'
import { useTranslation } from 'react-i18next'

interface CookProgressBarProps {
  progress: number
}

export function CookProgressBar({ progress }: CookProgressBarProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t('cook.progress.cooking')}</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}
