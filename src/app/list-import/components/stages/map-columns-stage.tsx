"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin as Mapping, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react"
import { EXPECTED_FIELDS, SCORING_FIELDS } from "@/lib/validation"
import type { CSVData, ColumnMapping, ImportType } from "../list-import-agent"

interface MapColumnsStageProps {
  csvData: CSVData
  columnMapping: ColumnMapping
  importType: ImportType
  onMappingChange: (mapping: ColumnMapping) => void
  onNext: () => void
  onBack: () => void
}

export function MapColumnsStage({ csvData, columnMapping, importType, onMappingChange, onNext, onBack }: MapColumnsStageProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(columnMapping)
  const [autoMapped, setAutoMapped] = useState(false)
  const [fullNameSuggestions, setFullNameSuggestions] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [columnIssues, setColumnIssues] = useState<Array<{
    type: string
    severity: string
    description: string
    suggestion: string
    affectedRows: number
    currentColumn?: string
    suggestedColumn?: string
  }>>([])
  
  // Use appropriate fields based on import type
  const isScoring = importType === "agent_scoring"
  const fields = isScoring ? SCORING_FIELDS : EXPECTED_FIELDS
  const allFields = [...fields.required, ...fields.optional]

  // Auto-map columns on first load or when import type changes
  useEffect(() => {
    // Guard against missing data
    if (!csvData?.headers?.length) return
    
    // Get fields for current import type
    const currentFields = isScoring ? SCORING_FIELDS : EXPECTED_FIELDS
    const currentAllFields = [...currentFields.required, ...currentFields.optional]
    
    // Always re-run auto-mapping when import type or CSV data changes
    const autoMapping: ColumnMapping = {}
    const potentialFullNameColumns: string[] = []

    csvData.headers.forEach((header) => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "")

      // Find best match from the current field set (scoring vs full)
      const match = currentAllFields.find((field) => {
        const normalizedField = field.toLowerCase().replace(/[^a-z0-9]/g, "")
        return normalizedHeader === normalizedField || 
               normalizedHeader.includes(normalizedField) || 
               normalizedField.includes(normalizedHeader)
      })

      if (match) {
        autoMapping[header] = match
      }

      if (
        normalizedHeader.includes("fullname") ||
        (normalizedHeader === "name") ||
        normalizedHeader.includes("contactname") ||
        normalizedHeader.includes("personname")
      ) {
        potentialFullNameColumns.push(header)
      }
    })

    const hasMappedFirstName =
      Object.values(autoMapping).includes("first_name") || Object.values(autoMapping).includes("firstName")
    const hasMappedLastName =
      Object.values(autoMapping).includes("last_name") || Object.values(autoMapping).includes("lastName")

    if (!hasMappedFirstName && !hasMappedLastName && potentialFullNameColumns.length > 0) {
      setFullNameSuggestions(potentialFullNameColumns)
    } else {
      setFullNameSuggestions([])
    }

    setMapping(autoMapping)
    setAutoMapped(true)
  }, [csvData.headers, isScoring])

  const handleMappingChange = (csvColumn: string, targetField: string | null) => {
    const newMapping = { ...mapping }
    if (targetField === "unmapped") {
      delete newMapping[csvColumn]
    } else {
      newMapping[csvColumn] = targetField
    }
    setMapping(newMapping)
  }

  const handleNext = () => {
    onMappingChange(mapping)
    onNext()
  }

  const getMappedFields = (): string[] => {
    return Object.values(mapping).filter((field): field is string => field !== null)
  }

  const getUnmappedColumns = () => {
    return csvData.headers.filter((header) => !mapping[header])
  }

  const hasRequiredFields = () => {
    const mappedFields = getMappedFields()
    const requiredFields = fields.required
    const hasAll = requiredFields.every((field) => mappedFields.includes(field))

    console.log("[v0] Required fields check:")
    console.log("[v0] Required fields:", requiredFields)
    console.log("[v0] Mapped fields:", mappedFields)
    console.log(
      "[v0] Missing required fields:",
      requiredFields.filter((field) => !mappedFields.includes(field)),
    )
    console.log("[v0] Has all required fields:", hasAll)

    return hasAll
  }

  const getFieldDescription = (field: string) => {
    const descriptions: Record<string, string> = {
      // Required Tray fields
      email: "Contact's email address (REQUIRED)",
      last_name: "Contact's last name (REQUIRED)",
      company: "Company name (REQUIRED)",
      campaign_id: "Campaign identifier (REQUIRED)",
      campaign_status: "Campaign status, e.g., Registered, Attended (REQUIRED)",
      account_hq_billing_country: "Account billing country, e.g., US, CA (REQUIRED)",
      opted_in: "Marketing opt-in status - TRUE/FALSE or Yes/No (REQUIRED - cannot be empty)",
      
      // Optional Tray fields
      first_name: "Contact's first name",
      title: "Job title",
      website: "Company website URL",
      phone: "Primary phone number",
      mobile_phone: "Mobile/cell phone number",
      account_hq_billing_state: "Billing state/province, e.g., CA, NY",
      account_hq_billing_state_code: "Billing state code (alternate field)",
      Questions_and_Comments: "Additional questions or comments from the contact",
      subscribe_vercel_for_partners: "Vercel for Partners subscription status (TRUE/FALSE)",
      primary_product_interest: "Primary product or service the contact is interested in",
      
      // Additional optional fields
      job_function: "Job function category",
      account_hq_billing_street: "Billing street address",
      account_hq_billing_city: "Billing city",
      account_hq_billing_zipcode: "Billing ZIP/postal code",
      route_to: "Routing information",
      owner_id: "Salesforce owner identifier",
      sequence_id: "Outreach sequence identifier",
      
      // Legacy/alternate field names for backward compatibility
      firstName: "First name (use first_name instead)",
      lastName: "Last name (use last_name instead)",
      fullName: "Full name (will be auto-split into first_name/last_name)",
      country: "Country (use account_hq_billing_country instead)",
      state: "State/Province (use account_hq_billing_state instead)",
      city: "City",
      postalCode: "Postal/ZIP code",
      employeeCount: "Number of employees",
      industry: "Industry category",
      leadSource: "Lead source",
      utm_source: "UTM source parameter",
      utm_medium: "UTM medium parameter",
      utm_campaign: "UTM campaign parameter",
      utm_term: "UTM term parameter",
      utm_content: "UTM content parameter",
      notes: "Additional notes",
      status: "Lead status (use campaign_status instead)",
    }
    return descriptions[field] || ""
  }

  const applyFullNameParsing = (fullNameColumn: string) => {
    const newMapping = { ...mapping }
    newMapping[fullNameColumn] = "fullName"
    setMapping(newMapping)
    setFullNameSuggestions([])
  }

  const dismissFullNameSuggestion = (columnToRemove: string) => {
    setFullNameSuggestions((prev) => prev.filter((col) => col !== columnToRemove))
  }

  const handleSmartColumnCheck = async () => {
    if (Object.keys(mapping).length === 0) {
      alert("Please map at least some columns first")
      return
    }

    setAnalyzing(true)
    setColumnIssues([])

    try {
      const response = await fetch('/api/analyze-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData, columnMapping: mapping }),
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`Column analysis found ${result.issues.length} issues`)
      setColumnIssues(result.issues || [])
    } catch (error) {
      console.error("Smart column check failed:", error)
      alert(`Smart column check failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const dismissIssue = (index: number) => {
    setColumnIssues((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Navigation buttons at top */}
      <div className="flex justify-between sticky top-0 z-10 bg-background py-3 border-b">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Button>
        <Button onClick={handleNext} disabled={!hasRequiredFields()}>
          Continue to Validation
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mapping className="w-5 h-5" />
            Map CSV Columns to Fields
          </CardTitle>
          <CardDescription>
            Map your CSV columns to the expected contact fields. Required fields are marked with a red badge.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasRequiredFields() && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Missing Required Fields:</strong> Please map all required {isScoring ? "Scoring" : "Tray"} fields: 
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {fields.required.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {fullNameSuggestions.length > 0 && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Full Name Detected</p>
                  <p className="text-sm">
                    We found columns that appear to contain full names. Would you like to automatically parse them into
                    first and last names?
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {fullNameSuggestions.map((column) => (
                      <div key={column} className="flex items-center gap-2 bg-background rounded-md p-2 border">
                        <span className="text-sm font-medium">{column}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyFullNameParsing(column)}
                          className="h-6 px-2 text-xs"
                        >
                          Parse Names
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissFullNameSuggestion(column)}
                          className="h-6 px-1 text-xs"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}


          <div className="grid gap-4">
            {csvData.headers.map((header) => {
              const currentMapping = mapping[header]
              const sampleData = csvData.rows
                .slice(0, 3)
                .map((row) => row[csvData.headers.indexOf(header)])
                .filter(Boolean)

              return (
                <div key={header} className="border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium truncate">{header}</h4>
                        {currentMapping && fields.required.includes(currentMapping) && (
                          <Badge variant="destructive" className="text-xs shrink-0">
                            Required
                          </Badge>
                        )}
                        {currentMapping && fields.optional.includes(currentMapping) && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Optional
                          </Badge>
                        )}
                      </div>

                      {sampleData.length > 0 && (
                        <div className="text-sm text-muted-foreground overflow-hidden">
                          <span className="font-medium">Sample:</span>{" "}
                          <span className="truncate block max-w-[400px]">
                            {sampleData.slice(0, 2).join(", ")}
                            {sampleData.length > 2 && "..."}
                          </span>
                        </div>
                      )}

                      {currentMapping && currentMapping !== "unmapped" && (
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <span className="text-muted-foreground shrink-0">Maps to:</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {currentMapping}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">
                            {getFieldDescription(currentMapping).split("(")[0].trim()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 min-w-0 md:w-80">
                      <ArrowRight className="w-4 h-4 text-muted-foreground hidden md:block shrink-0" />
                      <Select
                        value={currentMapping || "unmapped"}
                        onValueChange={(value) => handleMappingChange(header, value)}
                      >
                        <SelectTrigger className="w-full overflow-hidden">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent className="max-w-[90vw] md:max-w-[450px]">
                          <SelectItem value="unmapped">
                            <span className="text-muted-foreground">Don't map this column</span>
                          </SelectItem>

                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">Required Fields</div>
                          {fields.required.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}

                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-t mt-1 sticky top-0">
                            Optional Fields
                          </div>
                          {fields.optional.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <h4 className="font-medium mb-2">Mapped Fields ({getMappedFields().length})</h4>
              <div className="flex flex-wrap gap-2">
                {getMappedFields().map((field) => (
                  <Badge 
                    key={field} 
                    variant={fields.required.includes(field) ? "destructive" : "secondary"}
                    className="text-xs max-w-full truncate"
                  >
                    {field}
                  </Badge>
                ))}
                {getMappedFields().length === 0 && (
                  <p className="text-sm text-muted-foreground">No fields mapped yet</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Unmapped Columns ({getUnmappedColumns().length})</h4>
              <div className="flex flex-wrap gap-2">
                {getUnmappedColumns().map((column) => (
                  <Badge key={column} variant="outline" className="text-xs max-w-full truncate">
                    {column}
                  </Badge>
                ))}
                {getUnmappedColumns().length === 0 && (
                  <p className="text-sm text-muted-foreground">All columns mapped</p>
                )}
              </div>
              {getUnmappedColumns().length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">Unmapped columns will be preserved as "extras"</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
