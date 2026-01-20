import type { ProcessedRow } from "@/app/list-import/components/list-import-agent"

export interface TrayPayload {
  importId: string
  submittedBy: string
  source: string
  batchNumber?: number
  totalBatches?: number
  metadata: {
    originalFilename?: string
    googleSheetId?: string
    rowCounts: {
      total: number
      clean: number
      flagged: number
      blocked: number
    }
    fixesApplied: string[]
    aiValidationUsed: boolean
  }
  records: TrayRecord[]
}

export interface TrayRecord {
  // Required fields
  email: string
  first_name?: string
  last_name?: string
  company?: string
  campaign_id?: string
  campaign_status?: string
  account_hq_billing_country?: string
  opted_in: string | boolean  // Required - cannot be empty
  
  // Optional fields
  title?: string
  website?: string
  phone?: string
  mobile_phone?: string
  account_hq_billing_state?: string
  Questions_and_Comments?: string
  subscribe_vercel_for_partners?: string | boolean
  primary_product_interest?: string
  
  // Additional fields that may be included
  extras?: Record<string, any>
}

export interface TrayResponse {
  success: boolean
  importId: string
  message: string
  batchesSent?: number
  totalRecords?: number
  results?: any[]
  errors?: string[]
}

export async function sendToTray(
  processedRows: ProcessedRow[],
  filename?: string,
  googleSheetId?: string,
): Promise<TrayResponse> {
  try {
    const response = await fetch("/api/send-to-tray", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        processedRows,
        filename,
        googleSheetId,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || result.message || "Failed to send to Tray")
    }

    return result
  } catch (error) {
    throw error
  }
}

export async function sendToScoring(
  processedRows: ProcessedRow[],
  filename?: string,
  googleSheetId?: string,
): Promise<TrayResponse> {
  try {
    const response = await fetch("/api/send-to-scoring", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        processedRows,
        filename,
        googleSheetId,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || result.message || "Failed to send to scoring agent")
    }

    return result
  } catch (error) {
    throw error
  }
}
