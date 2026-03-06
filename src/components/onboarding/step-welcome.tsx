import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface StepWelcomeProps {
  onNext: () => void
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  const { t } = useTranslation()

  return (
    <div className="max-w-md text-center space-y-6">
      <div className="size-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
        <Sparkles className="size-8 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t('onboarding.welcome.title')}</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          {t('onboarding.welcome.description')}
        </p>
      </div>
      <Button size="lg" onClick={onNext} className="w-full">
        {t('onboarding.welcome.getStarted')}
      </Button>
    </div>
  )
}
