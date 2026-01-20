"use client"

import { ListImportAgent } from "./components/list-import-agent"

export const dynamic = "force-dynamic"

export default function ListImportPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-3">Upload. Clean. Send.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Streamline your list imports with AI-powered validation and normalization. No Ops tickets. No waiting.
          </p>
        </div>
        <ListImportAgent />
      </div>
    </div>
  )
}
