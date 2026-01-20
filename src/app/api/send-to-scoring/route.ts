import { type NextRequest, NextResponse } from "next/server"
import { ENV } from "@/lib/env"
import type { ProcessedRow } from "@/app/list-import/components/list-import-agent"

export interface ScoringPayload {
  importId: string
  submittedBy: string
  source: string
  metadata: {
    originalFilename?: string
    googleSheetId?: string
    rowCounts: {
      total: number
      clean: number
      flagged: number
      blocked: number
    }
    totalRecordsSent: number
  }
  records: ScoringRecord[]
}

export interface ScoringRecord {
  // Required fields for scoring
  email: string
  contact_id: string
  account_id: string

  // Optional fields
  first_name?: string
  last_name?: string
  company?: string
  title?: string
  country?: string

  // Additional fields
  extras?: Record<string, any>
}

export interface ScoringResponse {
  success: boolean
  importId: string
  message: string
  recordsSent?: number
  results?: any[]
  errors?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { processedRows, filename, googleSheetId } = body as {
      processedRows: ProcessedRow[]
      filename?: string
      googleSheetId?: string
    }

    if (!processedRows || processedRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No rows to send" },
        { status: 400 }
      )
    }

    // Get scoring agent URL from environment
    const scoringUrl = ENV.SCORING_AGENT_URL
    if (!scoringUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Scoring agent URL not configured",
          message: "SCORING_AGENT_URL environment variable is not set"
        },
        { status: 500 }
      )
    }

    // Get user info from middleware
    const userEmail = request.headers.get("x-user-email") || "unknown@localhost"
    const userName = request.headers.get("x-user-name") || "Unknown User"

    // Generate import ID
    const importId = `scoring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Filter to only selected, non-blocked rows
    const validRows = processedRows.filter(
      (row) => row.selected && !row.validation.blocked
    )

    if (validRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid rows to send" },
        { status: 400 }
      )
    }

    console.log(`Sending ${validRows.length} rows to scoring agent...`)

    // Convert to scoring format
    const records: ScoringRecord[] = validRows.map((row) => ({
      email: row.normalized.email,
      contact_id: row.normalized.contact_id,
      account_id: row.normalized.account_id,
      first_name: row.normalized.first_name,
      last_name: row.normalized.last_name,
      company: row.normalized.company,
      title: row.normalized.title,
      country: row.normalized.account_hq_billing_country || row.normalized.country,
      extras: row.normalized.extras,
    }))

    // Build payload
    const payload: ScoringPayload = {
      importId,
      submittedBy: `${userName} (${userEmail})`,
      source: googleSheetId ? `Google Sheets: ${googleSheetId}` : filename || "CSV Upload",
      metadata: {
        originalFilename: filename,
        googleSheetId,
        rowCounts: {
          total: processedRows.length,
          clean: processedRows.filter((r) => r.validation.valid && r.validation.flags.length === 0).length,
          flagged: processedRows.filter((r) => r.validation.valid && r.validation.flags.length > 0).length,
          blocked: processedRows.filter((r) => r.validation.blocked).length,
        },
        totalRecordsSent: records.length,
      },
      records,
    }

    // Send to scoring agent
    const response = await fetch(scoringUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Scoring agent error:", errorText)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send to scoring agent",
          details: errorText
        },
        { status: 500 }
      )
    }

    const result = await response.json()

    console.log("Successfully sent to scoring agent:", result)

    return NextResponse.json({
      success: true,
      importId,
      message: `Successfully sent ${records.length} records to scoring agent`,
      recordsSent: records.length,
      results: [result],
    })

  } catch (error) {
    console.error("Send to scoring error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send to scoring agent",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
