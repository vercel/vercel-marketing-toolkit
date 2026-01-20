import { type NextRequest, NextResponse } from "next/server"

export interface GoogleSheetsData {
  headers: string[]
  rows: string[][]
  sheetId: string
  sheetName: string
}

export async function POST(request: NextRequest) {
  try {
    // Security: Get authenticated user from middleware
    const userEmail = request.headers.get('x-user-email') || 'unknown@internal.com'
    const userId = request.headers.get('x-user-id') || 'unknown'

    const { googleSheetId }: { googleSheetId: string } = await request.json()

    // Security: Validate input
    if (!googleSheetId) {
      return NextResponse.json({ success: false, error: "Google Sheet ID is required" }, { status: 400 })
    }

    // Security: Sanitize input to prevent injection attacks
    if (typeof googleSheetId !== 'string' || googleSheetId.length > 500) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid Google Sheet ID format" 
      }, { status: 400 })
    }

    // Extract sheet ID from various Google Sheets URL formats
    const extractSheetId = (input: string): string => {
      // If it's already just an ID
      if (input.match(/^[a-zA-Z0-9-_]+$/)) {
        return input
      }

      // Extract from full URL
      const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (match) {
        return match[1]
      }

      throw new Error("Invalid Google Sheet ID or URL format")
    }

    const sheetId = extractSheetId(googleSheetId)

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`
    const response = await fetch(csvUrl)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Google Sheet access denied. Please ensure the sheet is shared as 'Anyone with the link can view'. " +
            "Go to your Google Sheet → Share → Change 'Restricted' to 'Anyone with the link' → Set role to 'Viewer'.",
        )
      }
      if (response.status === 404) {
        throw new Error("Google Sheet not found. Please check the ID.")
      }
      throw new Error(`Failed to access Google Sheet: ${response.statusText}`)
    }

    // Security: Log successful sheet access for audit trail
    console.log("[GOOGLE_SHEETS_ACCESS]", {
      timestamp: new Date().toISOString(),
      sheetId,
      submittedBy: userEmail,
      userId,
      success: true,
    })

    return await parseCSVResponse(response, sheetId)
  } catch (error) {
    // Security: Log errors with user info for debugging and audit
    const userEmail = request.headers.get('x-user-email') || 'unknown@internal.com'
    const userId = request.headers.get('x-user-id') || 'unknown'
    
    console.error("[GOOGLE_SHEETS_ERROR]", {
      timestamp: new Date().toISOString(),
      submittedBy: userEmail,
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch Google Sheet data",
        message: "Unable to access Google Sheet. Please check the ID and permissions.",
      },
      { status: 500 },
    )
  }
}

async function parseCSVResponse(response: Response, sheetId: string) {
  const csvText = await response.text()

  if (!csvText.trim()) {
    throw new Error("The Google Sheet appears to be empty")
  }

  // Parse CSV data with enhanced debugging
  const lines = csvText.trim().split("\n")

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Handle escaped quotes ("")
          current += '"'
          i += 2
          continue
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        // End of field
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
      i++
    }

    // Add the last field
    result.push(current.trim())
    return result
  }

  const headers = parseCSVLine(lines[0]).map((header) => header.replace(/^"|"$/g, ""))

  const rows = lines.slice(1).map((line, lineIndex) => {
    const parsedRow = parseCSVLine(line)

    // Log parsing issues for debugging
    if (parsedRow.length !== headers.length) {
      console.warn(
        `[CSV_PARSE_WARNING] Row ${lineIndex + 2} has ${parsedRow.length} columns, expected ${headers.length}`,
      )
    }

    // Ensure row has same number of columns as headers, pad with empty strings if needed
    while (parsedRow.length < headers.length) {
      parsedRow.push("")
    }

    // Truncate if too many columns
    if (parsedRow.length > headers.length) {
      parsedRow.splice(headers.length)
    }

    // Remove quotes from cell values and handle special characters
    return parsedRow.map((cell) => {
      let cleanCell = cell.replace(/^"|"$/g, "")
      // Handle escaped quotes within cells
      cleanCell = cleanCell.replace(/""/g, '"')
      return cleanCell
    })
  })

  // Filter out completely empty rows
  const filteredRows = rows.filter((row: string[]) => row.some((cell) => cell && cell.toString().trim() !== ""))

  const sheetsData: GoogleSheetsData = {
    headers,
    rows: filteredRows,
    sheetId,
    sheetName: "Sheet1", // Default name since we can't get metadata without API
  }

  return NextResponse.json({
    success: true,
    data: sheetsData,
    message: `Successfully fetched ${filteredRows.length} rows from Google Sheet`,
  })
}
