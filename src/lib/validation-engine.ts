import {
  isValidEmail,
  isBlockedDomain,
  isBlockedCompany,
  normalizeText,
  toTitleCase,
  cleanName,
  normalizeCountry,
  normalizeState,
  normalizePhone,
  normalizeWebsite,
  splitFullName,
} from "./validation"
import type { CSVData, ColumnMapping, ProcessedRow, ValidationResult } from "@/app/list-import/components/list-import-agent"

/**
 * Extract first name from email address when we have high confidence patterns
 * Only extracts from patterns like: firstname.lastname@ or firstname_lastname@
 */
function extractFirstNameFromEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null
  
  const username = email.split('@')[0]?.toLowerCase()
  if (!username) return null
  
  // Skip generic/role-based emails
  const genericPatterns = [
    'info', 'sales', 'support', 'admin', 'hello', 'contact', 'team', 'help',
    'office', 'marketing', 'billing', 'accounts', 'hr', 'jobs', 'careers',
    'press', 'media', 'news', 'newsletter', 'noreply', 'no-reply', 'donotreply',
    'webmaster', 'postmaster', 'hostmaster', 'abuse', 'security', 'legal',
    'feedback', 'enquiries', 'inquiries', 'service', 'customerservice'
  ]
  
  if (genericPatterns.some(pattern => username === pattern || username.startsWith(pattern + '@'))) {
    return null
  }
  
  // Pattern 1: firstname.lastname (highest confidence)
  if (username.includes('.')) {
    const parts = username.split('.')
    const firstName = parts[0]
    // Validate it looks like a real name (2+ chars, letters only)
    if (firstName && firstName.length >= 2 && /^[a-z]+$/.test(firstName)) {
      // Make sure it's not a single letter initial
      if (firstName.length > 1) {
        return toTitleCase(firstName)
      }
    }
  }
  
  // Pattern 2: firstname_lastname
  if (username.includes('_')) {
    const parts = username.split('_')
    const firstName = parts[0]
    if (firstName && firstName.length >= 2 && /^[a-z]+$/.test(firstName)) {
      return toTitleCase(firstName)
    }
  }
  
  // Pattern 3: firstname-lastname (less common but valid)
  if (username.includes('-')) {
    const parts = username.split('-')
    const firstName = parts[0]
    if (firstName && firstName.length >= 2 && /^[a-z]+$/.test(firstName)) {
      return toTitleCase(firstName)
    }
  }
  
  // Don't extract from ambiguous patterns like "johnsmith" - too risky
  return null
}

export async function validateAndNormalizeRows(
  csvData: CSVData,
  columnMapping: ColumnMapping,
  onProgress?: (current: number, total: number) => void,
  isScoring?: boolean,
): Promise<ProcessedRow[]> {
  const results: ProcessedRow[] = []
  const emailsSeen = new Map<string, number>() // email -> first occurrence index

  for (let i = 0; i < csvData.rows.length; i++) {
    const row = csvData.rows[i]
    const originalData = mapRowToFields(row, csvData.headers, columnMapping)

    // Step 1: Deterministic validation and normalization
    // For scoring mode, use simplified validation
    const { normalizedData, validation } = isScoring 
      ? validateScoringRow(originalData)
      : await validateAndNormalizeRow(originalData)

    // AI validation is now handled via batched API calls in validate-stage.tsx
    // See /api/validate-ai-batch for the server-side AI validation

    results.push({
      original: originalData,
      normalized: normalizedData,
      validation,
      selected: !validation.blocked,
    })

    // Track emails for duplicate detection
    const email = String(normalizedData.email || "").toLowerCase().trim()
    if (email) {
      if (emailsSeen.has(email)) {
        // This is a duplicate - flag it
        validation.flags.push("DUPLICATE_EMAIL")
        validation.reasons.DUPLICATE_EMAIL = `Duplicate of row ${emailsSeen.get(email)! + 1}`
      } else {
        emailsSeen.set(email, i)
      }
    }

    onProgress?.(i + 1, csvData.rows.length)
  }

  return results
}

// Simplified validation for scoring mode - minimal checks, no AI
function validateScoringRow(originalData: Record<string, any>): { normalizedData: Record<string, any>; validation: ValidationResult } {
  const normalizedData = { ...originalData }
  const validation: ValidationResult = {
    valid: true,
    blocked: false,
    flags: [],
    suggestedFixes: {},
    reasons: {},
    normalizedData: {},
  }

  // Check required scoring fields
  if (!normalizedData.email || !isValidEmail(normalizedData.email)) {
    validation.blocked = true
    validation.valid = false
    validation.reasons.INVALID_EMAIL = "Invalid or missing email address"
  }

  if (!normalizedData.contact_id) {
    validation.blocked = true
    validation.valid = false
    validation.reasons.MISSING_CONTACT_ID = "Missing contact_id"
  }

  if (!normalizedData.account_id) {
    validation.blocked = true
    validation.valid = false
    validation.reasons.MISSING_ACCOUNT_ID = "Missing account_id"
  }

  // Basic normalization
  if (normalizedData.email) {
    normalizedData.email = normalizedData.email.toLowerCase().trim()
  }
  
  // Clean up names by removing random/garbage characters, then apply title case
  if (normalizedData.first_name) {
    const cleaned = cleanName(normalizedData.first_name)
    normalizedData.first_name = cleaned ? toTitleCase(cleaned) : ''
  }
  if (normalizedData.last_name) {
    const cleaned = cleanName(normalizedData.last_name)
    normalizedData.last_name = cleaned ? toTitleCase(cleaned) : ''
  }

  return { normalizedData, validation }
}

function mapRowToFields(row: string[], headers: string[], columnMapping: ColumnMapping): Record<string, any> {
  const mapped: Record<string, any> = {}
  const extras: Record<string, any> = {}

  headers.forEach((header, index) => {
    const value = row[index]?.trim() || ""
    const mappedField = columnMapping[header]

    if (mappedField) {
      mapped[mappedField] = value
    } else {
      extras[header] = value
    }
  })

  if (Object.keys(extras).length > 0) {
    mapped.extras = extras
  }

  return mapped
}

async function validateAndNormalizeRow(
  originalData: Record<string, any>,
): Promise<{ normalizedData: Record<string, any>; validation: ValidationResult }> {
  const normalized = { ...originalData }
  const validation: ValidationResult = {
    valid: true,
    blocked: false,
    flags: [],
    suggestedFixes: {},
    reasons: {},
  }

  // Required field validation - email
  if (!normalized.email || !isValidEmail(normalized.email)) {
    validation.valid = false
    validation.blocked = true
    validation.reasons.INVALID_EMAIL = "Email is missing or invalid"
    return { normalizedData: normalized, validation }
  }

  // Required field validation - campaign_id
  if (!normalized.campaign_id) {
    validation.valid = false
    validation.blocked = true
    validation.reasons.MISSING_CAMPAIGN_ID = "Campaign ID is required"
    return { normalizedData: normalized, validation }
  }

  // Required field validation - campaign_status
  if (!normalized.campaign_status) {
    validation.valid = false
    validation.blocked = true
    validation.reasons.MISSING_CAMPAIGN_STATUS = "Campaign Status is required"
    return { normalizedData: normalized, validation }
  }

  // Required field validation - account_hq_billing_country
  if (!normalized.account_hq_billing_country) {
    validation.valid = false
    validation.blocked = true
    validation.reasons.MISSING_BILLING_COUNTRY = "Account Billing Country is required"
    return { normalizedData: normalized, validation }
  }

  // Handle last_name - set to [unknown] if blank instead of blocking
  const lastNameField = normalized.lastName !== undefined ? "lastName" : "last_name"
  const rawLastName = normalized[lastNameField]
  if (!rawLastName || String(rawLastName).trim() === "" || String(rawLastName).trim() === "-") {
    normalized[lastNameField] = "[unknown]"
    validation.flags.push("LAST_NAME_UNKNOWN")
    validation.reasons.LAST_NAME_UNKNOWN = "Last name was blank, set to [unknown]"
  }

  // Infer first_name from email if missing/unknown
  const firstNameField = normalized.firstName !== undefined ? "firstName" : "first_name"
  const rawFirstName = normalized[firstNameField]
  const firstNameMissing = !rawFirstName || 
    String(rawFirstName).trim() === "" || 
    String(rawFirstName).trim() === "-" ||
    String(rawFirstName).trim() === "[unknown]"
  
  if (firstNameMissing && normalized.email) {
    const inferredFirstName = extractFirstNameFromEmail(normalized.email)
    if (inferredFirstName) {
      normalized[firstNameField] = inferredFirstName
      validation.flags.push("FIRST_NAME_INFERRED")
      validation.reasons.FIRST_NAME_INFERRED = `First name "${inferredFirstName}" extracted from email pattern`
    }
  }

  // Required field validation - company
  if (!normalized.company || String(normalized.company).trim() === "") {
    validation.valid = false
    validation.blocked = true
    validation.reasons.MISSING_COMPANY = "Company is required"
    return { normalizedData: normalized, validation }
  }

  // Blocklist validation
  if (isBlockedDomain(normalized.email)) {
    validation.blocked = true
    validation.reasons.BLOCKED_DOMAIN = "Email domain is in blocklist"
  }

  if (normalized.company && isBlockedCompany(normalized.company)) {
    validation.blocked = true
    validation.reasons.BLOCKED_COMPANY = "Company is in blocklist"
  }

  if (validation.blocked) {
    validation.valid = false
    return { normalizedData: normalized, validation }
  }

  // Deterministic name-email mismatch check
  const firstName = String(normalized.first_name || normalized.firstName || "").toLowerCase().trim()
  const lastName = String(normalized.last_name || normalized.lastName || "").toLowerCase().trim()
  const email = String(normalized.email || "").toLowerCase()
  const [emailUsername, emailDomain] = email.split("@")
  
  if (firstName.length > 2 && lastName.length > 2 && emailUsername) {
    const usernameClean = emailUsername.replace(/[^a-z]/g, "")
    const firstNameClean = firstName.replace(/[^a-z]/g, "")
    const lastNameClean = lastName.replace(/[^a-z]/g, "")
    
    const firstNameInEmail = usernameClean.includes(firstNameClean)
    const lastNameInEmail = usernameClean.includes(lastNameClean)
    const firstInitialMatch = usernameClean.startsWith(firstNameClean[0])
    
    // If we have full names but NEITHER appears in email username, flag as mismatch
    if (!firstNameInEmail && !lastNameInEmail && !firstInitialMatch) {
      validation.flags.push("NAME_EMAIL_MISMATCH")
      validation.reasons.NAME_EMAIL_MISMATCH = `Name "${firstName} ${lastName}" doesn't match email username "${emailUsername}"`
    }
  }

  // Company-domain mismatch check
  const company = String(normalized.company || "").toLowerCase().trim()
  if (company.length > 2 && emailDomain) {
    const companyClean = company.replace(/[^a-z0-9]/g, "")
    const domainBase = emailDomain.split(".")[0].replace(/[^a-z0-9]/g, "")
    
    // Check if company name appears in domain or vice versa
    const companyInDomain = domainBase.includes(companyClean.substring(0, 4)) || companyClean.includes(domainBase.substring(0, 4))
    
    // Skip check for common personal email domains
    const personalDomains = ["gmail", "yahoo", "hotmail", "outlook", "icloud", "aol", "protonmail", "mail"]
    const isPersonalEmail = personalDomains.some(d => domainBase.includes(d))
    
    if (!companyInDomain && !isPersonalEmail && companyClean.length > 3 && domainBase.length > 3) {
      validation.flags.push("COMPANY_DOMAIN_MISMATCH")
      validation.reasons.COMPANY_DOMAIN_MISMATCH = `Company "${company}" doesn't match email domain "${emailDomain}"`
    }
  }

  // Test data detection
  const testPatterns = [
    /^test[@.]/, /[@.]test\./, /example\.(com|org|net)/, /^fake/, /^demo[@.]/,
    /asdf/, /qwerty/, /12345/, /^xxx/, /^aaa/, /lorem/i, /ipsum/i,
    /@mailinator\./, /@guerrillamail\./, /@tempmail\./, /@throwaway\./
  ]
  
  if (testPatterns.some(pattern => pattern.test(email))) {
    validation.flags.push("LIKELY_TEST_DATA")
    validation.reasons.LIKELY_TEST_DATA = `Email "${email}" appears to be test/fake data`
  }
  
  // Also check for obviously fake names
  const fakeNamePatterns = ["test", "fake", "demo", "asdf", "sample", "xxx", "null", "n/a", "none"]
  if (fakeNamePatterns.some(p => firstName === p || lastName === p)) {
    validation.flags.push("LIKELY_TEST_DATA")
    validation.reasons.LIKELY_TEST_DATA = `Name "${firstName} ${lastName}" appears to be test/fake data`
  }

  // Normalization - skip fields that should not be modified
  const skipNormalization = ["email", "campaign_id", "contact_id", "account_id", "owner_id", "sequence_id"]
  Object.keys(normalized).forEach((key) => {
    if (typeof normalized[key] === "string" && !skipNormalization.includes(key)) {
      normalized[key] = normalizeText(normalized[key])
    }
  })

  // Check if we have a fullName field but missing first/last names
  if (normalized.fullName && normalized.fullName.trim()) {
    const hasFirstName =
      (normalized.firstName && normalized.firstName.trim()) || (normalized.first_name && normalized.first_name.trim())
    const hasLastName =
      (normalized.lastName && normalized.lastName.trim()) || (normalized.last_name && normalized.last_name.trim())

    if (!hasFirstName || !hasLastName) {
      const { firstName, lastName } = splitFullName(normalized.fullName)
      // Clean parsed names to remove any garbage characters
      const cleanedFirstName = cleanName(firstName)
      const cleanedLastName = cleanName(lastName)

      // Only set if the field doesn't already exist or is empty
      if (!hasFirstName) {
        if (normalized.hasOwnProperty("firstName")) {
          normalized.firstName = cleanedFirstName
        } else {
          normalized.first_name = cleanedFirstName
        }
      }

      if (!hasLastName) {
        if (normalized.hasOwnProperty("lastName")) {
          normalized.lastName = cleanedLastName
        } else {
          normalized.last_name = cleanedLastName
        }
      }

      // Add a flag to indicate automatic parsing occurred
      validation.flags.push("FULL_NAME_PARSED")
      validation.reasons.FULL_NAME_PARSED = `Automatically parsed "${normalized.fullName}" into first and last names`
    }
  }

  // Clean and title case for names - support both field naming conventions
  if (normalized.firstName || normalized.first_name) {
    const nameField = normalized.firstName ? "firstName" : "first_name"
    const cleaned = cleanName(normalized[nameField])
    normalized[nameField] = cleaned ? toTitleCase(cleaned) : ''
  }
  // Apply title case to last_name (already set to [unknown] if blank earlier)
  if (normalized.lastName || normalized.last_name) {
    const nameField = normalized.lastName ? "lastName" : "last_name"
    // Don't modify [unknown] placeholder
    if (normalized[nameField] !== "[unknown]") {
      const cleaned = cleanName(normalized[nameField])
      normalized[nameField] = cleaned ? toTitleCase(cleaned) : normalized[nameField]
    }
  }
  if (normalized.company) normalized.company = toTitleCase(normalized.company)

  // Country and state normalization - support both field naming conventions
  const countryField = normalized.country || normalized.account_hq_billing_country
  if (countryField) {
    const normalizedCountry = normalizeCountry(countryField)
    if (normalized.country) normalized.country = normalizedCountry
    if (normalized.account_hq_billing_country) normalized.account_hq_billing_country = normalizedCountry
  }

  const stateField = normalized.state || normalized.account_hq_billing_state
  if (stateField && countryField) {
    const normalizedState = normalizeState(stateField, normalizeCountry(countryField))
    if (normalized.state) normalized.state = normalizedState
    if (normalized.account_hq_billing_state) normalized.account_hq_billing_state = normalizedState
  }

  // Phone normalization - support both field naming conventions
  if (normalized.phone) {
    normalized.phone = normalizePhone(normalized.phone)
  }
  if (normalized.mobile_phone) {
    normalized.mobile_phone = normalizePhone(normalized.mobile_phone)
  }

  // Website normalization
  if (normalized.website) {
    normalized.website = normalizeWebsite(normalized.website)
  }

  return { normalizedData: normalized, validation }
}

// AI validation is now handled server-side via /api/validate-ai-batch
// This keeps the client-side validation fast and avoids API key exposure

/**
 * Analyze column mappings for potential issues
 */
export async function analyzeColumnMismatches(
  csvData: CSVData,
  columnMapping: ColumnMapping
): Promise<{
  issues: Array<{
    severity: 'error' | 'warning' | 'info'
    field: string
    message: string
    suggestion?: string
  }>
  suggestions: Record<string, string>
}> {
  const issues: Array<{
    severity: 'error' | 'warning' | 'info'
    field: string
    message: string
    suggestion?: string
  }> = []
  const suggestions: Record<string, string> = {}

  // Check for required fields
  const requiredFields = ['email']
  const mappedFields = Object.values(columnMapping).filter(Boolean)

  for (const field of requiredFields) {
    if (!mappedFields.includes(field)) {
      issues.push({
        severity: 'error',
        field,
        message: `Required field '${field}' is not mapped`,
        suggestion: 'Please map a column to this field'
      })
    }
  }

  // Check for unmapped columns
  const unmappedColumns = csvData.headers.filter(
    header => !columnMapping[header] || columnMapping[header] === null
  )

  if (unmappedColumns.length > 0) {
    issues.push({
      severity: 'info',
      field: 'unmapped',
      message: `${unmappedColumns.length} column(s) are not mapped: ${unmappedColumns.slice(0, 3).join(', ')}${unmappedColumns.length > 3 ? '...' : ''}`,
    })
  }

  return { issues, suggestions }
}
