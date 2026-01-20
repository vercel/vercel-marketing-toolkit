"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadStage } from "./stages/upload-stage"
import { MapColumnsStage } from "./stages/map-columns-stage"
import { ValidateStage } from "./stages/validate-stage"
import { PreviewStage } from "./stages/preview-stage"
import { SendStage } from "./stages/send-stage"
import { VercelLogo } from "./vercel-logo"

export type ImportStage = "upload" | "map" | "validate" | "preview" | "send"
export type ImportType = "full_list" | "agent_scoring"

export interface CSVData {
  headers: string[]
  rows: string[][]
  filename: string
  googleSheetId?: string // Added optional Google Sheet ID
}

export interface ColumnMapping {
  [csvColumn: string]: string | null
}

export interface ValidationResult {
  valid: boolean
  blocked: boolean
  flags: string[]
  suggestedFixes: Record<string, any>
  reasons: Record<string, string>
  normalizedData: Record<string, any>
}

export interface ProcessedRow {
  original: Record<string, any>
  normalized: Record<string, any>
  validation: ValidationResult
  selected: boolean
}

const stages: { id: ImportStage; title: string; description: string }[] = [
  { id: "upload", title: "Upload", description: "Upload your CSV file" },
  { id: "map", title: "Map Columns", description: "Map CSV columns to fields" },
  { id: "validate", title: "Validate", description: "Validate and normalize data" },
  { id: "preview", title: "Preview", description: "Review cleaned data" },
  { id: "send", title: "Send", description: "Send to webhook" },
]

export function ListImportAgent() {
  const [currentStage, setCurrentStage] = useState<ImportStage>("upload")
  const [importType, setImportType] = useState<ImportType>("full_list")
  const [csvData, setCsvData] = useState<CSVData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([])

  const getCurrentStageIndex = () => stages.findIndex((stage) => stage.id === currentStage)
  
  const handleReset = () => {
    setCurrentStage("upload")
    setImportType("full_list")
    setCsvData(null)
    setColumnMapping({})
    setProcessedRows([])
  }

  const renderStage = () => {
    switch (currentStage) {
      case "upload":
        return (
          <UploadStage
            importType={importType}
            onImportTypeChange={setImportType}
            onNext={(data) => {
              setCsvData(data)
              setCurrentStage("map")
            }}
          />
        )
      case "map":
        return (
          <MapColumnsStage
            csvData={csvData!}
            columnMapping={columnMapping}
            importType={importType}
            onMappingChange={setColumnMapping}
            onNext={() => setCurrentStage("validate")}
            onBack={() => setCurrentStage("upload")}
          />
        )
      case "validate":
        return (
          <ValidateStage
            csvData={csvData!}
            columnMapping={columnMapping}
            importType={importType}
            processedRows={processedRows}
            onProcessedRowsChange={setProcessedRows}
            onNext={() => setCurrentStage("preview")}
            onBack={() => setCurrentStage("map")}
          />
        )
      case "preview":
        return (
          <PreviewStage
            processedRows={processedRows}
            onProcessedRowsChange={setProcessedRows}
            onNext={() => setCurrentStage("send")}
            onBack={() => setCurrentStage("validate")}
          />
        )
      case "send":
        return (
          <SendStage
            processedRows={processedRows}
            importType={importType}
            filename={csvData?.filename || ""}
            googleSheetId={csvData?.googleSheetId}
            onBack={() => setCurrentStage("preview")}
            onReset={handleReset}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset}
              className="hover:opacity-70 transition-opacity cursor-pointer"
              title="Reset and start over"
            >
              <VercelLogo size={20} className="text-muted-foreground" />
            </button>
            <CardTitle className="text-lg font-medium">Import Progress</CardTitle>
          </div>
          <CardDescription className="text-sm">Follow these steps to import your contact list safely</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {stages.map((stage, index) => {
              const isActive = stage.id === currentStage
              const isCompleted = index < getCurrentStageIndex()

              return (
                <div key={stage.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        isActive
                          ? "bg-foreground text-background shadow-sm"
                          : isCompleted
                            ? "bg-green-600 text-white"
                            : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </div>
                    <div className="mt-3 text-center">
                      <div className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {stage.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{stage.description}</div>
                    </div>
                  </div>
                  {index < stages.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-6 transition-colors ${isCompleted ? "bg-green-600" : "bg-border"}`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Stage */}
      {renderStage()}
    </div>
  )
}
