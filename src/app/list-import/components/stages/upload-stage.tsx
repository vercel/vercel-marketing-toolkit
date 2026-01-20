"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, AlertCircle, CheckCircle, Link, Users, Zap, ArrowRight } from "lucide-react"
import { parseCSV } from "@/lib/csv-parser"
import { ENV } from "@/lib/env"
import type { CSVData, ImportType } from "../list-import-agent"

interface UploadStageProps {
  importType: ImportType
  onImportTypeChange: (type: ImportType) => void
  onNext: (data: CSVData) => void
}

export function UploadStage({ importType, onImportTypeChange, onNext }: UploadStageProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<CSVData | null>(null)

  const [googleSheetId, setGoogleSheetId] = useState("")
  const [fetchingSheet, setFetchingSheet] = useState(false)
  const [activeTab, setActiveTab] = useState<"csv" | "sheets">("csv")
  const [dataQualityWarnings, setDataQualityWarnings] = useState<string[]>([])

  // Check for CSV data quality issues (misaligned columns, data in wrong fields)
  const checkDataQuality = (data: CSVData): string[] => {
    const warnings: string[] = []
    const headerCount = data.headers.length
    
    // Find email column index
    const emailColIndex = data.headers.findIndex(h => 
      h.toLowerCase().includes('email') && !h.toLowerCase().includes('work')
    )
    
    // Find name column indexes
    const firstNameIndex = data.headers.findIndex(h => 
      h.toLowerCase().includes('first') && h.toLowerCase().includes('name')
    )
    const lastNameIndex = data.headers.findIndex(h => 
      h.toLowerCase().includes('last') && h.toLowerCase().includes('name')
    )
    
    let misalignedRows = 0
    let suspiciousDataRows: number[] = []
    
    data.rows.forEach((row, index) => {
      // Check 1: Row has wrong number of columns (off by more than 1)
      if (Math.abs(row.length - headerCount) > 1) {
        misalignedRows++
      }
      
      // Check 2: Name fields contain obvious wrong data
      if (firstNameIndex >= 0 && row[firstNameIndex]) {
        const firstName = row[firstNameIndex]
        // Contains comma + TRUE/FALSE patterns (data bleeding)
        if (firstName.includes(',') && (firstName.includes('TRUE') || firstName.includes('FALSE'))) {
          suspiciousDataRows.push(index + 2) // +2 for header + 1-indexed
        }
        // Suspiciously long (>100 chars = probably comments field)
        if (firstName.length > 100) {
          suspiciousDataRows.push(index + 2)
        }
      }
      
      if (lastNameIndex >= 0 && row[lastNameIndex]) {
        const lastName = row[lastNameIndex]
        if (lastName.includes(',') && (lastName.includes('TRUE') || lastName.includes('FALSE'))) {
          suspiciousDataRows.push(index + 2)
        }
      }
      
      // Check 3: Email column contains non-email data
      if (emailColIndex >= 0 && row[emailColIndex]) {
        const emailValue = row[emailColIndex]
        // If "email" field doesn't contain @ but contains comma, it's misaligned
        if (!emailValue.includes('@') && emailValue.includes(',')) {
          suspiciousDataRows.push(index + 2)
        }
      }
    })
    
    // Remove duplicates
    suspiciousDataRows = [...new Set(suspiciousDataRows)]
    
    if (misalignedRows > 0) {
      warnings.push(`${misalignedRows} row(s) have incorrect column count (expected ${headerCount} columns)`)
    }
    
    if (suspiciousDataRows.length > 0) {
      const rowList = suspiciousDataRows.slice(0, 5).join(', ')
      const more = suspiciousDataRows.length > 5 ? ` and ${suspiciousDataRows.length - 5} more` : ''
      warnings.push(`Rows ${rowList}${more} appear to have data in wrong columns (unescaped commas detected)`)
    }
    
    if (warnings.length > 0) {
      warnings.push('⚠️ Your CSV may have formatting issues. Re-export from Excel/Google Sheets to fix.')
    }
    
    return warnings
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (!uploadedFile) return

    setError(null)
    setFile(uploadedFile)

    const maxSizeBytes = ENV.MAX_FILE_MB * 1024 * 1024
    if (uploadedFile.size > maxSizeBytes) {
      setError(`File size exceeds ${ENV.MAX_FILE_MB}MB limit`)
      return
    }

    if (!uploadedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file")
      return
    }

    setParsing(true)

    try {
      const content = await uploadedFile.text()
      const parsed = parseCSV(content)

      if (parsed.rows.length === 0) {
        setError("CSV file contains no data rows")
        return
      }

      const csvData: CSVData = {
        headers: parsed.headers,
        rows: parsed.rows,
        filename: uploadedFile.name,
      }

      // Check for data quality issues
      const warnings = checkDataQuality(csvData)
      setDataQualityWarnings(warnings)

      setParsedData(csvData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file")
    } finally {
      setParsing(false)
    }
  }, [])

  const handleFetchGoogleSheet = async () => {
    if (!googleSheetId.trim()) {
      setError("Please enter a Google Sheet ID or URL")
      return
    }

    setError(null)
    setFetchingSheet(true)

    try {
      const response = await fetch("/api/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleSheetId: googleSheetId.trim() }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || "Failed to fetch Google Sheet")
        return
      }

      const csvData: CSVData = {
        headers: result.data.headers,
        rows: result.data.rows,
        filename: `${result.data.sheetName} (${result.data.sheetId})`,
        googleSheetId: result.data.sheetId,
      }

      // Check for data quality issues
      const warnings = checkDataQuality(csvData)
      setDataQualityWarnings(warnings)

      setParsedData(csvData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Google Sheet")
    } finally {
      setFetchingSheet(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled: parsing,
  })

  const handleNext = () => {
    if (parsedData) {
      onNext(parsedData)
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation button at top */}
      {parsedData && (
        <div className="flex justify-end sticky top-0 z-10 bg-background py-3 border-b">
          <Button onClick={handleNext} size="lg">
            Continue to Column Mapping
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Import Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Select Import Type
          </CardTitle>
          <CardDescription>
            Choose the type of import you want to perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => onImportTypeChange("full_list")}
              className={`p-6 rounded-lg border-2 text-left transition-all ${
                importType === "full_list"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${importType === "full_list" ? "bg-primary/10" : "bg-secondary"}`}>
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Full List Import</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Import contacts with full validation, AI-powered data cleaning, and send to Tray for processing.
              </p>
              <div className="mt-3 text-xs text-muted-foreground">
                Required: email, last_name, company, campaign_id, campaign_status, country, opted_in
              </div>
            </button>

            <button
              onClick={() => onImportTypeChange("agent_scoring")}
              className={`p-6 rounded-lg border-2 text-left transition-all ${
                importType === "agent_scoring"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${importType === "agent_scoring" ? "bg-primary/10" : "bg-secondary"}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Agent Scoring & Sequence</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Import contacts for scoring agent to assign to sequences. Minimal validation, faster processing.
              </p>
              <div className="mt-3 text-xs text-muted-foreground">
                Required: email, contact_id, account_id
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Upload CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                } ${parsing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  {parsing ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Parsing CSV file...</p>
                      <Progress value={undefined} className="w-48" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {isDragActive ? "Drop your CSV file here" : "Drag & drop your CSV file here"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or click to browse files (max {ENV.MAX_FILE_MB}MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
          </div>
            {/* </TabsContent>

            <TabsContent value="sheets" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    For Google Sheets, make sure the sheet is shared as "Anyone with the link can view" for public
                    access.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="google-sheet-id">Google Sheet ID or URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="google-sheet-id"
                      placeholder="Enter Google Sheet ID or paste the full URL"
                      value={googleSheetId}
                      onChange={(e) => setGoogleSheetId(e.target.value)}
                      disabled={fetchingSheet}
                    />
                    <Button onClick={handleFetchGoogleSheet} disabled={fetchingSheet || !googleSheetId.trim()}>
                      {fetchingSheet ? (
                        <>
                          <Progress value={undefined} className="w-4 h-4 mr-2" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <Link className="w-4 h-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste the Google Sheet URL or just the sheet ID from the URL
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs> */}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {file && !error && (
            <div className="mt-4 p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                {parsedData && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>
            </div>
          )}

          {dataQualityWarnings.length > 0 && parsedData && (
            <Alert variant="destructive" className="mt-4 bg-amber-50 dark:bg-amber-950/20 border-amber-500/50">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="font-medium mb-2">⚠️ CSV Quality Issues Detected</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {dataQualityWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
                <div className="mt-3 text-sm font-medium">
                  You can continue, but many rows may be blocked. It's recommended to re-export your CSV with proper formatting.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {parsedData && (
            <div className="mt-4 space-y-4">
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  Successfully loaded {parsedData.rows.length} rows with {parsedData.headers.length} columns
                  {parsedData.googleSheetId && " from Google Sheets"}
                </AlertDescription>
              </Alert>

              <div className="bg-secondary rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Preview (first 3 rows):</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {parsedData.headers.map((header, i) => (
                          <th key={i} className="text-left p-2 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.rows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-border/50">
                          {parsedData.headers.map((_, j) => (
                            <td key={j} className="p-2 text-muted-foreground">
                              {row[j] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
