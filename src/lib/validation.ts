// Full List Import fields (original Tray integration)
export const EXPECTED_FIELDS = {
  // Required fields for Tray
  required: [
    "email",
    "last_name",
    "company",
    "campaign_id",
    "campaign_status",
    "account_hq_billing_country",
    "opted_in"
  ],
  // Optional fields that map to Tray headers
  optional: [
    "first_name",
    "title",
    "website",
    "phone",
    "mobile_phone",
    "account_hq_billing_state",
    "account_hq_billing_state_code",
    "Questions_and_Comments",
    "subscribe_vercel_for_partners",
    "primary_product_interest",
    // Additional optional fields
    "job_function",
    "account_hq_billing_street",
    "account_hq_billing_city",
    "account_hq_billing_zipcode",
    "route_to",
    "owner_id",
    "sequence_id",
    // Legacy/alternate field names for backward compatibility
    "firstName",
    "lastName",
    "fullName",
    "country",
    "state",
    "city",
    "postalCode",
    "employeeCount",
    "industry",
    "leadSource",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "notes",
    "status",
  ],
}

// Agent Scoring & Sequence fields
export const SCORING_FIELDS = {
  // Required fields for scoring
  required: [
    "email",
    "contact_id",
    "account_id",
  ],
  // Optional fields for scoring
  optional: [
    "first_name",
    "last_name",
    "title",
    "campaign_id",
    "campaign_name",
    "campaign_type",
    "campaign_subtype",
    "campaign_region",
    "campaign_member_status",
    "campaign_description",
    "campaign_primary_product_interest",
  ],
}

export const DOMAIN_BLOCKLIST = process.env.DOMAIN_BLOCKLIST?.split(",") || ["vercel.com"]
export const COMPANY_BLOCKLIST = process.env.COMPANY_BLOCKLIST?.split(",") || ["Vercel"]

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isBlockedDomain(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const domain = email.split("@")[1]?.toLowerCase()
  return DOMAIN_BLOCKLIST.some((blocked) => domain === blocked.toLowerCase())
}

export function isBlockedCompany(company: string): boolean {
  if (!company || typeof company !== 'string') return false
  return COMPANY_BLOCKLIST.some((blocked) => company.toLowerCase().includes(blocked.toLowerCase()))
}

export function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') return text || ''
  return text.trim().normalize("NFC")
}

/**
 * Clean up a name by removing random/garbage characters.
 * Keeps only valid name characters: letters, spaces, hyphens, apostrophes, periods.
 * Also handles common data issues like numbers, special characters, and encoding artifacts.
 */
// Placeholder values that should not be modified
const PRESERVE_VALUES = ["[unknown]", "[none]", "[n/a]", "[null]", "[empty]", "unknown", "n/a", "none"]

export function cleanName(name: string): string {
  if (!name) return name
  
  // Preserve placeholder values exactly as-is
  if (PRESERVE_VALUES.includes(name.toLowerCase().trim())) {
    return name
  }
  
  let cleaned = name.trim()
  
  // Remove common encoding artifacts and garbage
  cleaned = cleaned
    // Remove null bytes and control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Remove common encoding issues (Ã©, Ã¡, etc. - mojibake)
    .replace(/Ã[©¡íóúñü]/g, match => {
      const map: Record<string, string> = {
        'Ã©': 'é', 'Ã¡': 'á', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú', 'Ã±': 'ñ', 'Ã¼': 'ü'
      }
      return map[match] || ''
    })
    // Remove HTML entities that weren't decoded
    .replace(/&[a-z]+;/gi, '')
    .replace(/&#\d+;/g, '')
    // Remove emoji
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    // Remove other problematic Unicode ranges (symbols, dingbats)
    .replace(/[\u2600-\u26FF\u2700-\u27BF]/g, '')
  
  // Keep only valid name characters:
  // - Letters (including international: é, ñ, ü, etc.)
  // - Spaces
  // - Hyphens (for hyphenated names like Mary-Jane)
  // - Apostrophes (for names like O'Brien, D'Angelo)
  // - Periods (for Jr., Sr., etc.)
  cleaned = cleaned.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ\s\-'.]/g, '')
  
  // Clean up whitespace: collapse multiple spaces, trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  // Remove leading/trailing hyphens, apostrophes, periods
  cleaned = cleaned.replace(/^[\-'.]+|[\-'.]+$/g, '').trim()
  
  // Handle case where cleaning leaves just punctuation or empty
  if (/^[\s\-'.]*$/.test(cleaned)) {
    return ''
  }
  
  return cleaned
}

export function toTitleCase(text: string): string {
  if (!text) return text
  
  // Preserve placeholder values exactly as-is
  if (PRESERVE_VALUES.includes(text.toLowerCase().trim())) {
    return text
  }
  
  // Check if text already has mixed case - if so, assume it's correct and leave it alone
  const hasUpperCase = /[A-Z]/.test(text)
  const hasLowerCase = /[a-z]/.test(text)
  
  if (hasUpperCase && hasLowerCase) {
    // Already mixed case (e.g., "McLean", "BMW", "Crypto.com") - don't touch it!
    return text
  }
  
  // Only normalize if ALL lowercase or ALL uppercase
  const isAllLower = !hasUpperCase && hasLowerCase
  const isAllUpper = hasUpperCase && !hasLowerCase
  
  if (!isAllLower && !isAllUpper) {
    // Edge case: no letters at all, just return as-is
    return text
  }
  
  // For all-caps text, preserve known acronyms/brands
  const preserveUppercase = [
    'LLC', 'LLP', 'LP', 'PC', 'PLLC', 'PA', 'SC',
    'PLC', 'PTY', 'AB', 'AG', 'SA', 'BV', 'NV',
    'USA', 'US', 'UK', 'CEO', 'CFO', 'CTO', 'COO', 'CMO',
    'VP', 'SVP', 'EVP', 'AVP', 'IT', 'HR', 'AI', 'ML', 'API',
    'IBM', 'HP', 'AWS', 'GCP', 'SQL', 'HTML', 'CSS', 'XML', 'IV', 'III', 'II',
    'BMW', 'IBM', 'AT&T', 'T-Mobile', 'HP'
  ]
  
  // If it's a known acronym/brand in all caps, keep it
  if (isAllUpper && preserveUppercase.includes(text.toUpperCase())) {
    return text.toUpperCase()
  }
  
  // Only now apply title case (for all-lowercase or unrecognized all-uppercase)
  let result = text.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
  
  // Restore proper case for acronyms within the text
  preserveUppercase.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    result = result.replace(regex, term)
  })
  
  return result
}

export function normalizeCompanyName(company: string): string {
  if (!company) return company
  
  // Preserve placeholder values exactly as-is
  if (PRESERVE_VALUES.includes(company.toLowerCase().trim())) {
    return company
  }
  
  // Remove extra whitespace
  let normalized = company.trim().replace(/\s+/g, ' ')
  
  // Check for duplicate consecutive words (e.g., "LLC LLC" -> "LLC")
  const words = normalized.split(' ')
  const uniqueWords: string[] = []
  let prevWord = ''
  let hasDuplicates = false
  
  words.forEach(word => {
    if (word.toLowerCase() !== prevWord.toLowerCase()) {
      uniqueWords.push(word)
    } else {
      hasDuplicates = true
    }
    prevWord = word
  })
  
  normalized = uniqueWords.join(' ')
  
  // Check capitalization state
  const hasUpperCase = /[A-Z]/.test(normalized)
  const hasLowerCase = /[a-z]/.test(normalized)
  const isAllLowerCase = !hasUpperCase && hasLowerCase
  const isAllUpperCase = hasUpperCase && !hasLowerCase
  const hasMixedCase = hasUpperCase && hasLowerCase
  
  // Conservative normalization for company names:
  // ONLY normalize all-lowercase text (clearly needs fixing)
  // Leave all-uppercase alone (brands like PUMA, SPC, IKEA, NASA are correct)
  // Leave mixed-case alone (LifX, BMW, etc.)
  if (isAllLowerCase) {
    // All lowercase definitely needs fixing: "puma" -> "Puma"
    normalized = toTitleCase(normalized)
  } else if (isAllUpperCase && hasDuplicates) {
    // Exception: If we removed duplicates from all-caps, re-case it
    // e.g., "LLC LLC" -> "LLC" (already handled, no need to title case)
    // Just leave it as-is
  }
  // Otherwise: leave as-is (all-caps brands, mixed-case brands)
  
  return normalized
}

export function normalizeCountry(country: string): string {
  // Comprehensive country to ISO 3166-1 alpha-2 code mapping
  const countryMap: Record<string, string> = {
    // North America
    "united states": "US",
    "u.s.": "US",
    "u.s.a": "US",
    "usa": "US",
    "us": "US",
    "america": "US",
    "united states of america": "US",
    "canada": "CA",
    "mexico": "MX",
    
    // Europe
    "united kingdom": "GB",
    "uk": "GB",
    "great britain": "GB",
    "england": "GB",
    "britain": "GB",
    "germany": "DE",
    "deutschland": "DE",
    "france": "FR",
    "italy": "IT",
    "spain": "ES",
    "netherlands": "NL",
    "holland": "NL",
    "belgium": "BE",
    "switzerland": "CH",
    "austria": "AT",
    "poland": "PL",
    "portugal": "PT",
    "sweden": "SE",
    "norway": "NO",
    "denmark": "DK",
    "finland": "FI",
    "ireland": "IE",
    "greece": "GR",
    "czech republic": "CZ",
    "czechia": "CZ",
    "hungary": "HU",
    "romania": "RO",
    "ukraine": "UA",
    "russia": "RU",
    "russian federation": "RU",
    
    // Asia
    "china": "CN",
    "japan": "JP",
    "india": "IN",
    "singapore": "SG",
    "south korea": "KR",
    "korea": "KR",
    "hong kong": "HK",
    "taiwan": "TW",
    "thailand": "TH",
    "malaysia": "MY",
    "indonesia": "ID",
    "philippines": "PH",
    "vietnam": "VN",
    "israel": "IL",
    "united arab emirates": "AE",
    "uae": "AE",
    "saudi arabia": "SA",
    "turkey": "TR",
    
    // Oceania
    "australia": "AU",
    "new zealand": "NZ",
    
    // South America
    "brazil": "BR",
    "brasil": "BR",
    "argentina": "AR",
    "chile": "CL",
    "colombia": "CO",
    "peru": "PE",
    "venezuela": "VE",
    "ecuador": "EC",
    "uruguay": "UY",
    
    // Africa
    "south africa": "ZA",
    "nigeria": "NG",
    "egypt": "EG",
    "kenya": "KE",
    "morocco": "MA",
    "ethiopia": "ET",
    "ghana": "GH",
    
    // Caribbean & Central America
    "costa rica": "CR",
    "panama": "PA",
    "guatemala": "GT",
    "jamaica": "JM",
    "trinidad and tobago": "TT",
    "bahamas": "BS",
  }

  const normalized = country.toLowerCase().trim()
  
  // First check the mapping (handles UK → GB, etc.)
  if (countryMap[normalized]) {
    return countryMap[normalized]
  }
  
  // If it's already a valid 2-letter code, uppercase it
  if (/^[A-Z]{2}$/i.test(country.trim())) {
    return country.toUpperCase()
  }
  
  // Otherwise return original (might be a valid code we don't have mapped)
  return country.trim()
}

export function normalizeState(state: string, country: string): string {
  if (country !== "US" && country !== "CA") return state

  const usStates: Record<string, string> = {
    alabama: "AL",
    alaska: "AK",
    arizona: "AZ",
    arkansas: "AR",
    california: "CA",
    colorado: "CO",
    connecticut: "CT",
    delaware: "DE",
    florida: "FL",
    georgia: "GA",
    hawaii: "HI",
    idaho: "ID",
    illinois: "IL",
    indiana: "IN",
    iowa: "IA",
    kansas: "KS",
    kentucky: "KY",
    louisiana: "LA",
    maine: "ME",
    maryland: "MD",
    massachusetts: "MA",
    michigan: "MI",
    minnesota: "MN",
    mississippi: "MS",
    missouri: "MO",
    montana: "MT",
    nebraska: "NE",
    nevada: "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    ohio: "OH",
    oklahoma: "OK",
    oregon: "OR",
    pennsylvania: "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    tennessee: "TN",
    texas: "TX",
    utah: "UT",
    vermont: "VT",
    virginia: "VA",
    washington: "WA",
    "west virginia": "WV",
    wisconsin: "WI",
    wyoming: "WY",
  }

  const normalized = state.toLowerCase().trim()
  return usStates[normalized] || state.toUpperCase()
}

export function normalizePhone(phone: string): string {
  // Guard against non-string values
  if (!phone || typeof phone !== 'string') return phone || ''
  // Strip all punctuation except leading +
  return phone.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "")
}

export function normalizeWebsite(website: string): string {
  // Guard against non-string values
  if (!website || typeof website !== 'string') return website || ''
  if (!website.startsWith("http://") && !website.startsWith("https://")) {
    return `https://${website}`
  }
  return website
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName || typeof fullName !== 'string') return { firstName: '', lastName: '' }
  const parts = fullName.trim().split(" ")
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" }
  }

  const lastName = parts.pop() || ""
  const firstName = parts.join(" ")

  return { firstName, lastName }
}
