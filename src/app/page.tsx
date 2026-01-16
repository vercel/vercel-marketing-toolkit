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
    color: 'from-blue-500/60 to-blue-700/60 hover:from-blue-500/70 hover:to-blue-700/70 dark:from-blue-600/50 dark:to-blue-800/50 dark:hover:from-blue-600/60 dark:hover:to-blue-800/60'
  },
  {
    href: '/date-time-picker',
    icon: CalendarDays,
    title: 'Date & Time Picker',
    description: 'Convert and manage timezones for global campaigns',
    color: 'from-purple-500/60 to-purple-700/60 hover:from-purple-500/70 hover:to-purple-700/70 dark:from-purple-600/50 dark:to-purple-800/50 dark:hover:from-purple-600/60 dark:hover:to-purple-800/60'
  },
  {
    href: '/utm-generator',
    icon: LinkIcon,
    title: 'UTM Generator',
    description: 'Create trackable campaign URLs with UTM parameters',
    color: 'from-green-500/60 to-green-700/60 hover:from-green-500/70 hover:to-green-700/70 dark:from-green-600/50 dark:to-green-800/50 dark:hover:from-green-600/60 dark:hover:to-green-800/60'
  },
  {
    href: '/image-generator',
    icon: Image,
    title: 'Image Generator',
    description: 'Generate marketing images for your campaigns',
    color: 'from-red-500/60 to-red-700/60 hover:from-red-500/70 hover:to-red-700/70 dark:from-red-600/50 dark:to-red-800/50 dark:hover:from-red-600/60 dark:hover:to-red-800/60'
  },
  {
    href: '/qr-code-generator',
    icon: QrCode,
    title: 'QR Code Generator',
    description: 'Create QR codes for events and campaigns',
    color: 'from-blue-600/60 to-blue-800/60 hover:from-blue-600/70 hover:to-blue-800/70 dark:from-blue-700/50 dark:to-blue-900/50 dark:hover:from-blue-700/60 dark:hover:to-blue-900/60'
  },
  {
    href: '/content-analyzer',
    icon: Sparkles,
    title: 'Content Analyzer',
    description: 'AI-powered content analysis and optimization',
    color: 'from-amber-500/60 to-amber-700/60 hover:from-amber-500/70 hover:to-amber-700/70 dark:from-amber-600/50 dark:to-amber-800/50 dark:hover:from-amber-600/60 dark:hover:to-amber-800/60'
  },
  {
    href: '/email-review',
    icon: Mail,
    title: 'Email Review Agent',
    description: 'AI-powered email quality assurance and optimization',
    color: 'from-teal-500/60 to-teal-700/60 hover:from-teal-500/70 hover:to-teal-700/70 dark:from-teal-600/50 dark:to-teal-800/50 dark:hover:from-teal-600/60 dark:hover:to-teal-800/60'
  },
  {
    href: '/soql-query-helper',
    icon: ScanSearch,
    title: 'SOQL Query Helper',
    description: 'Generate and test Salesforce SOQL queries',
    color: 'from-pink-500/60 to-pink-700/60 hover:from-pink-500/70 hover:to-pink-700/70 dark:from-pink-600/50 dark:to-pink-800/50 dark:hover:from-pink-600/60 dark:hover:to-pink-800/60'
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="text-6xl">▲</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
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
