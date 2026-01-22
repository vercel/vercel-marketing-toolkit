"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, CheckSquare, Mail, Download, Menu, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

const NAV_ITEMS = [
  { name: "Voice & Tone", href: "/email-guidelines", icon: BookOpen },
  { name: "Email Formatting", href: "/email-guidelines/formatting", icon: CheckSquare },
  { name: "Examples", href: "/email-guidelines/examples", icon: Mail },
  { name: "Resources", href: "/email-guidelines/resources", icon: Download },
]

function VercelLogo() {
  return (
    <svg
      aria-label="Vercel Logo"
      fill="currentColor"
      viewBox="0 0 75 65"
      height="18"
      className="text-foreground"
    >
      <path d="M37.5 0L75 65H0L37.5 0Z" />
    </svg>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <>
        {NAV_ITEMS.map((item) => (
          <span
            key={item.href}
            className="px-3 py-2 text-sm font-medium rounded-md text-muted-foreground"
          >
            {item.name}
          </span>
        ))}
      </>
    )
  }

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.name}
          </Link>
        )
      })}
    </>
  )
}

function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.name}
          </Link>
        )
      })}
    </>
  )
}

export default function EmailGuidelinesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="shrink-0 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Back to Marketing Toolkit">
            <ArrowLeft className="h-4 w-4" />
            <VercelLogo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Email guidelines navigation">
            <NavLinks />
          </nav>

          <div className="flex-1" />

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-background p-2" aria-label="Mobile navigation">
            <MobileNavLinks onNavigate={() => setMobileMenuOpen(false)} />
          </nav>
        )}
      </header>

      <main className="w-full">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
