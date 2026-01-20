"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, Download, RefreshCw, Eye, Zap } from "lucide-react"
import { validateAndNormalizeRows } from "@/lib/validation-engine"
import type { CSVData, ColumnMapping, ProcessedRow, ImportType } from "../list-import-agent"

interface ValidateStageProps {
  csvData: CSVData
  columnMapping: ColumnMapping
  importType: ImportType
  processedRows: ProcessedRow[]
  onProcessedRowsChange: (rows: ProcessedRow[]) => void
  onNext: () => void
  onBack: () => void
}

export function ValidateStage({
  csvData,
  columnMapping,
  importType,
  processedRows,
  onProcessedRowsChange,
  onNext,
  onBack,
}: ValidateStageProps) {
  const isScoring = importType === "agent_scoring"
  const [validating, setValidating] = useState(false)
  const [validationPhase, setValidationPhase] = useState<"deterministic" | "ai">("deterministic")
  const [progress, setProgress] = useState(0)
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const [bulkApplyGPT, setBulkApplyGPT] = useState(false)

  useEffect(() => {
    if (processedRows.length === 0) {
      handleValidate()
    }
  }, [])

  const handleValidate = async () => {
    setValidating(true)
    setProgress(0)
    setValidationPhase("deterministic")

    try {
      // Step 1: Deterministic validation (client-side, fast)
      const results = await validateAndNormalizeRows(csvData, columnMapping, (current, total) => {
        setProgress((current / total) * 50) // First 50% for deterministic
      }, isScoring)

      onProcessedRowsChange(results)

      // Step 2: AI validation (server-side, batched) - only for full imports
      if (!isScoring) {
        setValidationPhase("ai")
        const nonBlockedRows = results
          .map((row, index) => ({ row, index }))
          .filter(({ row }) => !row.validation.blocked)

        if (nonBlockedRows.length > 0) {
          const AI_BATCH_SIZE = 40
          const totalBatches = Math.ceil(nonBlockedRows.length / AI_BATCH_SIZE)
          
          for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
            const batchStart = batchNum * AI_BATCH_SIZE
            const batchEnd = Math.min(batchStart + AI_BATCH_SIZE, nonBlockedRows.length)
            const batch = nonBlockedRows.slice(batchStart, batchEnd)

            try {
              const response = await fetch("/api/validate-ai-batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  rows: batch.map(({ row, index }) => ({
                    index,
                    data: row.normalized,
                  })),
                }),
              })

              if (response.ok) {
                const { results: aiResults } = await response.json()
                
                // Merge AI results back into processed rows
                aiResults.forEach((aiResult: { index: number; flags: string[]; suggestedFixes: Record<string, any>; reasons: Record<string, string> }) => {
                  const row = results[aiResult.index]
                  if (row) {
                    row.validation.flags.push(...aiResult.flags)
                    row.validation.suggestedFixes = { ...row.validation.suggestedFixes, ...aiResult.suggestedFixes }
                    row.validation.reasons = { ...row.validation.reasons, ...aiResult.reasons }
                  }
                })
                
                onProcessedRowsChange([...results])
              }
            } catch (error) {
              console.warn(`AI validation batch ${batchNum + 1} failed:`, error)
            }

            // Update progress (50-100% for AI validation)
            setProgress(50 + ((batchNum + 1) / totalBatches) * 50)
          }
        }
      }

      setProgress(100)
    } catch (error) {
      console.error("Validation failed:", error)
    } finally {
      setValidating(false)
    }
  }

  const getValidationSummary = () => {
    const total = processedRows.length
    const valid = processedRows.filter((row) => row.validation.valid && !row.validation.blocked).length
    const blocked = processedRows.filter((row) => row.validation.blocked).length
    const flagged = processedRows.filter((row) => row.validation.flags.length > 0).length
    const autoFixed = processedRows.filter(
      (row) => JSON.stringify(row.original) !== JSON.stringify(row.normalized),
    ).length

    return { total, valid, blocked, flagged, autoFixed }
  }

  const handleApplyGPTSuggestion = (rowIndex: number, field: string, value: any) => {
    const updatedRows = [...processedRows]
    updatedRows[rowIndex].normalized[field] = value
    onProcessedRowsChange(updatedRows)
  }

  const handleUnblockRow = (rowIndex: number) => {
    const updatedRows = [...processedRows]
    updatedRows[rowIndex].validation.blocked = false
    updatedRows[rowIndex].validation.valid = true
    updatedRows[rowIndex].selected = true
    // Add a flag to indicate this was manually unblocked
    if (!updatedRows[rowIndex].validation.flags.includes("MANUALLY_UNBLOCKED")) {
      updatedRows[rowIndex].validation.flags.push("MANUALLY_UNBLOCKED")
      updatedRows[rowIndex].validation.reasons.MANUALLY_UNBLOCKED = "Row was manually unblocked by user"
    }
    onProcessedRowsChange(updatedRows)
  }

  const handleFieldEdit = (rowIndex: number, field: string, value: any) => {
    const updatedRows = [...processedRows]
    updatedRows[rowIndex].normalized[field] = value
    onProcessedRowsChange(updatedRows)
  }

  const handleBulkApplyGPT = () => {
    const updatedRows = processedRows.map((row) => {
      const newNormalized = { ...row.normalized }
      Object.entries(row.validation.suggestedFixes).forEach(([field, value]) => {
        newNormalized[field] = value
      })
      return { ...row, normalized: newNormalized }
    })
    onProcessedRowsChange(updatedRows)
  }

  const downloadBlockedRows = () => {
    const blockedRows = processedRows.filter((row) => row.validation.blocked)
    const csvContent = [
      csvData.headers.join(","),
      ...blockedRows.map((row) => csvData.headers.map((header) => row.original[header] || "").join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `blocked-rows-${csvData.filename}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const summary = getValidationSummary()

  return (
    <div className="space-y-6">
      {/* Navigation buttons at top */}
      <div className="flex justify-between sticky top-0 z-10 bg-background py-3 border-b">
        <Button variant="outline" onClick={onBack} disabled={validating}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Mapping
        </Button>
        <Button onClick={onNext} disabled={validating || summary.valid === 0}>
          Continue to Preview
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Validate & Normalize Data
          </CardTitle>
          <CardDescription>
            Validate email addresses, normalize data, and get AI suggestions for improvements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validating ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>
                  {validationPhase === "deterministic" 
                    ? "Validating and normalizing data..." 
                    : "Running AI quality checks..."}
                </span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {validationPhase === "deterministic" 
                  ? `Step 1/2: Deterministic validation - ${Math.round(progress)}% complete`
                  : `Step 2/2: AI validation - ${Math.round(progress)}% complete`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">AI Validation Summary</h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>
                      • <strong>Automatic Fixes Applied:</strong> Name formatting, country/state normalization, phone
                      formatting
                    </p>
                    <p>
                      • <strong>AI Quality Checks:</strong> Name-email mismatches, test data detection, formatting
                      improvements
                    </p>
                    <p>
                      • <strong>Required Field Validation:</strong> Email, Campaign ID, Campaign Status, Billing Country
                    </p>
                    {summary.autoFixed > 0 && (
                      <p className="text-blue-600 dark:text-blue-300 font-medium">
                        ✓ {summary.autoFixed} rows automatically normalized (names, addresses, phones, websites)
                      </p>
                    )}
                    {summary.flagged > 0 && (
                      <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                        ⚠ {summary.flagged} rows flagged by AI for review (expand rows below to see suggestions)
                      </p>
                    )}
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold">{summary.total}</div>
                    <div className="text-sm text-muted-foreground">Total Rows</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{summary.valid}</div>
                    <div className="text-sm text-muted-foreground">Valid</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{summary.autoFixed}</div>
                    <div className="text-sm text-muted-foreground">Auto-fixed</div>
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

                {/* Bulk Actions */}
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="bulk-gpt" checked={bulkApplyGPT} onCheckedChange={setBulkApplyGPT} />
                      <label htmlFor="bulk-gpt" className="text-sm font-medium">
                        Apply all GPT-5 suggestions
                      </label>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleBulkApplyGPT} disabled={!bulkApplyGPT}>
                      Apply Suggestions
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={downloadBlockedRows}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Blocked
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleValidate}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Re-validate
                    </Button>
                  </div>
                </div>

                {/* Row Inspector */}
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">All Rows ({summary.total})</TabsTrigger>
                    <TabsTrigger value="autofixed">Auto-fixed ({summary.autoFixed})</TabsTrigger>
                    <TabsTrigger value="flagged">Flagged ({summary.flagged})</TabsTrigger>
                    <TabsTrigger value="blocked">Blocked ({summary.blocked})</TabsTrigger>
                    <TabsTrigger value="valid">Valid ({summary.valid})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-2">
                    {processedRows.map((row, index) => (
                      <RowInspector
                        key={index}
                        row={row}
                        index={index}
                        isExpanded={selectedRowIndex === index}
                        onToggle={() => setSelectedRowIndex(selectedRowIndex === index ? null : index)}
                        onApplySuggestion={(field, value) => handleApplyGPTSuggestion(index, field, value)}
                        onFieldEdit={(field, value) => handleFieldEdit(index, field, value)}
                      />
                    ))}
                  </TabsContent>

                  <TabsContent value="autofixed" className="space-y-2">
                    {processedRows
                      .map((row, index) => ({ row, index }))
                      .filter(({ row }) => JSON.stringify(row.original) !== JSON.stringify(row.normalized))
                      .map(({ row, index }) => (
                        <RowInspector
                          key={index}
                          row={row}
                          index={index}
                          isExpanded={selectedRowIndex === index}
                          onToggle={() => setSelectedRowIndex(selectedRowIndex === index ? null : index)}
                          onApplySuggestion={(field, value) => handleApplyGPTSuggestion(index, field, value)}
                          onFieldEdit={(field, value) => handleFieldEdit(index, field, value)}
                        />
                      ))}
                  </TabsContent>

                  <TabsContent value="flagged" className="space-y-2">
                    {processedRows
                      .map((row, index) => ({ row, index }))
                      .filter(({ row }) => row.validation.flags.length > 0)
                      .map(({ row, index }) => (
                        <RowInspector
                          key={index}
                          row={row}
                          index={index}
                          isExpanded={selectedRowIndex === index}
                          onToggle={() => setSelectedRowIndex(selectedRowIndex === index ? null : index)}
                          onApplySuggestion={(field, value) => handleApplyGPTSuggestion(index, field, value)}
                          onFieldEdit={(field, value) => handleFieldEdit(index, field, value)}
                        />
                      ))}
                  </TabsContent>

                  <TabsContent value="blocked" className="space-y-2">
                    {summary.blocked > 0 && (
                      <div className="flex justify-end mb-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const updatedRows = processedRows.map(row => {
                              if (row.validation.blocked) {
                                return {
                                  ...row,
                                  validation: {
                                    ...row.validation,
                                    blocked: false,
                                    valid: true,
                                    flags: [...row.validation.flags, "MANUALLY_UNBLOCKED"],
                                    reasons: { ...row.validation.reasons, MANUALLY_UNBLOCKED: "Row was manually unblocked by user" }
                                  },
                                  selected: true
                                }
                              }
                              return row
                            })
                            onProcessedRowsChange(updatedRows)
                          }}
                        >
                          Unblock All ({summary.blocked} rows)
                        </Button>
                      </div>
                    )}
                    {processedRows
                      .map((row, index) => ({ row, index }))
                      .filter(({ row }) => row.validation.blocked)
                      .map(({ row, index }) => (
                        <RowInspector
                          key={index}
                          row={row}
                          index={index}
                          isExpanded={selectedRowIndex === index}
                          onToggle={() => setSelectedRowIndex(selectedRowIndex === index ? null : index)}
                          onApplySuggestion={(field, value) => handleApplyGPTSuggestion(index, field, value)}
                          onFieldEdit={(field, value) => handleFieldEdit(index, field, value)}
                          onUnblock={() => handleUnblockRow(index)}
                        />
                      ))}
                  </TabsContent>

                  <TabsContent value="valid" className="space-y-2">
                    {processedRows
                      .map((row, index) => ({ row, index }))
                      .filter(({ row }) => row.validation.valid && !row.validation.blocked)
                      .map(({ row, index }) => (
                        <RowInspector
                          key={index}
                          row={row}
                          index={index}
                          isExpanded={selectedRowIndex === index}
                          onToggle={() => setSelectedRowIndex(selectedRowIndex === index ? null : index)}
                          onApplySuggestion={(field, value) => handleApplyGPTSuggestion(index, field, value)}
                          onFieldEdit={(field, value) => handleFieldEdit(index, field, value)}
                        />
                      ))}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface RowInspectorProps {
  row: ProcessedRow
  index: number
  isExpanded: boolean
  onToggle: () => void
  onApplySuggestion: (field: string, value: any) => void
  onFieldEdit: (field: string, value: any) => void
  onUnblock?: () => void
}

function RowInspector({ row, index, isExpanded, onToggle, onApplySuggestion, onFieldEdit, onUnblock }: RowInspectorProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const getStatusIcon = () => {
    if (row.validation.blocked) {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }
    if (row.validation.flags.length > 0) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  const getStatusText = () => {
    if (row.validation.blocked) return "Blocked"
    if (row.validation.flags.length > 0) return "Flagged"
    return "Valid"
  }

  const getBlockingReasons = () => {
    const reasons = []
    const fieldDisplayNames: Record<string, string> = {
      email: "Email Address",
      campaign_id: "Campaign ID",
      campaign_status: "Campaign Status",
      account_hq_billing_country: "Billing Country",
    }

    // Check for missing required fields
    const requiredFields = ["email", "campaign_id", "campaign_status", "account_hq_billing_country"]
    requiredFields.forEach((field) => {
      if (!row.normalized[field] || row.normalized[field].toString().trim() === "") {
        const displayName = fieldDisplayNames[field] || field.replace(/_/g, " ")
        reasons.push(`Missing required field: ${displayName}`)

        // Add debugging info for column mapping issues
        if (field === "campaign_id" && row.original) {
          const originalKeys = Object.keys(row.original)
          const possibleMatches = originalKeys.filter(
            (key) => key.toLowerCase().includes("campaign") || key.toLowerCase().includes("id"),
          )
          if (possibleMatches.length > 0) {
            reasons.push(`Debug: Found possible campaign fields in original data: ${possibleMatches.join(", ")}`)
          }
        }
      }
    })

    // Check for invalid email
    if (row.normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.normalized.email)) {
      reasons.push("Invalid email format")
    }

    // Check for blocked domains/companies
    if (row.normalized.email) {
      const domain = row.normalized.email.split("@")[1]?.toLowerCase()
      const blockedDomains = (process.env.DOMAIN_BLOCKLIST || "vercel.com")
        .split(",")
        .map((d) => d.trim().toLowerCase())
      if (blockedDomains.includes(domain)) {
        reasons.push(`Blocked email domain: ${domain}`)
      }
    }

    if (row.normalized.company) {
      const blockedCompanies = (process.env.COMPANY_BLOCKLIST || "Vercel").split(",").map((c) => c.trim().toLowerCase())
      if (blockedCompanies.some((blocked) => row.normalized.company.toLowerCase().includes(blocked))) {
        reasons.push(`Blocked company: ${row.normalized.company}`)
      }
    }

    // Check for duplicate emails (this would need to be passed from validation engine)
    if (row.validation.reasons?.DUPLICATE_EMAIL) {
      reasons.push("Duplicate email address in file")
    }

    return reasons
  }

  return (
    <div className="border rounded-lg">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50" onClick={onToggle}>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <span className="font-medium">Row {index + 1}</span>
          <Badge
            variant={row.validation.blocked ? "destructive" : row.validation.flags.length > 0 ? "secondary" : "default"}
          >
            {getStatusText()}
          </Badge>
          {row.validation.flags.length > 0 && (
            <div className="flex gap-1">
              {row.validation.flags.map((flag) => (
                <Badge key={flag} variant="outline" className="text-xs">
                  {flag.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {row.normalized.email || row.original.email || "No email"}
          </span>
          <Eye className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          {/* Validation Issues */}
          {(row.validation.blocked || row.validation.flags.length > 0) && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Issues:</h4>
              {row.validation.blocked && (
                <div className="space-y-2">
                  {getBlockingReasons().map((reason, idx) => (
                    <Alert key={idx} variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>{reason}</AlertDescription>
                    </Alert>
                  ))}
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>This row will not be included in the final export.</AlertDescription>
                  </Alert>
                  {onUnblock && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation()
                        onUnblock()
                      }}
                      className="mt-2"
                    >
                      Unblock Row (Include Anyway)
                    </Button>
                  )}
                </div>
              )}
              {row.validation.flags.map((flag) => (
                <Alert key={flag}>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    {typeof row.validation.reasons[flag] === "string"
                      ? row.validation.reasons[flag]
                      : flag.replace(/_/g, " ")}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Field Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Original Data:</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(row.original).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">{value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Normalized Data: <span className="text-xs text-muted-foreground font-normal">(click to edit)</span></h4>
              <div className="space-y-1 text-sm">
                {Object.entries(row.normalized).map(([key, value]) => {
                  const hasChanged = row.original[key] !== value
                  const hasSuggestion = row.validation.suggestedFixes[key] !== undefined
                  const isEditing = editingField === key

                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-muted-foreground">{key}:</span>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  onFieldEdit(key, editValue)
                                  setEditingField(null)
                                } else if (e.key === "Escape") {
                                  setEditingField(null)
                                }
                              }}
                              onBlur={() => {
                                onFieldEdit(key, editValue)
                                setEditingField(null)
                              }}
                              className="font-mono text-xs px-2 py-1 rounded border bg-background w-48"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span
                            onClick={() => {
                              setEditingField(key)
                              setEditValue(String(value || ""))
                            }}
                            className={`font-mono text-xs px-1 rounded cursor-pointer hover:ring-2 hover:ring-primary/50 ${
                              hasChanged
                                ? "text-blue-600 font-medium bg-blue-50 dark:bg-blue-950"
                                : "bg-gray-100 dark:bg-gray-800"
                            }`}
                          >
                            {value || "—"}
                          </span>
                        )}
                        {hasChanged && !isEditing && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                            Auto-fixed
                          </Badge>
                        )}
                        {hasSuggestion && !isEditing && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                            onClick={() => onApplySuggestion(key, row.validation.suggestedFixes[key])}
                          >
                            AI suggests: {row.validation.suggestedFixes[key]}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
