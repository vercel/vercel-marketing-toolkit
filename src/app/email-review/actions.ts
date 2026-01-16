"use server"

import { generateObject, generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

// Use Vercel AI Gateway when VERCEL_AI_GATEWAY is set, otherwise direct OpenAI
const useGateway = process.env.USE_VERCEL_AI_GATEWAY === "true"

const openai = createOpenAI({
  baseURL: useGateway 
    ? "https://gateway.ai.vercel.app/v1" 
    : undefined, // undefined = use default OpenAI URL
  apiKey: process.env.OPENAI_API_KEY,
})
import { z } from "zod"
import * as cheerio from "cheerio"

// --- Zod Schemas ---
const UtmIssueSchema = z.object({
  link: z.string(),
  message: z.string(),
})
type UtmIssue = z.infer<typeof UtmIssueSchema>

const TypoSchema = z.object({
  error: z.string().describe("The specific typo found."),
  suggestion: z.string().describe("The suggested correction."),
  line: z.number().describe("The line number where the typo was found."),
})

const GrammarErrorSchema = z.object({
  error: z.string().describe("The specific grammatical error found."),
  suggestion: z.string().describe("The suggested correction."),
  line: z.number().describe("The line number where the error was found."),
})

const QualitativeAnalysisSchema = z.object({
  typos: z.array(TypoSchema).describe("A list of any typos found."),
  grammarErrors: z.array(GrammarErrorSchema).describe("A list of any grammatical errors found."),
  toneAnalysis: z.string().describe("Analysis of the email's tone and Vercel brand alignment."),
  suggestions: z.array(z.string()).describe("Actionable suggestions for improvement."),
  overallScore: z.number().min(0).max(100).describe("Overall quality score from 0 to 100."),
  subjectLineAnalysis: z.string().nullable().describe("Analysis of the subject line."),
  previewTextAnalysis: z.string().nullable().describe("Analysis of the preview text."),
  paragraphSpacingAnalysis: z.string().describe("Assessment of paragraph spacing."),
  signatureToFromNameMatch: z.object({
    match: z.enum(["yes", "no", "not_applicable", "insufficient_data"]),
    details: z.string().nullable(),
  }),
})
type QualitativeAnalysis = z.infer<typeof QualitativeAnalysisSchema>

// --- Image Analysis Types ---
interface ImageInfo {
  src: string
  alt: string | null
  width: string | null
  height: string | null
  estimatedSize: "small" | "medium" | "large" | "unknown"
  issues: string[]
}

// --- Accessibility Check Types ---
interface AccessibilityIssue {
  type: "missing_alt" | "empty_alt" | "generic_alt" | "missing_lang" | "low_contrast_risk"
  element: string
  message: string
  severity: "error" | "warning"
}

// --- Email Client Compatibility Types ---
interface CompatibilityIssue {
  client: string
  issue: string
  cssProperty?: string
  context?: string // The actual CSS/code snippet that triggered the issue
  location?: string // Where it was found (inline style, style tag, etc.)
  severity: "error" | "warning"
}

// --- Link Validation Types ---
interface LinkValidation {
  url: string
  text: string
  status: "ok" | "error" | "redirect" | "timeout" | "skipped"
  statusCode?: number
  redirectUrl?: string
  error?: string
}

// --- Technical Checks Type ---
interface TechnicalChecks {
  utmIssues: UtmIssue[]
  stagingLinkIssues: UtmIssue[]
  unsubscribeLink: { found: boolean; text?: string; href?: string }
  privacyPolicyLink: { found: boolean; text?: string; href?: string }
  darkModeImageCheck: { imagesPotentiallyMissingDarkModeVariant?: string[]; details: string }
  addToCalendarLinks: { text?: string; href: string }[]
  // New fields
  images: ImageInfo[]
  totalImages: number
  imagesWithoutAlt: number
  accessibilityIssues: AccessibilityIssue[]
  compatibilityIssues: CompatibilityIssue[]
  subjectLineLength: number
  previewTextLength: number
  // Link validation
  linkValidation: LinkValidation[]
  totalLinks: number
  brokenLinks: number
  allLinksResolved: boolean
}

// --- Final Analysis Result ---
export interface AnalysisResult {
  technicalChecks: TechnicalChecks
  qualitativeAnalysis: QualitativeAnalysis
  extracted: {
    senderName?: string
    fromEmail?: string
    fullFromAddress?: string
    replyToEmail?: string
    subjectLine?: string
    subjectLineSource?: "From <title> Tag" | "From API Header" | "Not Available"
    previewText?: string
    rawHtml?: string // For preview
  }
  error?: string
}

interface ReviewEmailArgs {
  emailHtmlContent: string
  senderName?: string
  fromEmail?: string
  replyToEmail?: string
  subjectLineFromHeader?: string
}

// --- Problematic CSS for email clients ---
const EMAIL_CLIENT_CSS_ISSUES: { pattern: RegExp; clients: string[]; issue: string }[] = [
  { pattern: /flex|flexbox/i, clients: ["Outlook"], issue: "Flexbox not supported" },
  { pattern: /grid/i, clients: ["Outlook", "Gmail"], issue: "CSS Grid not fully supported" },
  { pattern: /position:\s*absolute/i, clients: ["Outlook"], issue: "Absolute positioning unreliable" },
  { pattern: /position:\s*fixed/i, clients: ["Outlook", "Gmail"], issue: "Fixed positioning not supported" },
  { pattern: /background-image/i, clients: ["Outlook"], issue: "Background images need VML fallback" },
  { pattern: /max-width/i, clients: ["Outlook"], issue: "max-width may need MSO conditional" },
  { pattern: /border-radius/i, clients: ["Outlook 2007-2019"], issue: "Border radius not supported" },
  { pattern: /box-shadow/i, clients: ["Outlook"], issue: "Box shadow not supported" },
  { pattern: /@media/i, clients: ["Gmail App"], issue: "Media queries stripped in Gmail App" },
  { pattern: /rgba?\(/i, clients: ["Outlook 2007-2013"], issue: "RGBA colors may not render" },
]

// --- Generic alt text patterns ---
const GENERIC_ALT_PATTERNS = [
  /^image$/i,
  /^photo$/i,
  /^picture$/i,
  /^img$/i,
  /^banner$/i,
  /^logo$/i,
  /^\s*$/,
  /^untitled$/i,
  /^screenshot$/i,
]

// --- Main Server Action ---
export async function reviewEmailAction({
  emailHtmlContent,
  senderName,
  fromEmail,
  replyToEmail,
  subjectLineFromHeader,
}: ReviewEmailArgs): Promise<AnalysisResult> {
  if (!emailHtmlContent) {
    throw new Error("Email HTML content is required.")
  }

  const $ = cheerio.load(emailHtmlContent)
  
  // --- Extract text with line numbers for AI ---
  const $bodyClone = $("body").clone()
  $bodyClone.find("p, li, h1, h2, h3, h4, h5, h6, div, tr, table, blockquote").after("%%LINE_BREAK%%")
  $bodyClone.find("br").replaceWith("%%LINE_BREAK%%")

  let rawEmailText = $bodyClone.text()
  rawEmailText = rawEmailText.replace(/%%LINE_BREAK%%/g, "\n")
  rawEmailText = rawEmailText.replace(/[ \t]+\n/g, "\n")
  rawEmailText = rawEmailText.replace(/\n[ \t]+/g, "\n")
  rawEmailText = rawEmailText.replace(/\n{2,}/g, "\n").trim()

  const emailTextWithLines = rawEmailText
    .split("\n")
    .map((line, index) => `(Line ${index + 1}): ${line.trim()}`)
    .filter((lineContent) => lineContent.substring(lineContent.indexOf(":") + 2).trim().length > 0)
    .join("\n")

  // --- Extract subject line ---
  const htmlTitle = $("title").first().text().trim() || undefined
  let finalSubjectLine = subjectLineFromHeader
  let subjectLineSource: AnalysisResult["extracted"]["subjectLineSource"] = "From API Header"

  if (!finalSubjectLine && htmlTitle) {
    finalSubjectLine = htmlTitle
    subjectLineSource = "From <title> Tag"
  } else if (!finalSubjectLine) {
    subjectLineSource = "Not Available"
  }

  // --- Extract preview text ---
  const previewText =
    $('div[style*="display:none"], div[style*="display: none"], div.preheader, span.preheader, .preview-text')
      .first().text().trim() || undefined

  // --- Analyze images ---
  const images: ImageInfo[] = []
  const accessibilityIssues: AccessibilityIssue[] = []

  $("img").each((_i, el) => {
    const src = $(el).attr("src") || ""
    const alt = $(el).attr("alt")
    const width = $(el).attr("width") || null
    const height = $(el).attr("height") || null
    
    const issues: string[] = []

    // Check for missing alt
    if (alt === undefined) {
      issues.push("Missing alt attribute")
      accessibilityIssues.push({
        type: "missing_alt",
        element: src.substring(0, 50),
        message: "Image is missing alt attribute",
        severity: "error",
      })
    } else if (alt === "") {
      // Empty alt is OK for decorative images but flag it
      accessibilityIssues.push({
        type: "empty_alt",
        element: src.substring(0, 50),
        message: "Empty alt - OK if decorative, otherwise needs description",
        severity: "warning",
      })
    } else if (GENERIC_ALT_PATTERNS.some(p => p.test(alt))) {
      issues.push("Generic/unhelpful alt text")
      accessibilityIssues.push({
        type: "generic_alt",
        element: alt,
        message: `Alt text "${alt}" is too generic`,
        severity: "warning",
      })
    }

    // Estimate image size based on dimensions
    let estimatedSize: ImageInfo["estimatedSize"] = "unknown"
    if (width && height) {
      const w = parseInt(width)
      const h = parseInt(height)
      const pixels = w * h
      if (pixels < 10000) estimatedSize = "small"
      else if (pixels < 100000) estimatedSize = "medium"
      else estimatedSize = "large"
      
      if (pixels > 250000) {
        issues.push("Large image - may slow load time")
      }
    }

    // Check for missing dimensions (causes layout shift)
    if (!width || !height) {
      issues.push("Missing width/height - may cause layout shift")
    }

    images.push({ src, alt: alt ?? null, width, height, estimatedSize, issues })
  })

  // --- Check for language attribute ---
  const htmlLang = $("html").attr("lang")
  if (!htmlLang) {
    accessibilityIssues.push({
      type: "missing_lang",
      element: "<html>",
      message: "Missing lang attribute on <html> element",
      severity: "warning",
    })
  }

  // --- Check email client compatibility ---
  const compatibilityIssues: CompatibilityIssue[] = []
  
  // Check <style> tags
  const styleTags = $("style")
  styleTags.each((_i, el) => {
    const styleText = $(el).text()
    EMAIL_CLIENT_CSS_ISSUES.forEach(({ pattern, clients, issue }) => {
      const match = styleText.match(pattern)
      if (match) {
        // Find the rule containing this match
        const lines = styleText.split('\n')
        let contextLine = ""
        for (const line of lines) {
          if (pattern.test(line)) {
            contextLine = line.trim().substring(0, 80)
            break
          }
        }
        clients.forEach(client => {
          // Avoid duplicates
          if (!compatibilityIssues.some(c => c.client === client && c.issue === issue && c.location === "style tag")) {
            compatibilityIssues.push({
              client,
              issue,
              cssProperty: match[0],
              context: contextLine || match[0],
              location: "<style> tag",
              severity: "warning",
            })
          }
        })
      }
    })
  })

  // Check inline styles
  $("[style]").each((_i, el) => {
    const inlineStyle = $(el).attr("style") || ""
    const tagName = el.tagName?.toLowerCase() || "element"
    
    EMAIL_CLIENT_CSS_ISSUES.forEach(({ pattern, clients, issue }) => {
      const match = inlineStyle.match(pattern)
      if (match) {
        clients.forEach(client => {
          compatibilityIssues.push({
            client,
            issue,
            cssProperty: match[0],
            context: inlineStyle.substring(0, 60) + (inlineStyle.length > 60 ? "..." : ""),
            location: `<${tagName}> inline style`,
            severity: "warning",
          })
        })
      }
    })
  })

  // --- Analyze links ---
  const utmIssuesArray: UtmIssue[] = []
  const stagingLinkIssuesArray: UtmIssue[] = []
  const addToCalendarLinks: { text?: string; href: string }[] = []
  const allLinks: { href: string; text: string }[] = []

  $("a").each((_i, el) => {
    const href = $(el).attr("href")
    const linkText = $(el).text().trim().substring(0, 50)
    if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
      // Track all unique links for validation
      if (!allLinks.some(l => l.href === href)) {
        allLinks.push({ href, text: linkText || "[no text]" })
      }

      try {
        const url = new URL(href)
        const params = url.searchParams

        if (params.get("utm_medium") !== "email") {
          utmIssuesArray.push({ link: href, message: "Missing or incorrect 'utm_medium=email'." })
        }
        if (params.get("utm_source") !== "inflection") {
          utmIssuesArray.push({ link: href, message: "Missing or incorrect 'utm_source=inflection'." })
        }
        if (!params.get("utm_campaign")) {
          utmIssuesArray.push({ link: href, message: "Missing or empty 'utm_campaign' parameter." })
        }

        const stagingPatterns = [/staging\./i, /dev\./i, /test\./i, /\/staging\//i, /vercel\.app/i]
        if (stagingPatterns.some((pattern) => pattern.test(href))) {
          if (!href.includes("vercel.com") && !href.includes("nextjs.org")) {
            stagingLinkIssuesArray.push({ link: href, message: "Link may contain a staging identifier." })
          }
        }

        if (href.endsWith(".ics") || linkText.toLowerCase().includes("add to calendar") || href.includes("addevent.com")) {
          addToCalendarLinks.push({ text: linkText, href })
        }
      } catch {
        // Ignore invalid URLs
      }
    }
  })

  // --- Validate links (ping for 200 OK) ---
  const linkValidation: LinkValidation[] = []
  
  // Limit to first 20 unique links to avoid timeout
  const linksToValidate = allLinks.slice(0, 20)
  
  const validateLink = async (link: { href: string; text: string }): Promise<LinkValidation> => {
    // Skip mailto, tel, and other non-http links
    if (!link.href.startsWith("http")) {
      return {
        url: link.href,
        text: link.text,
        status: "skipped",
        error: "Non-HTTP link",
      }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(link.href, {
        method: "HEAD", // Use HEAD to avoid downloading full content
        redirect: "manual", // Don't follow redirects automatically
        signal: controller.signal,
        headers: {
          "User-Agent": "Vercel-Email-QA-Bot/1.0",
        },
      })

      clearTimeout(timeoutId)

      const statusCode = response.status

      // Check for redirects (3xx)
      if (statusCode >= 300 && statusCode < 400) {
        const redirectUrl = response.headers.get("location") || undefined
        return {
          url: link.href,
          text: link.text,
          status: "redirect",
          statusCode,
          redirectUrl,
        }
      }

      // Check for success (2xx)
      if (statusCode >= 200 && statusCode < 300) {
        return {
          url: link.href,
          text: link.text,
          status: "ok",
          statusCode,
        }
      }

      // Any other status is an error
      return {
        url: link.href,
        text: link.text,
        status: "error",
        statusCode,
        error: `HTTP ${statusCode}`,
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return {
          url: link.href,
          text: link.text,
          status: "timeout",
          error: "Request timed out (5s)",
        }
      }
      return {
        url: link.href,
        text: link.text,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Validate all links in parallel
  const validationResults = await Promise.all(linksToValidate.map(validateLink))
  linkValidation.push(...validationResults)

  // Calculate summary stats
  const brokenLinks = linkValidation.filter(l => l.status === "error" || l.status === "timeout").length
  const allLinksResolved = brokenLinks === 0 && linkValidation.length > 0

  // --- Find unsubscribe & privacy links ---
  let unsubscribeLinkDetails = { found: false, text: undefined as string | undefined, href: undefined as string | undefined }
  $('a:contains("unsubscribe"), a:contains("manage preferences"), a:contains("subscription settings")').each((_i, el) => {
    unsubscribeLinkDetails = { found: true, text: $(el).text(), href: $(el).attr("href") }
    return false
  })

  let privacyPolicyLinkDetails = { found: false, text: undefined as string | undefined, href: undefined as string | undefined }
  $('a:contains("privacy policy"), a:contains("Privacy Policy")').each((_i, el) => {
    privacyPolicyLinkDetails = { found: true, text: $(el).text(), href: $(el).attr("href") }
    return false
  })

  // --- Build technical checks result ---
  const technicalChecksResult: TechnicalChecks = {
    utmIssues: utmIssuesArray,
    stagingLinkIssues: stagingLinkIssuesArray,
    unsubscribeLink: unsubscribeLinkDetails,
    privacyPolicyLink: privacyPolicyLinkDetails,
    darkModeImageCheck: {
      imagesPotentiallyMissingDarkModeVariant: [],
      details: "Manual verification recommended for dark mode compatibility.",
    },
    addToCalendarLinks,
    images,
    totalImages: images.length,
    imagesWithoutAlt: images.filter(img => img.alt === null).length,
    accessibilityIssues,
    compatibilityIssues,
    subjectLineLength: finalSubjectLine?.length ?? 0,
    previewTextLength: previewText?.length ?? 0,
    // Link validation
    linkValidation,
    totalLinks: allLinks.length,
    brokenLinks,
    allLinksResolved,
  }

  const fullFromAddress = senderName && fromEmail ? `"${senderName}" <${fromEmail}>` : fromEmail || senderName || undefined

  const extractedData = {
    senderName,
    fromEmail,
    fullFromAddress,
    replyToEmail,
    subjectLine: finalSubjectLine,
    subjectLineSource: finalSubjectLine ? subjectLineSource : "Not Available",
    previewText,
    rawHtml: emailHtmlContent, // For preview
  }

  // --- VERCEL STYLE GUIDE (from Marketing Toolkit) ---
  const VERCEL_STYLE_GUIDE = `
VERCEL STYLE GUIDE PRINCIPLES:

1. KEEP SENTENCES SHORT
- Write short, declarative sentences
- Every time you use a comma, consider using a period instead
- Remove unnecessary "filler" words
- A great sentence is a good sentence made shorter

2. VARY SENTENCE LENGTH
- Use short sentences for impact
- Use longer sentences to build momentum
- Mix phrasing to avoid sounding robotic

3. WRITE LIKE YOU SPEAK
- Avoid corporate jargon and marketing fluff
- Use simple, shorter words (facilitate → help, utilize → use, commence → start)
- Don't get fancy. Get to the point faster.
- Sentences can start with "but" and "and" (but don't overdo it)

4. BE SPECIFIC AND BENEFIT-DRIVEN
- Back statements with facts or data
- Use "best", "bigger", "better", "faster" only with context (e.g., "6× faster deploys")
- Lead with the benefit, not the feature
- Be precise. Avoid vague claims.
- Examples from Vercel:
  * "One endpoint, all your models" (not "Unified AI gateway")
  * "Helping teams ship 6× faster" (not "Faster deployments")
  * "Fast, scalable, and reliable" (three concrete benefits)

5. BE CONFIDENT BUT CLIPPED
- Avoid phrases like "I think," "maybe," "could" that soften impact
- Be bold, but also humble
- Know the difference between confidence and arrogance
- Keep tone professional and matter-of-fact

6. HIGHLIGHT CUSTOMERS & COMMUNITY
- Feature customer thoughts and words
- Use customer quotes to show value versus telling
- Let customers do the talking

7. SAY "YOU" MORE THAN "WE"
- Make it about the reader, not us
- Less "we did" and more "you can"
- Empathize with their challenges

8. USE ACTIVE VOICE
- Active voice is more interesting and direct
- Avoid passive constructions with "has", "was", "by", or words ending in "-ed"
- Test: If adding "...by monkeys" makes sense, you're using passive voice

9. USE POSITIVE PHRASING
- Say what something IS rather than what it ISN'T
- Positive tone is uplifting and enabling
- Swap confrontational conjunctions for positive ones

10. NEVER USE EXCLAMATION POINTS
- Vercel does not use exclamation points in company messaging
- Ever. Period. No exceptions.
- Keep tone calm, confident, and factual
- Let the substance of your message create impact, not punctuation
- Replace excitement with clear, concrete benefits

11. MAKE IT SCANNABLE
- Use bullet points and lists liberally
- Break long paragraphs into shorter ones
- Lead with the most important information
- Use clear hierarchies (headers, subheaders)
- One idea per paragraph

12. ACTION-ORIENTED LANGUAGE
- Start with strong verbs: Build, Deploy, Scale, Protect, Monitor
- Examples from Vercel docs:
  * "Deploy at the speed of AI" (not "AI-powered deployments")
  * "Automate away repetition" (not "Automation tools")
  * "Extend and automate workflows" (not "Workflow extensions")
- Make the reader the hero doing the action

13. TECHNICAL PRECISION WITHOUT JARGON
- Use technical terms when they're the clearest option
- Define or contextualize complex concepts immediately
- Avoid buzzwords and marketing speak
- Examples from Vercel:
  * "Fluid compute, active CPU, and provisioned memory" (specific, not "powerful infrastructure")
  * "Incremental Static Regeneration" (precise term, then explain what it does)

14. STRIP QUALIFIERS AND HEDGING
- Remove: "basically", "essentially", "probably", "might", "should"
- Vercel states facts directly
- Wrong: "This will basically help you deploy faster"
- Right: "Deploy 6× faster"

15. COLON CLARITY
- Vercel uses colons to connect concepts clearly
- Format: "Thing: What it does"
- Examples:
  * "Bot Management: Scalable bot protection"
  * "Functions: API routes with Fluid compute"
  * "Draft Mode: View your unpublished CMS content"
`

  // --- AI Analysis with fallback to cheaper model ---
  let qualitativeAnalysisResult: QualitativeAnalysis
  let usedModel = "gpt-4o"

  const aiPrompt = `You are an Email Quality Assurance agent for Vercel. Analyze the following email content with extreme attention to detail using the official Vercel Style Guide.

${VERCEL_STYLE_GUIDE}

---

The provided email body text has line numbers like "(Line X): text". When reporting typos or grammar errors, you MUST reference these line numbers and provide suggested corrections.

Be careful NOT to flag:
- Code snippets or technical terms (like API names, CLI commands)
- List markers or structural HTML elements
- Intentional stylistic choices that align with guidelines

---

Email Content for Analysis:
Subject: ${finalSubjectLine || "Not Provided"} (${technicalChecksResult.subjectLineLength} characters)
Preview Text: ${previewText || "Not Provided"} (${technicalChecksResult.previewTextLength} characters)
From: ${fullFromAddress || "Sender Not Provided"}
Reply-To: ${replyToEmail || "Not Provided"}

Email Body Text (with line numbers):
---
${emailTextWithLines}
---

Perform these comprehensive checks using the Vercel Style Guide above:

1. **Typos & Spelling**: Find all typos. Include line number and suggested correction for each.

2. **Grammar Errors**: Find all grammatical issues. Include line number and suggested correction for each. Pay special attention to:
   - Passive voice (suggest active voice rewrites)
   - Wordy constructions (suggest concise alternatives)
   - Qualifier/hedging words to remove (basically, essentially, probably, might)
   - Exclamation points (flag ALL of them - Vercel never uses these)

3. **Tone Analysis**: Evaluate against ALL 15 Vercel style principles. Be SPECIFIC about:
   - Sentence length variation and brevity
   - Active voice consistency
   - Second person usage ("you" vs "we")
   - Specificity and benefit-driven language
   - Confidence without arrogance
   - Positive phrasing (what IS vs what ISN'T)
   - Any exclamation points (instant flag)
   - Scanability and structure
   - Action-oriented verbs
   - Technical precision
   - Qualifiers that should be stripped

4. **Suggestions**: Provide actionable improvements as an array of strings. Format each as:
   - What to change: "Original phrase" → "Improved phrase"
   - Prioritize: passive to active, wordy to concise, feature to benefit
   - Include specific line numbers where applicable

5. **Overall Score (0-100)**: Score based on:
   - Grammar/spelling correctness (15 points)
   - Active voice & second person usage (15 points)
   - Clarity & conciseness (15 points)
   - Action-oriented language (15 points)
   - No exclamation points (10 points - any exclamation point = 0)
   - Scanability & structure (15 points)
   - Specific & benefit-driven content (15 points)

6. **Subject Line Analysis**: Is it clear, concise, action-oriented, and benefit-driven? Ideal: 30-50 chars (current: ${technicalChecksResult.subjectLineLength}). Check for exclamation points.

7. **Preview Text Analysis**: Does it complement the subject, add value, and create curiosity? Ideal: 40-90 chars (current: ${technicalChecksResult.previewTextLength}).

8. **Paragraph Spacing**: Assess against "Make it Scannable" principle. Are paragraphs short? One idea per paragraph? Clear hierarchy?

9. **Signature Match**: Does the signature match "${fullFromAddress || "N/A"}"?
`

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not configured")
    }

    // Try with gpt-4o first
    try {
      const { object } = await generateObject({
        model: openai("gpt-4o"),
        schema: QualitativeAnalysisSchema,
        prompt: aiPrompt,
      })
      qualitativeAnalysisResult = object
      usedModel = "gpt-4o"
    } catch (primaryError) {
      // If primary model fails (quota, rate limit, etc.), fallback to gpt-4o-mini
      console.log("Primary model failed, falling back to gpt-4o-mini:", primaryError)
      
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: QualitativeAnalysisSchema,
        prompt: aiPrompt,
      })
      qualitativeAnalysisResult = object
      usedModel = "gpt-4o-mini"
    }
  } catch (error) {
    // Return partial results with error message
    const errorMessage = error instanceof Error ? error.message : "AI analysis failed"
    
    return {
      technicalChecks: technicalChecksResult,
      qualitativeAnalysis: {
        typos: [],
        grammarErrors: [],
        toneAnalysis: "AI analysis unavailable - check API key configuration",
        suggestions: ["Configure OPENAI_API_KEY in environment variables"],
        overallScore: 0,
        subjectLineAnalysis: null,
        previewTextAnalysis: null,
        paragraphSpacingAnalysis: "AI analysis unavailable",
        signatureToFromNameMatch: { match: "insufficient_data", details: null },
      },
      extracted: extractedData,
      error: errorMessage,
    }
  }

  console.log(`AI analysis completed using model: ${usedModel}`)

  // Bypass signature check for no-reply emails
  if (replyToEmail === "no-reply@vercel.com") {
    qualitativeAnalysisResult.signatureToFromNameMatch = {
      match: "not_applicable",
      details: "Signature check bypassed for no-reply address.",
    }
  }

  return {
    technicalChecks: technicalChecksResult,
    qualitativeAnalysis: qualitativeAnalysisResult,
    extracted: extractedData,
  }
}

// --- Optimize Email HTML Action ---
export interface OptimizeResult {
  optimizedHtml: string
  changes: string[]
  error?: string
}

export async function optimizeEmailHtmlAction(emailHtml: string): Promise<OptimizeResult> {
  if (!emailHtml) {
    return {
      optimizedHtml: "",
      changes: [],
      error: "Email HTML content is required.",
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      optimizedHtml: "",
      changes: [],
      error: "OPENAI_API_KEY environment variable is not configured",
    }
  }

  const $ = cheerio.load(emailHtml)

  // Extract all text content with their selectors for replacement
  interface TextNode {
    selector: string
    originalText: string
    index: number
  }

  const textNodes: TextNode[] = []
  let nodeIndex = 0

  // Find all text-containing elements (excluding script, style, etc.)
  $("p, h1, h2, h3, h4, h5, h6, li, td, th, span, a, div, button, strong, em, b, i").each((_i, el) => {
    const $el = $(el)
    // Only get direct text, not from children
    const directText = $el.contents().filter(function() {
      return this.type === 'text'
    }).text().trim()
    
    if (directText && directText.length > 3) {
      textNodes.push({
        selector: `node_${nodeIndex}`,
        originalText: directText,
        index: nodeIndex,
      })
      nodeIndex++
    }
  })

  // Also get full text blocks for context
  const fullTextContent = textNodes.map(n => `[${n.selector}]: ${n.originalText}`).join("\n")

  const VERCEL_STYLE_GUIDE = `
VERCEL STYLE GUIDE PRINCIPLES:

1. KEEP SENTENCES SHORT - Write short, declarative sentences. Fewer commas, more periods.

2. VARY SENTENCE LENGTH - Mix short and long for rhythm.

3. WRITE LIKE YOU SPEAK - Avoid jargon. Use simple words (facilitate → help, utilize → use).

4. BE SPECIFIC AND BENEFIT-DRIVEN - Use facts/data. "6× faster deploys" not just "faster".

5. BE CONFIDENT BUT CLIPPED - No "I think," "maybe," "could". Be direct.

6. SAY "YOU" MORE THAN "WE" - Make it about the reader.

7. USE ACTIVE VOICE - "Deploy your app" not "Your app will be deployed".

8. USE POSITIVE PHRASING - Say what IS, not what ISN'T.

9. NEVER USE EXCLAMATION POINTS - Ever. No exceptions.

10. MAKE IT SCANNABLE - Short paragraphs, bullets, clear hierarchy.

11. ACTION-ORIENTED LANGUAGE - Start with verbs: Build, Deploy, Scale.

12. TECHNICAL PRECISION - Use clear technical terms, avoid buzzwords.

13. STRIP QUALIFIERS - Remove "basically", "essentially", "probably", "might".

14. COLON CLARITY - "Thing: What it does" format.
`

  const optimizePrompt = `You are a copy editor applying Vercel's style guide to email content.

${VERCEL_STYLE_GUIDE}

Below is the email text content with node identifiers. Rewrite EACH piece of text to follow the style guide while preserving the meaning.

RULES:
- Keep text approximately the same length (don't expand significantly)
- Preserve any product names, company names, URLs, or technical terms exactly
- Remove all exclamation points
- Convert passive voice to active voice
- Make language more direct and action-oriented
- Use "you" more than "we"
- Strip qualifiers (basically, essentially, probably)
- Keep the same general structure

INPUT TEXT:
${fullTextContent}

OUTPUT FORMAT:
Return a JSON object with two fields:
1. "rewrites": An object mapping each node selector to its rewritten text
   Example: { "node_0": "Rewritten text here", "node_1": "Another rewritten text" }
2. "changes": An array of strings describing the key changes made
   Example: ["Converted passive voice to active in node_0", "Removed exclamation point in node_3"]

Only include nodes that were actually changed. If text is already good, don't include it.
Respond with ONLY valid JSON, no markdown.`

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: optimizePrompt,
    })

    // Parse the response
    let result: { rewrites: Record<string, string>; changes: string[] }
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedText = text.trim()
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7)
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3)
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3)
      }
      result = JSON.parse(cleanedText.trim())
    } catch {
      console.error("Failed to parse AI response:", text)
      return {
        optimizedHtml: emailHtml,
        changes: [],
        error: "Failed to parse AI optimization response",
      }
    }

    // Apply rewrites to HTML
    let optimizedHtml = emailHtml
    const appliedChanges: string[] = result.changes || []

    // We need to do text replacement carefully
    for (const node of textNodes) {
      const rewrite = result.rewrites[node.selector]
      if (rewrite && rewrite !== node.originalText) {
        // Escape special regex characters in the original text
        const escapedOriginal = node.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // Replace first occurrence only
        const regex = new RegExp(escapedOriginal, 'g')
        optimizedHtml = optimizedHtml.replace(regex, rewrite)
      }
    }

    return {
      optimizedHtml,
      changes: appliedChanges,
    }
  } catch (error) {
    // Try with fallback model
    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: optimizePrompt,
      })

      let result: { rewrites: Record<string, string>; changes: string[] }
      try {
        let cleanedText = text.trim()
        if (cleanedText.startsWith("```json")) {
          cleanedText = cleanedText.slice(7)
        } else if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.slice(3)
        }
        if (cleanedText.endsWith("```")) {
          cleanedText = cleanedText.slice(0, -3)
        }
        result = JSON.parse(cleanedText.trim())
      } catch {
        return {
          optimizedHtml: emailHtml,
          changes: [],
          error: "Failed to parse AI optimization response",
        }
      }

      let optimizedHtml = emailHtml
      for (const node of textNodes) {
        const rewrite = result.rewrites[node.selector]
        if (rewrite && rewrite !== node.originalText) {
          const escapedOriginal = node.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(escapedOriginal, 'g')
          optimizedHtml = optimizedHtml.replace(regex, rewrite)
        }
      }

      return {
        optimizedHtml,
        changes: result.changes || [],
      }
    } catch (fallbackError) {
      const errorMessage = error instanceof Error ? error.message : "AI optimization failed"
      return {
        optimizedHtml: emailHtml,
        changes: [],
        error: errorMessage,
      }
    }
  }
}
