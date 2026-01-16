import { NextResponse, type NextRequest } from "next/server"
import { reviewEmailAction, type AnalysisResult } from "@/app/email-review/actions"

// Schema for email parsing service payloads (SendGrid, Mailgun, etc.)
interface EmailPayload {
  htmlContent?: string
  textContent?: string
  sender?: string
  subject?: string
  replyTo?: string
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key if configured
    const apiKey = request.headers.get("x-api-key")
    const expectedKey = process.env.EMAIL_INGEST_API_KEY
    
    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = (await request.json()) as EmailPayload

    if (!payload.htmlContent) {
      return NextResponse.json(
        { error: "HTML content of the email is required." },
        { status: 400 }
      )
    }

    const analysisResult: AnalysisResult = await reviewEmailAction({
      emailHtmlContent: payload.htmlContent,
      subjectLineFromHeader: payload.subject,
      replyToEmail: payload.replyTo,
    })

    console.log("Email ingested and analyzed:", {
      sender: payload.sender,
      subject: payload.subject,
      score: analysisResult.qualitativeAnalysis.overallScore,
    })

    return NextResponse.json(analysisResult, { status: 200 })
  } catch (error) {
    console.error("Error ingesting email:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to process email.", details: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Email Review Agent API - POST email HTML content for analysis",
    version: "1.0.0",
    expectedPayload: {
      htmlContent: "string (required) - The HTML content of the email",
      textContent: "string (optional) - Plain text version",
      sender: "string (optional) - Sender email address",
      subject: "string (optional) - Email subject line",
      replyTo: "string (optional) - Reply-to address",
    },
    authentication: "Set x-api-key header if EMAIL_INGEST_API_KEY is configured",
  })
}
