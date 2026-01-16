import Link from 'next/link'
import {
  CalendarDays,
  Image,
  LinkIcon,
  MessageSquare,
  ScanSearch,
  QrCode,
  Sparkles,
  Mail
} from 'lucide-react'

const tools = [
  {
    href: '/naming-generators',
    icon: MessageSquare,
    title: 'Naming Generators',
    description: 'Generate compelling names for your campaigns and projects',
    color: 'from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20'
  },
  {
    href: '/date-time-picker',
    icon: CalendarDays,
    title: 'Date & Time Picker',
    description: 'Convert and manage timezones for global campaigns',
    color: 'from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20'
  },
  {
    href: '/utm-generator',
    icon: LinkIcon,
    title: 'UTM Generator',
    description: 'Create trackable campaign URLs with UTM parameters',
    color: 'from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20'
  },
  {
    href: '/image-generator',
    icon: Image,
    title: 'Image Generator',
    description: 'Generate marketing images for your campaigns',
    color: 'from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20'
  },
  {
    href: '/qr-code-generator',
    icon: QrCode,
    title: 'QR Code Generator',
    description: 'Create QR codes for events and campaigns',
    color: 'from-indigo-500/10 to-blue-500/10 hover:from-indigo-500/20 hover:to-blue-500/20'
  },
  {
    href: '/content-analyzer',
    icon: Sparkles,
    title: 'Content Analyzer',
    description: 'AI-powered content analysis and optimization',
    color: 'from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20'
  },
  {
    href: '/email-review',
    icon: Mail,
    title: 'Email Review Agent',
    description: 'AI-powered email quality assurance and optimization',
    color: 'from-teal-500/10 to-cyan-500/10 hover:from-teal-500/20 hover:to-cyan-500/20'
  },
  {
    href: '/soql-query-helper',
    icon: ScanSearch,
    title: 'SOQL Query Helper',
    description: 'Generate and test Salesforce SOQL queries',
    color: 'from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20'
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/5 mb-4">
            <span className="text-3xl">▲</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Vercel Marketing Toolkit
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive suite of tools to power your marketing campaigns
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {tools.map(({ href, icon: Icon, title, description, color }) => (
            <Link
              key={href}
              href={href}
              className="group relative"
            >
              <div className={`h-full p-6 rounded-xl border border-border bg-gradient-to-br ${color} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-foreground/20`}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-card border border-border group-hover:border-foreground/30 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer Text */}
        <div className="text-center mt-16">
          <p className="text-sm text-muted-foreground">
            Built for the Vercel Marketing Team
          </p>
        </div>
      </div>
    </main>
  )
}
