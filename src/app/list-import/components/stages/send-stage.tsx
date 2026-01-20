"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Send, ArrowLeft, CheckCircle, AlertCircle, RefreshCw, RotateCcw, FileText, Sheet, Zap, RotateCw } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { sendToTray, sendToScoring } from "@/lib/tray-integration"
import type { ProcessedRow, ImportType } from "../list-import-agent"

interface SendStageProps {
  processedRows: ProcessedRow[]
  importType: ImportType
  filename: string
  googleSheetId?: string
  onBack: () => void
  onReset: () => void
}

interface SendResult {
  success: boolean
  message: string
  importId?: string
  batchesSent?: number
  totalRecords?: number
  errors?: string[]
  sentCount?: number
}

export function SendStage({ processedRows, importType, filename, googleSheetId, onBack, onReset }: SendStageProps) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [isDeferred, setIsDeferred] = useState(false)

  const selectedRows = processedRows.filter((row) => row.selected && !row.validation.blocked)
  const isGoogleSheets = !!googleSheetId
  const isScoring = importType === "agent_scoring"

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const endpoint = isScoring ? "/api/send-to-scoring" : "/api/send-to-tray"
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ processedRows: [], filename: "config-check" }),
        })

        if (!response.ok) {
          const error = await response.json()
          if (error.error?.includes("TRAY_WEBHOOK_URL")) {
            setConfigError("TRAY_WEBHOOK_URL environment variable is not configured")
          }
          if (error.error?.includes("SCORING_WEBHOOK_URL")) {
            setConfigError("SCORING_WEBHOOK_URL environment variable is not configured")
          }
        }
      } catch (error) {
        // Ignore network errors during config check
      }
    }

    checkConfig()
  }, [isScoring])

  const handleSend = async () => {
    setSending(true)
    setResult(null)
    setConfigError(null)

    try {
      const response = isScoring 
        ? await sendToScoring(selectedRows, filename, googleSheetId, isDeferred)
        : await sendToTray(selectedRows, filename, googleSheetId)
      setResult({
        success: true,
        message: response.message,
        importId: response.importId,
        batchesSent: response.batchesSent,
        totalRecords: response.totalRecords,
        sentCount: selectedRows.length,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to send to ${isScoring ? "Scoring Agent" : "Tray"}`

      if (errorMessage.includes("TRAY_WEBHOOK_URL") || errorMessage.includes("SCORING_WEBHOOK_URL")) {
        setConfigError(errorMessage)
      }

      setResult({
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      })
    } finally {
      setSending(false)
    }
  }

  const handleRetry = () => {
    setResult(null)
    handleSend()
  }

  const getSummary = () => {
    const total = processedRows.length
    const selected = selectedRows.length
    const blocked = processedRows.filter((row) => row.validation.blocked).length
    const flagged = selectedRows.filter((row) => row.validation.flags.length > 0).length

    return { total, selected, blocked, flagged }
  }

  const summary = getSummary()

  return (
    <div className="space-y-6">
      {/* Navigation buttons at top */}
      <div className="flex justify-between sticky top-0 z-10 bg-background py-3 border-b">
        <Button variant="outline" onClick={onBack} disabled={sending}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Preview
        </Button>
        {result && result.success && (
          <Button onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Start New Import
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isScoring ? <Zap className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            {isScoring ? "Send to Scoring Agent" : "Send to Tray"}
            <Badge variant="secondary" className="ml-2">
              {isGoogleSheets ? (
                <>
                  <Sheet className="w-3 h-3 mr-1" />
                  Google Sheets
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3 mr-1" />
                  CSV Upload
                </>
              )}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isScoring 
              ? "Send contacts to the scoring agent for sequence assignment"
              : "Send your cleaned contact list to the Tray webhook for processing"}
            {isGoogleSheets && " (from Google Sheets)"}
          </CardDescription>
          {isScoring && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-secondary rounded-lg">
              <Checkbox 
                id="deferred-checkbox"
                checked={isDeferred} 
                onCheckedChange={(checked) => setIsDeferred(checked === true)}
              />
              <label 
                htmlFor="deferred-checkbox" 
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Deferred list re-submission
              </label>
              <span className="text-xs text-muted-foreground ml-2">
                (Previously deferred by scoring agent)
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {configError && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{configError}</p>
                  <div className="mt-2">
                    <p className="text-sm font-medium">Configuration Error:</p>
                    <ul className="text-sm list-disc list-inside">
                      <li>{configError}</li>
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.selected}</div>
              <div className="text-sm text-muted-foreground">To Send</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{summary.flagged}</div>
              <div className="text-sm text-muted-foreground">Flagged</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{summary.blocked}</div>
              <div className="text-sm text-muted-foreground">Blocked</div>
            </div>
          </div>

          {sending && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Sending {summary.selected} contacts to {isScoring ? "Scoring Agent" : "Tray"} in batches...</span>
              </div>
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Large datasets are sent in batches of {isScoring ? 400 : 250} records to avoid size limits
              </p>
            </div>
          )}

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <AlertDescription>
                <div className="space-y-2">
                  <p>{result.message}</p>
                  {result.success && result.importId && (
                    <p className="text-sm">
                      <strong>Import ID:</strong> {result.importId}
                    </p>
                  )}
                  {result.success && result.batchesSent && (
                    <p className="text-sm">
                      <strong>Batches sent:</strong> {result.batchesSent}
                    </p>
                  )}
                  {result.success && result.totalRecords && (
                    <p className="text-sm">
                      <strong>Total records:</strong> {result.totalRecords}
                    </p>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Errors:</p>
                      <ul className="text-sm list-disc list-inside">
                        {result.errors.slice(0, 10).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {result.errors.length > 10 && <li>... and {result.errors.length - 10} more errors</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h4 className="font-medium">Payload Preview</h4>
            <div className="bg-secondary rounded-lg p-4 text-sm font-mono">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(
                  isScoring ? {
                    importId: "uuid-will-be-generated",
                    submittedBy: "user@example.com",
                    source: isGoogleSheets ? "GoogleSheets" : "ListImportAgent_Scoring",
                    batchNumber: 1,
                    totalBatches: Math.ceil(summary.selected / 400),
                    metadata: {
                      ...(isGoogleSheets ? { googleSheetId } : { originalFilename: filename }),
                      rowCounts: {
                        total: summary.total,
                        valid: summary.selected,
                        blocked: summary.blocked,
                      },
                      batchSize: Math.min(400, summary.selected),
                    },
                    records: isDeferred 
                      ? `[up to 400 scoring records per batch, each with isDeferred: true...]`
                      : `[up to 400 scoring records per batch...]`,
                  } : {
                    importId: "uuid-will-be-generated",
                    submittedBy: "user@example.com",
                    source: isGoogleSheets ? "GoogleSheets" : "ListImportAgent",
                    batchNumber: 1,
                    totalBatches: Math.ceil(summary.selected / 250),
                    metadata: {
                      ...(isGoogleSheets ? { googleSheetId } : { originalFilename: filename }),
                      rowCounts: {
                        total: summary.total,
                        clean: summary.selected - summary.flagged,
                        flagged: summary.flagged,
                        blocked: summary.blocked,
                      },
                      fixesApplied: ["Trim", "NormalizeCountry", "NormalizeState", "NameSplit"],
                      aiValidationUsed: summary.flagged > 0,
                    },
                    records: `[up to 250 contact records per batch...]`,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
            {summary.selected > (isScoring ? 400 : 250) && (
              <p className="text-sm text-muted-foreground">
                Note: Records will be sent in {Math.ceil(summary.selected / (isScoring ? 400 : 250))} batch
                {Math.ceil(summary.selected / (isScoring ? 400 : 250)) > 1 ? "es" : ""} of up to {isScoring ? 400 : 250} records each to avoid size limits.
              </p>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {!result && (
              <Button
                onClick={handleSend}
                disabled={sending || summary.selected === 0 || !!configError}
                size="lg"
                className="min-w-48"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    {isScoring ? <Zap className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {isScoring ? "Send to Scoring" : "Send to Tray"} ({summary.selected} records)
                  </>
                )}
              </Button>
            )}

            {result && !result.success && (
              <Button onClick={handleRetry} size="lg" className="min-w-48">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Send
              </Button>
            )}

            {result && result.success && (
              <Button onClick={onReset} size="lg" className="min-w-48">
                <RotateCcw className="w-4 h-4 mr-2" />
                Import Another File
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
