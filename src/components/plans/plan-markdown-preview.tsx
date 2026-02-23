import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Plan } from '@/types'

interface PlanMarkdownPreviewProps {
  plan: Plan
}

function buildMarkdown(plan: Plan): string {
  const phases = plan.phases
    .map((p) => `### Phase ${p.order}: ${p.name}\n${p.description ?? 'No description.'}`)
    .join('\n\n')

  return `# ${plan.name}\n\n**Created:** ${new Date(plan.createdAt).toLocaleDateString()}\n\n---\n\n## Phases\n\n${phases}`
}

export function PlanMarkdownPreview({ plan }: PlanMarkdownPreviewProps) {
  const content = buildMarkdown(plan)

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
