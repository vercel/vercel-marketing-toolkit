"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, ArrowLeft, ArrowRight, Download } from "lucide-react"
import type { ProcessedRow } from "../list-import-agent"

interface PreviewStageProps {
  processedRows: ProcessedRow[]
  onProcessedRowsChange: (rows: ProcessedRow[]) => void
  onNext: () => void
  onBack: () => void
}

export function PreviewStage({ processedRows, onProcessedRowsChange, onNext, onBack }: PreviewStageProps) {
  const [filterType, setFilterType] = useState<"all" | "clean" | "flagged" | "autofixed">("all")
  
  // Sync local selection state from processedRows
  const selectedRows = new Set(
    processedRows.map((row, index) => (row.selected ? index : -1)).filter((i) => i >= 0)
  )

  // Helper to check if a row has any auto-fixes (original !== normalized)
  const hasAutoFixes = (row: ProcessedRow): boolean => {
    return Object.keys(row.normalized).some((key) => {
      const original = row.original[key]
      const normalized = row.normalized[key]
      return original != null && normalized != null && original !== normalized
    })
  }

  const cleanRows = processedRows.filter((row) => !row.validation.blocked && row.validation.flags.length === 0)
  const flaggedRows = processedRows.filter((row) => !row.validation.blocked && row.validation.flags.length > 0)
  const autoFixedRows = processedRows.filter((row) => !row.validation.blocked && hasAutoFixes(row))
  const selectedCleanRows = cleanRows.filter((_, index) => {
    const originalIndex = processedRows.findIndex((r) => r === cleanRows[index])
    return selectedRows.has(originalIndex)
  })
  const selectedFlaggedRows = flaggedRows.filter((_, index) => {
    const originalIndex = processedRows.findIndex((r) => r === flaggedRows[index])
    return selectedRows.has(originalIndex)
  })

  const handleRowToggle = (index: number) => {
    const updatedRows = processedRows.map((row, i) => {
      if (i === index) {
        return { ...row, selected: !row.selected }
      }
      return row
    })
    onProcessedRowsChange(updatedRows)
  }

  const handleSelectAll = (rowType: "all" | "clean" | "flagged" | "autofixed") => {
    let targetRows: ProcessedRow[]
    if (rowType === "all") {
      targetRows = [...cleanRows, ...flaggedRows]
    } else if (rowType === "clean") {
      targetRows = cleanRows
    } else if (rowType === "flagged") {
      targetRows = flaggedRows
    } else {
      targetRows = autoFixedRows
    }
    
    const targetIndexes = new Set(
      targetRows.map((row) => processedRows.findIndex((r) => r === row))
    )

    const updatedRows = processedRows.map((row, i) => {
      if (targetIndexes.has(i)) {
        return { ...row, selected: true }
      }
      return row
    })
    onProcessedRowsChange(updatedRows)
  }

  const handleDeselectAll = (rowType: "all" | "clean" | "flagged" | "autofixed") => {
    let targetRows: ProcessedRow[]
    if (rowType === "all") {
      targetRows = [...cleanRows, ...flaggedRows]
    } else if (rowType === "clean") {
      targetRows = cleanRows
    } else if (rowType === "flagged") {
      targetRows = flaggedRows
    } else {
      targetRows = autoFixedRows
    }
    
    const targetIndexes = new Set(
      targetRows.map((row) => processedRows.findIndex((r) => r === row))
    )

    const updatedRows = processedRows.map((row, i) => {
      if (targetIndexes.has(i)) {
        return { ...row, selected: false }
      }
      return row
    })
    onProcessedRowsChange(updatedRows)
  }

  const downloadFlaggedCSV = () => {
    // Download ONLY flagged rows (not blocked) so users can fix them and re-import
    const flaggedProcessedRows = processedRows.filter(
      (row) => row.validation.flags.length > 0 && !row.validation.blocked
    )
    
    if (flaggedProcessedRows.length === 0) {
      alert("No flagged records to download. All records are either clean or blocked.")
      return
    }
    
    // Use exact Tray headers
    const headers = [
      "email",
      "first_name",
      "last_name",
      "company",
      "title",
      "website",
      "phone",
      "mobile_phone",
      "account_hq_billing_state",
      "account_hq_billing_country",
      "campaign_id",
      "campaign_status",
      "Questions_and_Comments",
      "opted_in",
      "subscribe_vercel_for_partners",
      "flags",
      "flag_reasons"
    ]
    
    const csvContent = [
      headers.join(","),
      ...flaggedProcessedRows.map((row) => {
        return headers.map((header) => {
          // Support both naming conventions for input
          let value = ""
          if (header === "first_name") {
            value = row.normalized.first_name || row.normalized.firstName || ""
          } else if (header === "last_name") {
            value = row.normalized.last_name || row.normalized.lastName || ""
          } else if (header === "account_hq_billing_state") {
            value = row.normalized.account_hq_billing_state || row.normalized.state || row.normalized.account_hq_billing_state_code || ""
          } else if (header === "account_hq_billing_country") {
            value = row.normalized.account_hq_billing_country || row.normalized.country || ""
          } else if (header === "campaign_status") {
            value = row.normalized.campaign_status || row.normalized.status || ""
          } else if (header === "flags") {
            value = row.validation.flags.join("; ")
          } else if (header === "flag_reasons") {
            value = Object.values(row.validation.reasons).join("; ")
          } else {
            value = row.normalized[header] || ""
          }
          
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
            value = `"${value.replace(/"/g, '""')}"`
          }
          
          return value
        }).join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `flagged-records-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getFilteredRows = () => {
    switch (filterType) {
      case "clean":
        return cleanRows.map((row) => ({
          row,
          originalIndex: processedRows.findIndex((r) => r === row),
        }))
      case "flagged":
        return flaggedRows.map((row) => ({
          row,
          originalIndex: processedRows.findIndex((r) => r === row),
        }))
      case "autofixed":
        return autoFixedRows.map((row) => ({
          row,
          originalIndex: processedRows.findIndex((r) => r === row),
        }))
      default:
        return processedRows
          .filter((row) => !row.validation.blocked)
          .map((row, index) => ({
            row,
            originalIndex: processedRows.findIndex((r) => r === row),
          }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation buttons at top */}
      <div className="flex justify-between sticky top-0 z-10 bg-background py-3 border-b">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Validation
        </Button>
        <Button onClick={onNext} disabled={selectedRows.size === 0}>
          Send to Tray ({selectedRows.size} records)
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Preview Clean Data
          </CardTitle>
          <CardDescription>
            Review and select the records you want to send to Tray. Flagged rows are included by default but can be
            deselected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-fit grid-cols-4">
                <TabsTrigger value="all">All Valid ({cleanRows.length + flaggedRows.length})</TabsTrigger>
                <TabsTrigger value="clean">Clean Data ({cleanRows.length})</TabsTrigger>
                <TabsTrigger value="flagged">Flagged ({flaggedRows.length})</TabsTrigger>
                <TabsTrigger value="autofixed">Auto-fixed ({autoFixedRows.length})</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadFlaggedCSV}
                  disabled={flaggedRows.length === 0}
                  title={flaggedRows.length === 0 ? "No flagged records to download" : `Download ${flaggedRows.length} flagged record(s) for review`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Flagged ({flaggedRows.length})
                </Button>
              </div>
            </div>

            <TabsContent value="all" className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">{selectedRows.size}</span> of{" "}
                  <span className="font-medium">{cleanRows.length + flaggedRows.length}</span> records selected
                </div>
                <div className="flex gap-2">
                  <Button variant="default" size="sm" onClick={() => handleSelectAll("all")}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeselectAll("all")}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {getFilteredRows().map(({ row, originalIndex }) => (
                  <PreviewRow
                    key={originalIndex}
                    row={row}
                    index={originalIndex}
                    isSelected={selectedRows.has(originalIndex)}
                    onToggle={() => handleRowToggle(originalIndex)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="clean" className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">{selectedCleanRows.length}</span> of{" "}
                  <span className="font-medium">{cleanRows.length}</span> clean records selected
                </div>
                <div className="flex gap-2">
                  <Button variant="default" size="sm" onClick={() => handleSelectAll("clean")}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeselectAll("clean")}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {cleanRows.map((row) => {
                  const originalIndex = processedRows.findIndex((r) => r === row)
                  return (
                    <PreviewRow
                      key={originalIndex}
                      row={row}
                      index={originalIndex}
                      isSelected={selectedRows.has(originalIndex)}
                      onToggle={() => handleRowToggle(originalIndex)}
                    />
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="flagged" className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">{selectedFlaggedRows.length}</span> of{" "}
                  <span className="font-medium">{flaggedRows.length}</span> flagged records selected
                </div>
                <div className="flex gap-2">
                  <Button variant="default" size="sm" onClick={() => handleSelectAll("flagged")}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeselectAll("flagged")}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {flaggedRows.map((row) => {
                  const originalIndex = processedRows.findIndex((r) => r === row)
                  return (
                    <PreviewRow
                      key={originalIndex}
                      row={row}
                      index={originalIndex}
                      isSelected={selectedRows.has(originalIndex)}
                      onToggle={() => handleRowToggle(originalIndex)}
                    />
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="autofixed" className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">{autoFixedRows.filter((row) => selectedRows.has(processedRows.findIndex((r) => r === row))).length}</span> of{" "}
                  <span className="font-medium">{autoFixedRows.length}</span> auto-fixed records selected
                </div>
                <div className="flex gap-2">
                  <Button variant="default" size="sm" onClick={() => handleSelectAll("autofixed")}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeselectAll("autofixed")}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {autoFixedRows.map((row) => {
                  const originalIndex = processedRows.findIndex((r) => r === row)
                  return (
                    <PreviewRow
                      key={originalIndex}
                      row={row}
                      index={originalIndex}
                      isSelected={selectedRows.has(originalIndex)}
                      onToggle={() => handleRowToggle(originalIndex)}
                    />
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

interface PreviewRowProps {
  row: ProcessedRow
  index: number
  isSelected: boolean
  onToggle: () => void
}

function PreviewRow({ row, index, isSelected, onToggle }: PreviewRowProps) {
  // Support both naming conventions
  const firstName = row.normalized.first_name || row.normalized.firstName || ""
  const lastName = row.normalized.last_name || row.normalized.lastName || ""
  const city = row.normalized.city || row.normalized.account_hq_billing_city || ""
  const state = row.normalized.state || row.normalized.account_hq_billing_state || ""
  const country = row.normalized.country || row.normalized.account_hq_billing_country || ""
  
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-secondary/50">
      <Checkbox checked={isSelected} onCheckedChange={onToggle} />

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="font-medium">{row.normalized.email}</div>
          <div className="text-muted-foreground">
            {firstName} {lastName}
          </div>
        </div>
        <div>
          <div className="font-medium">{row.normalized.company || "—"}</div>
          <div className="text-muted-foreground">{row.normalized.title || "—"}</div>
        </div>
        <div>
          <div>{row.normalized.phone || row.normalized.mobile_phone || "—"}</div>
          <div className="text-muted-foreground">
            {city && state
              ? `${city}, ${state}`
              : country || "—"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {row.validation.flags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {row.validation.flags.map((flag) => (
                <Badge 
                  key={flag} 
                  variant="secondary" 
                  className="text-xs max-w-[140px] truncate"
                  title={flag.replace(/_/g, " ")}
                >
                  {flag.replace(/_/g, " ")
                    .replace("LIKELY NAME EMAIL MISMATCH", "Name/Email?")
                    .replace("NAME EMAIL MISMATCH", "Name/Email")
                    .replace("FIELD TYPE MISMATCH", "Wrong Field")
                    .replace("COMPANY DOMAIN MISMATCH", "Company/Domain")
                    .replace("LIKELY TEST DATA", "Test Data")
                    .replace("INCONSISTENT CAMPAIGN ID", "Different Campaign ID")
                    .replace("MISSING CAMPAIGN ID", "No Campaign ID")
                    .replace("MISSING CAMPAIGN STATUS", "No Status")
                    .replace("MISSING BILLING COUNTRY", "No Country")
                    .replace("MISSING OPTED IN", "No Opt-In")}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
