export interface ParsedCSV {
  headers: string[]
  rows: string[][]
  delimiter: string
  hasHeaders: boolean
}

export function detectDelimiter(content: string): string {
  const delimiters = [",", ";", "\t", "|"]
  const sample = content.split("\n").slice(0, 5).join("\n")

  let bestDelimiter = ","
  let maxColumns = 0

  for (const delimiter of delimiters) {
    const lines = sample.split("\n").filter((line) => line.trim())
    if (lines.length === 0) continue

    const columnCounts = lines.map((line) => line.split(delimiter).length)
    const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length

    if (avgColumns > maxColumns) {
      maxColumns = avgColumns
      bestDelimiter = delimiter
    }
  }

  return bestDelimiter
}

// Proper CSV parsing that handles quoted fields (including multi-line)
export function parseCSV(content: string, delimiter?: string): ParsedCSV {
  const detectedDelimiter = delimiter || detectDelimiter(content)
  
  if (!content || content.trim().length === 0) {
    throw new Error("CSV file is empty")
  }

  // Parse the entire CSV content character-by-character to handle multi-line quoted fields
  const rows = parseCSVContent(content, detectedDelimiter)

  if (rows.length === 0) {
    throw new Error("CSV file contains no data rows")
  }

  // Detect if first row is headers
  const firstRow = rows[0]
  const hasHeaders = firstRow.some((cell) => isNaN(Number(cell)) && cell.length > 0)

  const headers = hasHeaders ? firstRow : firstRow.map((_, i) => `Column ${i + 1}`)
  const dataRows = hasHeaders ? rows.slice(1) : rows

  const normalizedDataRows = dataRows.map((row) => {
    const normalizedRow = [...row]
    // Pad with empty strings if row is shorter than headers
    while (normalizedRow.length < headers.length) {
      normalizedRow.push("")
    }
    // Truncate if row is longer than headers
    return normalizedRow.slice(0, headers.length)
  })

  return {
    headers,
    rows: normalizedDataRows,
    delimiter: detectedDelimiter,
    hasHeaders,
  }
}

// Parse entire CSV content, respecting quotes (handles multi-line fields)
function parseCSVContent(content: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ""
  let inQuotes = false
  let i = 0

  while (i < content.length) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quoted field (e.g., "He said ""hello""")
        currentField += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === delimiter && !inQuotes) {
      // Field separator (comma) outside of quotes
      currentRow.push(currentField.trim())
      currentField = ""
      i++
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // Row separator (newline) outside of quotes
      // Handle \r\n (Windows) and \n (Unix) and \r (old Mac)
      if (char === '\r' && nextChar === '\n') {
        i += 2 // Skip both \r and \n
      } else {
        i++ // Skip single newline
      }
      
      // Add the last field of the row
      currentRow.push(currentField.trim())
      currentField = ""
      
      // Add row if it's not empty (skip blank lines)
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow)
      }
      currentRow = []
    } else {
      // Regular character (or newline inside quotes)
      currentField += char
      i++
    }
  }

  // Add the last field and row if not empty
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow)
    }
  }

  return rows
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quoted field
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === delimiter && !inQuotes) {
      // Field separator outside of quotes
      result.push(current.trim())
      current = ""
      i++
    } else {
      // Regular character
      current += char
      i++
    }
  }

  // Add the last field
  result.push(current.trim())

  return result
}
