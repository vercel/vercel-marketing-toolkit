"use client"

import { CopyButton } from "./copy-button"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

interface CopyCardProps {
  title: string
  content: string
  variant?: "do" | "dont" | "neutral"
  className?: string
  hideCopy?: boolean
}

export function CopyCard({ title, content, variant = "neutral", className, hideCopy = false }: CopyCardProps) {
  const variantStyles = {
    do: "border-l-green-500",
    dont: "border-l-red-500",
    neutral: "border-l-border",
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card border-l-4",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2" suppressHydrationWarning>
            {variant === "do" && (
              <span className="shrink-0" aria-label="Do" suppressHydrationWarning>
                <Check className="h-4 w-4 text-green-500" />
              </span>
            )}
            {variant === "dont" && (
              <span className="shrink-0" aria-label="Don't" suppressHydrationWarning>
                <X className="h-4 w-4 text-red-500" />
              </span>
            )}
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{content}</p>
        </div>
        {!hideCopy && <CopyButton text={content} className="shrink-0" />}
      </div>
    </div>
  )
}
