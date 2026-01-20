import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { ENV } from "@/lib/env"

// Create OpenAI client with explicit API key
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const maxDuration = 60 // Allow up to 60 seconds for AI validation batch

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

interface RowData {
  index: number
  data: Record<string, any>
}

interface AIValidationResult {
  index: number
  flags: string[]
  suggestedFixes: Record<string, any>
  reasons: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const { rows } = await request.json() as { rows: RowData[] }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Limit batch size to prevent timeouts
    const batchSize = Math.min(rows.length, 50)
    const batch = rows.slice(0, batchSize)

    console.log(`[AI_VALIDATION] Processing batch of ${batch.length} rows`)

    const results: AIValidationResult[] = []

    // Process each row in the batch
    for (const row of batch) {
      try {
        const gptResult = await getGPTValidation(row.data)
        results.push({
          index: row.index,
          ...gptResult,
        })
      } catch (error) {
        console.warn(`[AI_VALIDATION] Failed for row ${row.index}:`, error)
        results.push({
          index: row.index,
          flags: [],
          suggestedFixes: {},
          reasons: {},
        })
      }
    }

    console.log(`[AI_VALIDATION] Completed batch with ${results.length} results`)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[AI_VALIDATION_ERROR]", error)
    return NextResponse.json(
      { error: "AI validation failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

interface GPTValidationResult {
  flags: string[]
  suggestedFixes: Record<string, any>
  reasons: Record<string, string>
}

async function getGPTValidation(data: Record<string, any>): Promise<GPTValidationResult> {
  const patterns = analyzeDataPatterns(data)

  const prompt = `You are a strict data validation assistant. Analyze these contact data patterns and flag data quality issues.

CRITICAL PRIORITY: Check nameEmailAlignment.likelyMismatch - if TRUE, this is a NAME_EMAIL_MISMATCH!

STRICT RULES:
- Only use these flag codes: NAME_EMAIL_MISMATCH, COMPANY_DOMAIN_MISMATCH, LIKELY_TEST_DATA, ODD_COMPANY_FORMAT, ODD_TITLE_FORMAT
- Temperature = 0, be deterministic
- Output valid JSON only

VALIDATION CHECKS (in order of priority):

1. NAME_EMAIL_MISMATCH (MOST IMPORTANT):
   - If nameEmailAlignment.likelyMismatch is TRUE → FLAG IT
   - If nameEmailAlignment.eitherNameFound is FALSE and names are provided → FLAG IT
   - Example: firstName="Michael", lastName="Scott" but email starts with "leslie" = MISMATCH

2. COMPANY_DOMAIN_MISMATCH:
   - If companyDomainAlignment.partialMatch is FALSE and both present → FLAG IT
   - Company and email domain should have some connection

3. LIKELY_TEST_DATA:
   - Flag test@, example.com, fake patterns

4. ODD_COMPANY_FORMAT / ODD_TITLE_FORMAT:
   - Unusual formatting issues

Pattern Analysis:
${JSON.stringify(patterns, null, 2)}

IMPORTANT: If nameEmailAlignment.likelyMismatch is true, you MUST flag NAME_EMAIL_MISMATCH.

Output format:
{
  "flags": ["FLAG_CODE"],
  "suggestedFixes": {
    "fieldName": "normalizedValue"
  },
  "reasons": {
    "FLAG_CODE": "Brief explanation"
  }
}`

  const { text } = await generateText({
    model: openai(ENV.GPT_MODEL),
    prompt,
    temperature: ENV.GPT_TEMPERATURE,
    maxTokens: ENV.GPT_MAX_TOKENS,
  })

  let result: GPTValidationResult
  try {
    result = JSON.parse(text) as GPTValidationResult
  } catch (parseError) {
    console.warn("Failed to parse GPT response as JSON:", text)
    return { flags: [], suggestedFixes: {}, reasons: {} }
  }

  if (
    !Array.isArray(result.flags) ||
    typeof result.suggestedFixes !== "object" ||
    result.suggestedFixes === null ||
    typeof result.reasons !== "object" ||
    result.reasons === null
  ) {
    console.warn("Invalid GPT response structure:", result)
    return { flags: [], suggestedFixes: {}, reasons: {} }
  }

  const sanitizedReasons: Record<string, string> = {}
  Object.entries(result.reasons).forEach(([key, value]) => {
    if (typeof value === "string") {
      sanitizedReasons[key] = value
    } else {
      sanitizedReasons[key] = String(value)
    }
  })

  return {
    flags: result.flags,
    suggestedFixes: result.suggestedFixes,
    reasons: sanitizedReasons,
  }
}

function analyzeDataPatterns(data: Record<string, any>): Record<string, any> {
  const patterns: Record<string, any> = {}

  const firstName = String(data.firstName || data.first_name || "").toLowerCase().trim()
  const lastName = String(data.lastName || data.last_name || "").toLowerCase().trim()
  
  // Analyze email and NAME-EMAIL alignment
  if (data.email && typeof data.email === 'string') {
    const email = data.email.toLowerCase()
    const [username, domain] = email.split("@")
    if (username && domain) {
      // Check if names appear in email username
      const usernameClean = username.replace(/[^a-z]/g, "")
      const firstNameClean = firstName.replace(/[^a-z]/g, "")
      const lastNameClean = lastName.replace(/[^a-z]/g, "")
      
      const firstNameInEmail = firstNameClean.length > 2 && usernameClean.includes(firstNameClean)
      const lastNameInEmail = lastNameClean.length > 2 && usernameClean.includes(lastNameClean)
      const firstInitialMatch = firstNameClean.length > 0 && usernameClean.startsWith(firstNameClean[0])
      const lastInitialMatch = lastNameClean.length > 0 && usernameClean.includes(lastNameClean[0])
      
      patterns.emailPattern = {
        hasFirstLastPattern: username.includes("."),
        hasUnderscorePattern: username.includes("_"),
        hasNumbersPattern: /\d/.test(username),
        domainType: domain.includes("gmail") ? "personal" : domain.includes("test") ? "test" : "corporate",
        domainParts: domain.split(".").length,
      }
      
      // Critical: Name-email alignment check
      patterns.nameEmailAlignment = {
        firstNameInEmail,
        lastNameInEmail,
        firstInitialMatch,
        eitherNameFound: firstNameInEmail || lastNameInEmail,
        // If we have both names but NEITHER appears in email, likely mismatch
        likelyMismatch: (firstName.length > 2 && lastName.length > 2) && 
                        !firstNameInEmail && !lastNameInEmail && !firstInitialMatch,
        providedFirstName: firstName.length > 0 ? firstName.substring(0, 3) + "..." : "",
        providedLastName: lastName.length > 0 ? lastName.substring(0, 3) + "..." : "",
        emailUsernameHint: usernameClean.substring(0, 5) + "...",
      }
    }
  }

  // Analyze name patterns
  if (firstName || lastName) {
    patterns.namePattern = {
      hasFirstName: !!firstName,
      hasLastName: !!lastName,
      firstNameLength: firstName.length,
      lastNameLength: lastName.length,
      hasSpecialChars: /[^a-zA-Z\s]/.test(firstName + lastName),
      seemsRealistic: firstName.length > 1 && lastName.length > 1,
    }
  }

  // Analyze company/domain alignment
  if (data.company && data.email && typeof data.company === 'string' && typeof data.email === 'string') {
    const company = data.company.toLowerCase().replace(/[^a-z0-9]/g, "")
    const domain = data.email.split("@")[1]?.toLowerCase() || ""
    const domainBase = domain.split(".")[0]

    patterns.companyDomainAlignment = {
      exactMatch: company === domainBase,
      partialMatch: company.includes(domainBase) || domainBase.includes(company),
      similarLength: Math.abs(company.length - domainBase.length) < 3,
      bothPresent: !!company && !!domainBase,
    }
  }

  // Analyze title pattern
  if (data.title && typeof data.title === 'string') {
    patterns.titlePattern = {
      hasAbbreviations: /\b(sr|jr|mgr|dir|vp|ceo|cto|cfo)\b/i.test(data.title),
      needsCapitalization: data.title !== data.title.replace(/\b\w/g, (l: string) => l.toUpperCase()),
      length: data.title.length,
    }
  }

  return patterns
}
