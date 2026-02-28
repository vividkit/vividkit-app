import type { SystemLine as SystemLineType } from '@/lib/jsonl-session-parser'

interface Props {
  item: SystemLineType
}

// Subtle centered pill for session system events like "Initialized your session"
export function SystemLine({ item }: Props) {
  return (
    <div className="flex items-center justify-center px-4 py-1">
      <span className="inline-flex items-center rounded-full bg-muted/60 px-3 py-0.5 text-[11px] text-muted-foreground italic border border-border/40">
        {item.label}
      </span>
    </div>
  )
}
