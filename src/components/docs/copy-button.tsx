"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  className?: string
  label?: string
}

export function CopyButton({ text, className, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={cn(
        "h-8 gap-2 text-muted-foreground hover:text-foreground",
        className
      )}
      aria-label={copied ? "Copied" : label}
      suppressHydrationWarning
    >
      <span className="flex items-center gap-2" suppressHydrationWarning>
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
          </>
        )}
      </span>
    </Button>
  )
}
