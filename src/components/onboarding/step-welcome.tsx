import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StepWelcomeProps {
  onNext: () => void
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div className="max-w-md text-center space-y-6">
      <div className="size-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
        <Sparkles className="size-8 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome to VividKit</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Your AI-powered solo developer companion. Let's get you set up in just a few steps.
        </p>
      </div>
      <Button size="lg" onClick={onNext} className="w-full">
        Get Started
      </Button>
    </div>
  )
}
