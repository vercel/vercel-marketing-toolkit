import { NextRequest, NextResponse } from "next/server"
import { analyzeColumnMismatches } from "@/lib/validation-engine"
import type { CSVData, ColumnMapping } from "@/app/list-import/components/list-import-agent"

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { csvData, columnMapping } = await request.json() as {
      csvData: CSVData
      columnMapping: ColumnMapping
    }

    console.log("Column Analysis API: Analyzing column mappings...")

    const result = await analyzeColumnMismatches(csvData, columnMapping)

    console.log(`Column Analysis API: Found ${result.issues.length} issues`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Column analysis error:", error)
    return NextResponse.json(
      { error: "Column analysis failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}



