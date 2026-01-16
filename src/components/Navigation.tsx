"use client"

import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'

export default function Navigation() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-foreground text-background">
              <span className="text-lg font-bold">▲</span>
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block">Marketing Toolkit</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
