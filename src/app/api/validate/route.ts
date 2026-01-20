import { NextRequest, NextResponse } from "next/server"
import { validateAndNormalizeRows } from "@/lib/validation-engine"
import type { CSVData, ColumnMapping } from "@/app/list-import/components/list-import-agent"

export const maxDuration = 60 // Allow up to 60 seconds for validation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csvData, columnMapping } = body as {
      csvData: CSVData
      columnMapping: ColumnMapping
    }

    console.log("Validation API: Starting validation for", csvData.rows.length, "rows")

    const results = await validateAndNormalizeRows(csvData, columnMapping)

    console.log("Validation API: Completed. Results count:", results.length)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Validation API error:", error)
    return NextResponse.json(
      { error: "Validation failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

