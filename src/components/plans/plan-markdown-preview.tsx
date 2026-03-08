import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from 'react-i18next'
import type { PlanWithPhases } from '@/lib/tauri'

type Plan = PlanWithPhases['plan']
type Phase = PlanWithPhases['phases'][number]

interface PlanMarkdownPreviewProps {
  plan: Plan
  planContent: string | null
  phases: Phase[]
}

function buildFallbackMarkdown(
  plan: Plan,
  phases: Phase[],
  createdLabel: string,
  phasesTitle: string,
  noDescription: string,
  date: string,
): string {
  const phasesMd = phases
    .map((p) => `### ${p.orderIndex}. ${p.name}\n${p.description ?? noDescription}`)
    .join('\n\n')

  return `# ${plan.name}\n\n**${createdLabel}:** ${date}\n\n---\n\n## ${phasesTitle}\n\n${phasesMd}`
}

export function PlanMarkdownPreview({ plan, planContent, phases }: PlanMarkdownPreviewProps) {
  const { t, i18n } = useTranslation()
  const content = planContent ?? buildFallbackMarkdown(
    plan,
    phases,
    t('common.labels.created'),
    t('plans.markdown.phasesTitle'),
    t('plans.markdown.noDescription'),
    new Intl.DateTimeFormat(i18n.language).format(new Date(plan.createdAt)),
  )

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
