import { cn } from "@/lib/utils"

interface SamplePanelProps {
  before: string
  after: string
  title?: string
  className?: string
}

export function SamplePanel({ before, after, title, className }: SamplePanelProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      {title && (
        <div className="border-b border-border px-4 py-3 bg-muted">
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
        </div>
      )}
      <div className="grid gap-0 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="p-4">
          <div className="mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-red-500">Before</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{before}</p>
        </div>
        <div className="p-4">
          <div className="mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-green-500">After</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{after}</p>
        </div>
      </div>
    </div>
  )
}
