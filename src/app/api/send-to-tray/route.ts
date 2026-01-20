import { type NextRequest, NextResponse } from "next/server"
import { ENV } from "@/lib/env"
import type { ProcessedRow } from "@/app/list-import/components/list-import-agent"

export interface TrayPayload {
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
    fixesApplied: string[]
    aiValidationUsed: boolean
    totalRecordsSent: number
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
  opted_in?: string | boolean  // Required - cannot be empty
  
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
  errors?: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Security: Verify Tray webhook is configured
    if (!ENV.TRAY_WEBHOOK_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "TRAY_WEBHOOK_URL environment variable is not configured",
          message: "Webhook URL is missing from server configuration",
        },
        { status: 500 },
      )
    }

    // Security: Get authenticated user from middleware
    const userEmail = request.headers.get('x-user-email') || 'unknown@internal.com'
    const userName = request.headers.get('x-user-name') || 'Unknown User'
    const userId = request.headers.get('x-user-id') || 'unknown'

    const {
      processedRows,
      filename,
      googleSheetId,
    }: {
      processedRows: ProcessedRow[]
      filename?: string
      googleSheetId?: string
    } = await request.json()

    // Security: Validate input
    if (!processedRows || !Array.isArray(processedRows)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          message: "processedRows must be an array",
        },
        { status: 400 },
      )
    }

    // Security: Limit batch size to prevent abuse
    if (processedRows.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          error: "Batch size too large",
          message: "Maximum 10,000 rows allowed per import. Please split your file.",
        },
        { status: 400 },
      )
    }

    const importId = crypto.randomUUID()
    const selectedRows = processedRows.filter((row) => row.selected && !row.validation.blocked)

    // Convert processed rows to Tray records with exact field names required by Tray
    const records: TrayRecord[] = selectedRows.map((row) => {
      const record: TrayRecord = {
        email: row.normalized.email,
      }

      // Map to exact Tray field names (snake_case)
      // Support both snake_case and camelCase from input
      const firstName = row.normalized.first_name || row.normalized.firstName
      const lastName = row.normalized.last_name || row.normalized.lastName
      
      if (firstName) record.first_name = firstName
      if (lastName) record.last_name = lastName
      if (row.normalized.company) record.company = row.normalized.company
      if (row.normalized.title) record.title = row.normalized.title
      if (row.normalized.website) record.website = row.normalized.website
      
      // Phone fields - map to exact Tray headers
      if (row.normalized.phone) record.phone = row.normalized.phone
      if (row.normalized.mobile_phone) record.mobile_phone = row.normalized.mobile_phone
      
      // Billing location fields - exact Tray headers
      if (row.normalized.account_hq_billing_state || row.normalized.state || row.normalized.account_hq_billing_state_code) {
        record.account_hq_billing_state = row.normalized.account_hq_billing_state || 
                                          row.normalized.state || 
                                          row.normalized.account_hq_billing_state_code
      }
      if (row.normalized.account_hq_billing_country || row.normalized.country) {
        record.account_hq_billing_country = row.normalized.account_hq_billing_country || row.normalized.country
      }
      
      // Campaign fields - exact Tray headers
      if (row.normalized.campaign_id) record.campaign_id = row.normalized.campaign_id
      if (row.normalized.campaign_status || row.normalized.status) {
        record.campaign_status = row.normalized.campaign_status || row.normalized.status
      }
      
      // Required: opted_in field (must always be present)
      // Default to true if not explicitly set
      record.opted_in = row.normalized.opted_in ?? true
      
      // Optional Tray-specific fields
      if (row.normalized.Questions_and_Comments) {
        record.Questions_and_Comments = row.normalized.Questions_and_Comments
      }
      if (row.normalized.subscribe_vercel_for_partners !== undefined && 
          row.normalized.subscribe_vercel_for_partners !== null && 
          row.normalized.subscribe_vercel_for_partners !== '') {
        record.subscribe_vercel_for_partners = row.normalized.subscribe_vercel_for_partners
      }
      if (row.normalized.primary_product_interest) {
        record.primary_product_interest = row.normalized.primary_product_interest
      }

      // Add all other unmapped fields as extras
      const mappedFields = new Set([
        'email', 'first_name', 'firstName', 'last_name', 'lastName', 'company', 'title',
        'website', 'phone', 'mobile_phone', 'account_hq_billing_state', 'account_hq_billing_state_code',
        'state', 'account_hq_billing_country', 'country', 'campaign_id', 'campaign_status', 
        'status', 'Questions_and_Comments', 'opted_in', 'subscribe_vercel_for_partners', 
        'primary_product_interest', 'extras', 'fullName'
      ])
      
      const extras: Record<string, any> = {}
      Object.entries(row.normalized).forEach(([key, value]) => {
        if (!mappedFields.has(key) && value !== undefined && value !== null && value !== '') {
          extras[key] = value
        }
      })
      
      // Merge with existing extras
      if (row.normalized.extras) {
        Object.assign(extras, row.normalized.extras)
      }
      
      if (Object.keys(extras).length > 0) {
        record.extras = extras
      }

      return record
    })

    // Calculate summary statistics
    const totalRows = processedRows.length
    const cleanRows = selectedRows.filter((row) => row.validation.flags.length === 0).length
    const flaggedRows = selectedRows.filter((row) => row.validation.flags.length > 0).length
    const blockedRows = processedRows.filter((row) => row.validation.blocked).length

    // Determine fixes applied
    const fixesApplied: string[] = []
    if (selectedRows.some((row) => JSON.stringify(row.original) !== JSON.stringify(row.normalized))) {
      fixesApplied.push("Trim", "NormalizeCountry", "NormalizeState", "NameSplit")
    }

    // Send all records in a single payload (no batching)
    const payload: TrayPayload = {
      importId,
      submittedBy: userEmail, // Real user from authenticated session
      source: googleSheetId ? "GoogleSheets" : "ListImportAgent",
      metadata: {
        ...(filename && { originalFilename: filename }),
        ...(googleSheetId && { googleSheetId }),
        rowCounts: {
          total: totalRows,
          clean: cleanRows,
          flagged: flaggedRows,
          blocked: blockedRows,
        },
        fixesApplied,
        aiValidationUsed: selectedRows.some((row) => 
          row.validation.flags.some((flag) => 
            flag === 'NAME_EMAIL_MISMATCH' || 
            flag === 'COMPANY_DOMAIN_MISMATCH' || 
            flag === 'FIELD_TYPE_MISMATCH' || 
            flag === 'LIKELY_TEST_DATA'
          )
        ),
        totalRecordsSent: records.length,
      },
      records: records, // Send all records at once
    }

    const response = await fetch(ENV.TRAY_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...ENV.TRAY_HEADERS,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Tray webhook failed: ${response.status} ${errorText}`)
    }

    // Try to parse JSON response, but don't fail if Tray returns empty/invalid JSON
    let result: any
    try {
      const responseText = await response.text()
      if (responseText && responseText.trim()) {
        result = JSON.parse(responseText)
      } else {
        // Tray returned empty response - that's OK, webhook was received
        result = { success: true, message: "Webhook received (empty response)" }
      }
    } catch (jsonError) {
      // Tray returned non-JSON response - that's OK too
      console.log(`Tray returned non-JSON response (webhook still succeeded)`)
      result = { success: true, message: "Webhook received (non-JSON response)" }
    }

    // Security: Log import with user info for audit trail
    console.log("[LIST_IMPORT_LOG]", {
      timestamp: new Date().toISOString(),
      importId,
      submittedBy: userEmail,
      userId,
      userName,
      filename,
      googleSheetId,
      totalRecordsSent: records.length,
      trayResponse: result,
    })

    // Security: Log the overall import summary with user info for audit trail
    console.log("[LIST_IMPORT_SUMMARY]", {
      timestamp: new Date().toISOString(),
      importId,
      submittedBy: userEmail,
      userId,
      userName,
      source: googleSheetId ? "GoogleSheets" : "CSV",
      filename,
      googleSheetId,
      rowCounts: {
        total: totalRows,
        clean: cleanRows,
        flagged: flaggedRows,
        blocked: blockedRows,
      },
      fixesApplied,
      aiValidationUsed: selectedRows.some((row) => 
        row.validation.flags.some((flag) => 
          flag === 'NAME_EMAIL_MISMATCH' || 
          flag === 'COMPANY_DOMAIN_MISMATCH' || 
          flag === 'FIELD_TYPE_MISMATCH' || 
          flag === 'LIKELY_TEST_DATA'
        )
      ),
      totalRecordsSent: records.length,
    })

    return NextResponse.json({
      success: true,
      importId,
      message: `Successfully sent ${records.length} records to Tray`,
      totalRecords: records.length,
      trayResponse: result,
    })
  } catch (error) {
    // Security: Log errors with user info for debugging and audit
    const userEmail = request.headers.get('x-user-email') || 'unknown@internal.com'
    const userId = request.headers.get('x-user-id') || 'unknown'
    
    console.error("[LIST_IMPORT_ERROR]", {
      timestamp: new Date().toISOString(),
      submittedBy: userEmail,
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to send to Tray webhook",
      },
      { status: 500 },
    )
  }
}
