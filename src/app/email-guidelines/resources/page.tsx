import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

const tools = [
  {
    title: "Content Analyzer",
    description: "Check your content against our voice and tone guidelines",
    url: "/content-analyzer",
    color: "blue",
  },
  {
    title: "UTM Generator",
    description: "Create UTM parameters for campaign tracking",
    url: "/utm-generator",
    color: "emerald",
  },
  {
    title: "Naming Generator",
    description: "Generate consistent naming for campaigns and assets",
    url: "/naming-generators",
    color: "violet",
  },
  {
    title: "Email Review Agent",
    description: "Get AI-powered feedback on your email drafts",
    url: "/email-review",
    color: "amber",
  },
]

const colorClasses = {
  blue: {
    border: "border-blue-500/30 hover:border-blue-500/50",
    bg: "from-blue-500/10 via-blue-500/5 to-transparent hover:from-blue-500/15 hover:via-blue-500/10",
    icon: "bg-blue-500/20 border-blue-500/30 group-hover:border-blue-500/50 group-hover:bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  emerald: {
    border: "border-emerald-500/30 hover:border-emerald-500/50",
    bg: "from-emerald-500/10 via-emerald-500/5 to-transparent hover:from-emerald-500/15 hover:via-emerald-500/10",
    icon: "bg-emerald-500/20 border-emerald-500/30 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  violet: {
    border: "border-violet-500/30 hover:border-violet-500/50",
    bg: "from-violet-500/10 via-violet-500/5 to-transparent hover:from-violet-500/15 hover:via-violet-500/10",
    icon: "bg-violet-500/20 border-violet-500/30 group-hover:border-violet-500/50 group-hover:bg-violet-500/20",
    iconColor: "text-violet-400",
  },
  amber: {
    border: "border-amber-500/30 hover:border-amber-500/50",
    bg: "from-amber-500/10 via-amber-500/5 to-transparent hover:from-amber-500/15 hover:via-amber-500/10",
    icon: "bg-amber-500/20 border-amber-500/30 group-hover:border-amber-500/50 group-hover:bg-amber-500/20",
    iconColor: "text-amber-400",
  },
}

export default function EmailResourcesPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Resources
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Tools from the Marketing Toolkit to help you create and review content.
        </p>
      </section>

      {/* Marketing Toolkit Links */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Marketing Toolkit</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => {
            const colors = colorClasses[tool.color as keyof typeof colorClasses]
            return (
              <Link
                key={tool.title}
                href={tool.url}
                className={`group relative flex items-center justify-between gap-4 rounded-xl border bg-gradient-to-r p-5 transition-all ${colors.border} ${colors.bg}`}
              >
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all ${colors.icon}`}>
                  <ArrowUpRight className={`h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${colors.iconColor}`} />
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
