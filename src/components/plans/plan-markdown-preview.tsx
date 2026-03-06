import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from 'react-i18next'
import type { Plan } from '@/types'

interface PlanMarkdownPreviewProps {
  plan: Plan
}

function buildMarkdown(plan: Plan, createdLabel: string, phasesTitle: string, noDescription: string, date: string): string {
  const phases = plan.phases
    .map((p) => `### ${p.order}. ${p.name}\n${p.description ?? noDescription}`)
    .join('\n\n')

  return `# ${plan.name}\n\n**${createdLabel}:** ${date}\n\n---\n\n## ${phasesTitle}\n\n${phases}`
}

export function PlanMarkdownPreview({ plan }: PlanMarkdownPreviewProps) {
  const { t, i18n } = useTranslation()
  const content = buildMarkdown(
    plan,
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
