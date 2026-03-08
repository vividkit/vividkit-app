import { Brain, Lightbulb, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ProfileSelector } from './profile-selector'

interface BrainstormStartViewProps {
  onSubmit: (prompt: string) => void
  disabled?: boolean
  prompt: string
  onPromptChange: (value: string) => void
  profile: string
  onProfileChange: (value: string) => void
  onShowInsights: () => void
}

export function BrainstormStartView({
  onSubmit,
  disabled,
  prompt,
  onPromptChange,
  profile,
  onProfileChange,
  onShowInsights,
}: BrainstormStartViewProps) {
  const { t } = useTranslation()

  function handleSubmit() {
    if (!prompt.trim() || disabled) return
    onSubmit(prompt.trim())
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
      {/* Hero */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
          <Brain className="size-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {t('brainstorm.start.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('brainstorm.start.subtitle')}
        </p>
      </div>

      {/* Input card */}
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-4 space-y-3">
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={t('brainstorm.start.placeholder')}
          className="min-h-[140px] resize-none border-0 bg-transparent px-2 py-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />

        {/* Bottom row: insights left, profile + submit right */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowInsights}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Lightbulb className="size-3.5" />
            {t('brainstorm.start.previousInsights')}
          </Button>
          <div className="flex items-center gap-2">
            <ProfileSelector value={profile} onChange={onProfileChange} disabled={disabled} />
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || disabled}
              className="shrink-0 bg-amber-500 px-6 font-semibold text-white hover:bg-amber-400"
            >
              <Zap className="mr-1.5 size-3.5" />
              {t('brainstorm.start.submit')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
