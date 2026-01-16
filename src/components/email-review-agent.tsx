"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { Card, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { reviewEmailAction, optimizeEmailHtmlAction, type AnalysisResult, type OptimizeResult } from "@/app/email-review/actions"
import {
  Mail,
  ClipboardPaste,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Info,
  Link2,
  Eye,
  Type,
  PenLine,
  CalendarDays,
  Moon,
  FileText,
  User,
  Reply,
  Heading1,
  SpellCheck,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Shield,
  Zap,
  Image as ImageIcon,
  Accessibility,
  Monitor,
  AlertCircle,
  Globe,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Wand2,
} from "lucide-react"

type CheckStatus = "passed" | "failed" | "warning" | "info" | "manual"

// Score ring component
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 120 }) => {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  const getColor = () => {
    if (score >= 80) return "#50E3C2"
    if (score >= 60) return "#F5A623"
    return "#FF4444"
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#262626" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
      </div>
    </div>
  )
}

// Character count indicator
const CharacterCount: React.FC<{ current: number; min: number; max: number; label: string }> = ({
  current,
  min,
  max,
  label,
}) => {
  const isGood = current >= min && current <= max
  const isTooShort = current < min && current > 0
  const isTooLong = current > max

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span
        className={`font-mono ${
          current === 0
            ? "text-muted-foreground"
            : isGood
            ? "text-success"
            : isTooShort
            ? "text-warning"
            : isTooLong
            ? "text-error"
            : "text-muted-foreground"
        }`}
      >
        {current} chars
      </span>
      <span className="text-muted-foreground">
        (ideal: {min}-{max})
      </span>
      {isGood && current > 0 && <CheckCircle2 className="h-3 w-3 text-success" />}
      {isTooShort && <AlertTriangle className="h-3 w-3 text-warning" />}
      {isTooLong && <XCircle className="h-3 w-3 text-error" />}
    </div>
  )
}

// Checklist item component
const ChecklistItem: React.FC<{
  title: string
  status: CheckStatus
  details?: React.ReactNode
  icon?: React.ReactNode
  expandable?: boolean
  badge?: string
}> = ({ title, status, details, icon, expandable = true, badge }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusConfig = {
    passed: { bg: "bg-success/5", border: "border-success/20", text: "text-success", Icon: CheckCircle2 },
    failed: { bg: "bg-error/5", border: "border-error/20", text: "text-error", Icon: XCircle },
    warning: { bg: "bg-warning/5", border: "border-warning/20", text: "text-warning", Icon: AlertTriangle },
    manual: { bg: "bg-muted", border: "border-border", text: "text-muted-foreground", Icon: Eye },
    info: { bg: "bg-muted", border: "border-border", text: "text-muted-foreground", Icon: Info },
  }

  const config = statusConfig[status]
  const StatusIcon = config.Icon

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} transition-all duration-200 hover:border-ring`}>
      <button
        onClick={() => expandable && setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
        disabled={!expandable || !details}
      >
        <div className="flex items-center gap-3">
          <div className={`${config.text}`}>{icon || <StatusIcon className="h-5 w-5" />}</div>
          <span className="font-medium text-foreground">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">{badge}</span>
          )}
        </div>
        {expandable && details && (
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
          />
        )}
      </button>
      {isExpanded && details && (
        <div className="px-4 pb-4 pt-0">
          <div className="pl-8 text-sm text-muted-foreground border-l border-border ml-2.5">
            <div className="pl-4">{details}</div>
          </div>
      </div>
      )}
    </div>
  )
}

// Stat card for dashboard
const StatCard: React.FC<{
  title: string
  value: string
  status: "success" | "warning" | "error" | "neutral"
  icon: React.ReactNode
  subtitle?: string
}> = ({ title, value, status, icon, subtitle }) => {
  const statusColors = {
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
    neutral: "text-foreground",
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-ring">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className={`text-lg font-semibold ${statusColors[status]}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}

// Email options
const VERCEL_EMAIL_OPTIONS = [
  "ship@vercel.com",
  "no-reply@vercel.com",
  "events@vercel.com",
  "product@vercel.com",
  "partners@vercel.com",
]

export function EmailReviewAgent() {
  const [emailHtml, setEmailHtml] = useState("")
  const [senderName, setSenderName] = useState("Vercel")
  const [fromEmail, setFromEmail] = useState("ship@vercel.com")
  const [replyToEmail, setReplyToEmail] = useState("no-reply@vercel.com")
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeResultTab, setActiveResultTab] = useState<"analysis" | "preview" | "optimize">("analysis")
  
  // Optimize state
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizeCopied, setOptimizeCopied] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!emailHtml.trim()) return

    startTransition(async () => {
      const result = await reviewEmailAction({
        emailHtmlContent: emailHtml,
        senderName: senderName || undefined,
        fromEmail: fromEmail || undefined,
        replyToEmail: replyToEmail || undefined,
      })
      setAnalysisResult(result)
    })
  }

  const hasTypos = (analysisResult?.qualitativeAnalysis.typos.length ?? 0) > 0
  const hasGrammarErrors = (analysisResult?.qualitativeAnalysis.grammarErrors.length ?? 0) > 0
  const hasContentIssues = hasTypos || hasGrammarErrors
  const hasUtmIssues = (analysisResult?.technicalChecks.utmIssues.length ?? 0) > 0
  const hasAccessibilityIssues = (analysisResult?.technicalChecks.accessibilityIssues.length ?? 0) > 0
  const hasCompatibilityIssues = (analysisResult?.technicalChecks.compatibilityIssues.length ?? 0) > 0

  const handleOptimize = async () => {
    if (!emailHtml.trim()) return
    
    setIsOptimizing(true)
    setOptimizeResult(null)
    
    try {
      const result = await optimizeEmailHtmlAction(emailHtml)
      setOptimizeResult(result)
      setActiveResultTab("optimize")
    } catch (error) {
      setOptimizeResult({
        optimizedHtml: "",
        changes: [],
        error: error instanceof Error ? error.message : "Optimization failed",
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleCopyOptimized = () => {
    if (optimizeResult?.optimizedHtml) {
      navigator.clipboard.writeText(optimizeResult.optimizedHtml)
      setOptimizeCopied(true)
      setTimeout(() => setOptimizeCopied(false), 2000)
    }
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 border border-border flex items-center justify-center">
            <Mail className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Email Review Agent</h1>
            <p className="text-muted-foreground text-sm">AI-powered quality assurance for marketing emails</p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
        <Tabs defaultValue="paste" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-lg">
                <TabsTrigger value="paste" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <ClipboardPaste className="mr-2 h-4 w-4" />
                  Paste HTML
            </TabsTrigger>
                <TabsTrigger value="api" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <Send className="mr-2 h-4 w-4" />
                  API Integration
            </TabsTrigger>
          </TabsList>

              <TabsContent value="paste" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="senderName" className="text-sm font-medium">Sender Name</Label>
                  <input
                    type="text"
                    id="senderName"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="Vercel"
                  />
                </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail" className="text-sm font-medium">From Address</Label>
                  <select
                    id="fromEmail"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all appearance-none cursor-pointer"
                      >
                        {VERCEL_EMAIL_OPTIONS.map((email) => (
                          <option key={email} value={email}>{email}</option>
                    ))}
                  </select>
                </div>
                    <div className="space-y-2">
                      <Label htmlFor="replyToEmail" className="text-sm font-medium">Reply-To Address</Label>
                  <select
                    id="replyToEmail"
                    value={replyToEmail}
                    onChange={(e) => setReplyToEmail(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all appearance-none cursor-pointer"
                      >
                        {VERCEL_EMAIL_OPTIONS.map((email) => (
                          <option key={email} value={email}>{email}</option>
                    ))}
                  </select>
                </div>
              </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-html" className="text-sm font-medium">Email HTML Content</Label>
                <Textarea
                  id="email-html"
                      placeholder="Paste your email HTML here..."
                      className="min-h-[200px] max-h-[400px] font-mono text-sm bg-background border-border focus:ring-2 focus:ring-ring resize-y overflow-auto"
                  value={emailHtml}
                  onChange={(e) => setEmailHtml(e.target.value)}
                  required
                />
              </div>

                  <Button
                    type="submit"
                    disabled={isPending || !emailHtml.trim()}
                    className="w-full sm:w-auto h-10 px-6 bg-foreground text-background hover:bg-foreground/90 font-medium transition-all disabled:opacity-50"
                  >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze Email
                      </>
                )}
              </Button>
            </form>
          </TabsContent>

              <TabsContent value="api" className="mt-6">
                <div className="rounded-lg border border-border bg-muted/30 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-foreground/5 border border-border flex items-center justify-center">
                      <Zap className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">API Integration</h3>
                      <p className="text-sm text-muted-foreground">Programmatically analyze emails via REST API</p>
                    </div>
                  </div>

                  <div className="rounded-md bg-background border border-border p-4 font-mono text-xs overflow-x-auto">
                    <div className="text-muted-foreground">POST /api/email-ingest</div>
                    <div className="mt-2 text-foreground">
                      {`{`}<br />
                      {`  "htmlContent": "<html>...</html>",`}<br />
                      {`  "subject": "Welcome to Vercel",`}<br />
                      {`  "sender": "ship@vercel.com"`}<br />
                      {`}`}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                      Set <code className="text-foreground bg-muted px-1 rounded">x-api-key</code> header for authentication.
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
          </CardHeader>
        </Card>

        {/* Analysis Results */}
      {analysisResult && (
          <div className="space-y-6 animate-fade-in">
            {/* Error Banner */}
            {analysisResult.error && (
              <div className="rounded-lg border border-error/50 bg-error/10 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-error">AI Analysis Error</p>
                  <p className="text-sm text-error/80 mt-1">{analysisResult.error}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Technical checks completed successfully. Add OPENAI_API_KEY to enable AI analysis.
                  </p>
                </div>
              </div>
            )}

            {/* Result Tabs */}
            <div className="flex gap-2 border-b border-border">
              <button
                onClick={() => setActiveResultTab("analysis")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeResultTab === "analysis"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Analysis
              </button>
              <button
                onClick={() => setActiveResultTab("preview")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeResultTab === "preview"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Email Preview
              </button>
              <button
                onClick={() => setActiveResultTab("optimize")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeResultTab === "optimize"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wand2 className="h-4 w-4" />
                Optimize HTML
              </button>
            </div>

            {/* Preview Tab */}
            {activeResultTab === "preview" && analysisResult.extracted.rawHtml && (
              <div className="rounded-xl border border-border bg-white overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">Email Preview</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Scroll to see full email</span>
                </div>
                <iframe
                  srcDoc={analysisResult.extracted.rawHtml}
                  className="w-full border-0"
                  style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}
                  title="Email Preview"
                  sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            )}

            {/* Optimize Tab */}
            {activeResultTab === "optimize" && (
              <div className="space-y-6">
                {/* Optimize CTA */}
                {!optimizeResult && !isOptimizing && (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/5 border border-border flex items-center justify-center mb-4">
                      <Wand2 className="h-8 w-8 text-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Optimize Email Content</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      AI will rewrite your email text following Vercel&apos;s style guide while preserving HTML structure and formatting.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={handleOptimize}
                        className="h-11 px-8 bg-foreground text-background hover:bg-foreground/90 font-medium"
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Optimize HTML
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Changes: Active voice, conciseness, no exclamation points, second person
                    </p>
                  </div>
                )}

                {/* Loading State */}
                {isOptimizing && (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Optimizing Content...</h2>
                    <p className="text-muted-foreground">
                      Applying Vercel style guide to your email text
                    </p>
                  </div>
                )}

                {/* Optimize Error */}
                {optimizeResult?.error && (
                  <div className="rounded-lg border border-error/50 bg-error/10 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-error">Optimization Error</p>
                      <p className="text-sm text-error/80 mt-1">{optimizeResult.error}</p>
                    </div>
                  </div>
                )}

                {/* Optimize Results */}
                {optimizeResult && !optimizeResult.error && (
                  <div className="space-y-6">
                    {/* Changes Summary */}
                    {optimizeResult.changes.length > 0 && (
                      <div className="rounded-xl border border-success/50 bg-success/5 p-6">
                        <h3 className="font-semibold text-success flex items-center gap-2 mb-4">
                          <CheckCircle2 className="h-5 w-5" />
                          {optimizeResult.changes.length} Improvements Made
                        </h3>
                        <ul className="space-y-2">
                          {optimizeResult.changes.map((change, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <ChevronRight className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Optimized HTML Output */}
                    <div className="rounded-xl border border-border bg-card">
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <h3 className="font-semibold">Optimized HTML</h3>
                        <Button
                          onClick={handleCopyOptimized}
                          variant="outline"
                          size="sm"
                          className="h-9"
                        >
                          {optimizeCopied ? (
                            <>
                              <Check className="mr-2 h-4 w-4 text-success" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy HTML
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="p-4">
                        <textarea
                          readOnly
                          value={optimizeResult.optimizedHtml}
                          className="w-full h-64 p-4 font-mono text-xs bg-muted/30 border border-border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    {/* Preview Optimized */}
                    <div className="rounded-xl border border-border bg-white overflow-hidden">
                      <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">Optimized Preview</span>
                        </div>
                      </div>
                      <iframe
                        srcDoc={optimizeResult.optimizedHtml}
                        className="w-full border-0"
                        style={{ height: "calc(100vh - 400px)", minHeight: "400px" }}
                        title="Optimized Email Preview"
                        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                      />
                    </div>

                    {/* Re-optimize Button */}
                    <div className="flex justify-center">
                      <Button
                        onClick={handleOptimize}
                        variant="outline"
                        className="h-10"
                        disabled={isOptimizing}
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Re-optimize
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Tab */}
            {activeResultTab === "analysis" && (
              <>
                {/* Dashboard Overview */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                    Analysis Overview
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/30 border border-border">
                      <ScoreRing score={analysisResult.qualitativeAnalysis.overallScore} />
                      <p className="mt-3 text-sm font-medium">Quality Score</p>
                    </div>

                    <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <StatCard
                        title="Content"
                        value={hasContentIssues ? "Issues" : "Clean"}
                        status={hasContentIssues ? "warning" : "success"}
                        icon={<SpellCheck className="h-5 w-5" />}
                      />
                      <StatCard
                        title="UTM Links"
                        value={hasUtmIssues ? "Issues" : "Valid"}
                        status={hasUtmIssues ? "error" : "success"}
                        icon={<Link2 className="h-5 w-5" />}
                      />
                      <StatCard
                        title="Accessibility"
                        value={hasAccessibilityIssues ? `${analysisResult.technicalChecks.accessibilityIssues.length}` : "OK"}
                        status={hasAccessibilityIssues ? "warning" : "success"}
                        icon={<Accessibility className="h-5 w-5" />}
                        subtitle={hasAccessibilityIssues ? "issues found" : "No issues"}
                      />
                      <StatCard
                        title="Compatibility"
                        value={hasCompatibilityIssues ? `${analysisResult.technicalChecks.compatibilityIssues.length}` : "OK"}
                        status={hasCompatibilityIssues ? "warning" : "success"}
                        icon={<Monitor className="h-5 w-5" />}
                        subtitle={hasCompatibilityIssues ? "warnings" : "No issues"}
              />
            </div>
          </div>

                  {/* Subject & Preview with character counts */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Heading1 className="h-4 w-4" />
                          Subject Line
                        </div>
                        <CharacterCount current={analysisResult.technicalChecks.subjectLineLength} min={30} max={50} label="" />
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="font-medium truncate cursor-default">
                            {analysisResult.extracted.subjectLine || <span className="text-muted-foreground italic">Not available</span>}
                          </p>
                        </TooltipTrigger>
                        {analysisResult.extracted.subjectLine && (
                          <TooltipContent side="bottom" className="max-w-sm">{analysisResult.extracted.subjectLine}</TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          Preview Text
                        </div>
                        <CharacterCount current={analysisResult.technicalChecks.previewTextLength} min={40} max={90} label="" />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {analysisResult.extracted.previewText || <span className="italic">Not extracted</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Checks */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold mb-2">Detailed Analysis</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Click each item to expand details.
                  </p>

                  <div className="space-y-8">
                    {/* Content Quality */}
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Content Quality</h3>
                      <div className="space-y-2">
                  <ChecklistItem
                          title="Spelling & Grammar"
                          status={!hasContentIssues ? "passed" : "warning"}
                          icon={<Type className="h-5 w-5" />}
                          badge={hasContentIssues ? `${analysisResult.qualitativeAnalysis.typos.length + analysisResult.qualitativeAnalysis.grammarErrors.length} issues` : undefined}
                    details={
                            hasContentIssues ? (
                              <ul className="space-y-2">
                          {analysisResult.qualitativeAnalysis.typos.map((t, i) => (
                                  <li key={`typo-${i}`} className="flex flex-col">
                                    <span className="text-warning">Line {t.line}: &ldquo;{t.error}&rdquo;</span>
                                    <span className="text-success text-xs">→ {t.suggestion}</span>
                            </li>
                          ))}
                          {analysisResult.qualitativeAnalysis.grammarErrors.map((g, i) => (
                                  <li key={`grammar-${i}`} className="flex flex-col">
                                    <span className="text-warning">Line {g.line}: &ldquo;{g.error}&rdquo;</span>
                                    <span className="text-success text-xs">→ {g.suggestion}</span>
                            </li>
                          ))}
                        </ul>
                            ) : "No spelling or grammar errors detected."
                    }
                  />
                  <ChecklistItem
                          title="Tone & Voice"
                    status="info"
                          icon={<SpellCheck className="h-5 w-5" />}
                          details={analysisResult.qualitativeAnalysis.toneAnalysis}
                  />
                  <ChecklistItem
                          title="Signature Match"
                    status={
                            analysisResult.qualitativeAnalysis.signatureToFromNameMatch.match === "yes" ? "passed"
                            : analysisResult.qualitativeAnalysis.signatureToFromNameMatch.match === "no" ? "failed"
                            : "info"
                          }
                          icon={<PenLine className="h-5 w-5" />}
                          details={analysisResult.qualitativeAnalysis.signatureToFromNameMatch.details ?? "No details available."}
                  />
                </div>
              </section>

                    {/* Images & Accessibility */}
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Images & Accessibility</h3>
                      <div className="space-y-2">
                  <ChecklistItem
                          title="Image Alt Text"
                          status={analysisResult.technicalChecks.imagesWithoutAlt === 0 ? "passed" : "warning"}
                          icon={<ImageIcon className="h-5 w-5" />}
                          badge={`${analysisResult.technicalChecks.totalImages} images`}
                    details={
                            <div className="space-y-2">
                              <p>{analysisResult.technicalChecks.imagesWithoutAlt} of {analysisResult.technicalChecks.totalImages} images missing alt text</p>
                              {analysisResult.technicalChecks.images.filter(img => img.issues.length > 0).slice(0, 5).map((img, i) => (
                                <div key={i} className="text-xs">
                                  <code className="bg-muted px-1 rounded">{img.src.substring(0, 40)}...</code>
                                  <ul className="ml-4 mt-1">
                                    {img.issues.map((issue, j) => (
                                      <li key={j} className="text-warning">• {issue}</li>
                          ))}
                        </ul>
                                </div>
                              ))}
                            </div>
                    }
                  />
                  <ChecklistItem
                          title="Accessibility Issues"
                          status={!hasAccessibilityIssues ? "passed" : "warning"}
                          icon={<Accessibility className="h-5 w-5" />}
                          badge={hasAccessibilityIssues ? `${analysisResult.technicalChecks.accessibilityIssues.length} issues` : undefined}
                    details={
                            hasAccessibilityIssues ? (
                              <ul className="space-y-1">
                                {analysisResult.technicalChecks.accessibilityIssues.map((issue, i) => (
                                  <li key={i} className={issue.severity === "error" ? "text-error" : "text-warning"}>
                                    • {issue.message}
                            </li>
                          ))}
                        </ul>
                            ) : "No accessibility issues detected."
                    }
                  />
                  <ChecklistItem
                          title="Dark Mode"
                    status="manual"
                          icon={<Moon className="h-5 w-5" />}
                          details="Manual verification recommended for dark mode compatibility."
                  />
                </div>
              </section>

                    {/* Email Client Compatibility */}
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Email Client Compatibility</h3>
                      <div className="space-y-2">
                  <ChecklistItem
                          title="Outlook Compatibility"
                          status={analysisResult.technicalChecks.compatibilityIssues.filter(c => c.client.includes("Outlook")).length === 0 ? "passed" : "warning"}
                          icon={<Monitor className="h-5 w-5" />}
                          badge={analysisResult.technicalChecks.compatibilityIssues.filter(c => c.client.includes("Outlook")).length > 0 
                            ? `${analysisResult.technicalChecks.compatibilityIssues.filter(c => c.client.includes("Outlook")).length} issues` 
                            : undefined}
                    details={
                            analysisResult.technicalChecks.compatibilityIssues.filter(c => c.client.includes("Outlook")).length > 0 ? (
                              <div className="space-y-3">
                                {analysisResult.technicalChecks.compatibilityIssues
                                  .filter(c => c.client.includes("Outlook"))
                                  .slice(0, 10)
                                  .map((issue, i) => (
                                    <div key={i} className="border-l-2 border-warning/50 pl-3">
                                      <p className="text-warning font-medium">{issue.issue}</p>
                                      {issue.location && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Found in: <span className="text-foreground">{issue.location}</span>
                                        </p>
                                      )}
                                      {issue.context && (
                                        <code className="block mt-1 text-xs bg-muted p-2 rounded overflow-x-auto max-w-full">
                                          {issue.context}
                                        </code>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            ) : "No Outlook compatibility issues detected."
                    }
                  />
                  <ChecklistItem
                          title="Gmail Compatibility"
                          status={analysisResult.technicalChecks.compatibilityIssues.filter(c => c.client.includes("Gmail")).length === 0 ? "passed" : "warning"}
                          icon={<Monitor className="h-5 w-5" />}
                          badge={analysisResult.technicalChecks.compatibilityIssues.filter(c => c.client.includes("Gmail")).length > 0 
                            ? `${analysisResult.technicalChecks.compatibilityIssues.filter(c => c.client.includes("Gmail")).length} issues` 
                            : undefined}
                    details={
                            analysisResult.technicalChecks.compatibilityIssues.filter(c => c.client.includes("Gmail")).length > 0 ? (
                              <div className="space-y-3">
                                {analysisResult.technicalChecks.compatibilityIssues
                                  .filter(c => c.client.includes("Gmail"))
                                  .slice(0, 10)
                                  .map((issue, i) => (
                                    <div key={i} className="border-l-2 border-warning/50 pl-3">
                                      <p className="text-warning font-medium">{issue.issue}</p>
                                      {issue.location && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Found in: <span className="text-foreground">{issue.location}</span>
                                        </p>
                                      )}
                                      {issue.context && (
                                        <code className="block mt-1 text-xs bg-muted p-2 rounded overflow-x-auto max-w-full">
                                          {issue.context}
                                        </code>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            ) : "No Gmail compatibility issues detected."
                    }
                  />
                </div>
              </section>

                    {/* Links */}
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Link Validation</h3>
                      
                      {/* Link Resolution Summary Banner */}
                      {analysisResult.technicalChecks.totalLinks > 0 && (
                        <div className={`rounded-lg border p-4 flex items-center gap-3 ${
                          analysisResult.technicalChecks.allLinksResolved 
                            ? "border-success/50 bg-success/5" 
                            : "border-error/50 bg-error/5"
                        }`}>
                          {analysisResult.technicalChecks.allLinksResolved ? (
                            <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                          ) : (
                            <XCircle className="h-6 w-6 text-error flex-shrink-0" />
                          )}
                          <div>
                            <p className={`font-semibold ${analysisResult.technicalChecks.allLinksResolved ? "text-success" : "text-error"}`}>
                              {analysisResult.technicalChecks.allLinksResolved 
                                ? `All ${analysisResult.technicalChecks.totalLinks} links resolved successfully`
                                : `${analysisResult.technicalChecks.brokenLinks} of ${analysisResult.technicalChecks.totalLinks} links failed`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {analysisResult.technicalChecks.allLinksResolved 
                                ? "Every link returned a valid response (200 OK or redirect)"
                                : "Some links returned errors or timed out"}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                  <ChecklistItem
                          title="Link Resolution"
                          status={analysisResult.technicalChecks.allLinksResolved ? "passed" : analysisResult.technicalChecks.brokenLinks > 0 ? "failed" : "info"}
                          icon={<Globe className="h-5 w-5" />}
                          badge={`${analysisResult.technicalChecks.totalLinks} links checked`}
                    details={
                            <div className="space-y-3">
                              {analysisResult.technicalChecks.linkValidation.filter(l => l.status === "error" || l.status === "timeout").length > 0 && (
                                <div>
                                  <p className="font-medium text-error mb-2">Broken Links:</p>
                                  <ul className="space-y-2">
                                    {analysisResult.technicalChecks.linkValidation
                                      .filter(l => l.status === "error" || l.status === "timeout")
                                      .map((link, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          {link.status === "timeout" ? (
                                            <Clock className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                                          ) : (
                                            <XCircle className="h-4 w-4 text-error flex-shrink-0 mt-0.5" />
                                          )}
                                          <div>
                                            <span className="text-error">{link.error || `HTTP ${link.statusCode}`}</span>
                                            <p className="text-xs text-muted-foreground break-all">{link.url.substring(0, 60)}...</p>
                                            {link.text && <p className="text-xs text-muted-foreground">Link text: &quot;{link.text}&quot;</p>}
                                          </div>
                                        </li>
                                      ))}
                                  </ul>
                                </div>
                              )}
                              {analysisResult.technicalChecks.linkValidation.filter(l => l.status === "redirect").length > 0 && (
                                <div>
                                  <p className="font-medium text-warning mb-2">Redirects:</p>
                                  <ul className="space-y-2">
                                    {analysisResult.technicalChecks.linkValidation
                                      .filter(l => l.status === "redirect")
                                      .slice(0, 5)
                                      .map((link, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <ArrowRight className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                                          <div>
                                            <span className="text-warning">HTTP {link.statusCode}</span>
                                            <p className="text-xs text-muted-foreground break-all">{link.url.substring(0, 50)}...</p>
                                            {link.redirectUrl && (
                                              <p className="text-xs text-muted-foreground">→ {link.redirectUrl.substring(0, 50)}...</p>
                                            )}
                                          </div>
                                        </li>
                                      ))}
                                  </ul>
                                </div>
                              )}
                              {analysisResult.technicalChecks.linkValidation.filter(l => l.status === "ok").length > 0 && (
                                <div>
                                  <p className="font-medium text-success mb-2">
                                    ✓ {analysisResult.technicalChecks.linkValidation.filter(l => l.status === "ok").length} links returned 200 OK
                                  </p>
                                </div>
                              )}
                              {analysisResult.technicalChecks.totalLinks > 20 && (
                                <p className="text-xs text-muted-foreground">
                                  Note: Only first 20 links were validated to prevent timeout.
                                </p>
                              )}
                            </div>
                    }
                  />
                  <ChecklistItem
                          title="UTM Parameters"
                          status={!hasUtmIssues ? "passed" : "failed"}
                          icon={<Link2 className="h-5 w-5" />}
                          badge={hasUtmIssues ? `${analysisResult.technicalChecks.utmIssues.length} issues` : undefined}
                          details={
                            hasUtmIssues ? (
                              <ul className="space-y-1">
                                {analysisResult.technicalChecks.utmIssues.slice(0, 5).map((issue, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <ExternalLink className="h-3 w-3 mt-1 flex-shrink-0" />
                                    <span className="break-all">{issue.message}</span>
                                  </li>
                                ))}
                                {analysisResult.technicalChecks.utmIssues.length > 5 && (
                                  <li className="text-muted-foreground">+{analysisResult.technicalChecks.utmIssues.length - 5} more</li>
                                )}
                              </ul>
                            ) : "All links have valid UTM parameters."
                          }
                  />
                  <ChecklistItem
                          title="Staging Links"
                          status={analysisResult.technicalChecks.stagingLinkIssues.length === 0 ? "passed" : "warning"}
                          icon={<Link2 className="h-5 w-5" />}
                    details={
                            analysisResult.technicalChecks.stagingLinkIssues.length > 0
                              ? `Found ${analysisResult.technicalChecks.stagingLinkIssues.length} potential staging link(s).`
                              : "No staging links detected."
                    }
                  />
                </div>
              </section>

                    {/* Compliance */}
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Compliance</h3>
                      <div className="space-y-2">
                  <ChecklistItem
                          title="Unsubscribe Link"
                          status={analysisResult.technicalChecks.unsubscribeLink.found ? "passed" : "failed"}
                          icon={<Shield className="h-5 w-5" />}
                    details={
                            analysisResult.technicalChecks.unsubscribeLink.found
                              ? `Found: "${analysisResult.technicalChecks.unsubscribeLink.text}"`
                              : "Required unsubscribe link not found."
                    }
                  />
                  <ChecklistItem
                          title="Privacy Policy"
                          status={analysisResult.technicalChecks.privacyPolicyLink.found ? "passed" : "failed"}
                          icon={<Shield className="h-5 w-5" />}
                          details={
                            analysisResult.technicalChecks.privacyPolicyLink.found
                              ? `Found: "${analysisResult.technicalChecks.privacyPolicyLink.text}"`
                              : "Privacy policy link not found."
                          }
                  />
                  <ChecklistItem
                          title="Calendar Links"
                    status="info"
                          icon={<CalendarDays className="h-5 w-5" />}
                    details={
                            analysisResult.technicalChecks.addToCalendarLinks.length > 0
                              ? `Found ${analysisResult.technicalChecks.addToCalendarLinks.length} calendar link(s). Verify times and timezones.`
                              : "No calendar links detected."
                    }
                  />
                </div>
              </section>

                    {/* Email Setup */}
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Email Setup</h3>
                      <div className="space-y-2">
                        <ChecklistItem
                          title="Sender Information"
                          status={analysisResult.extracted.fullFromAddress ? "info" : "manual"}
                          icon={<User className="h-5 w-5" />}
                          details={analysisResult.extracted.fullFromAddress ? `From: ${analysisResult.extracted.fullFromAddress}` : "Verify sender info."}
                        />
                        <ChecklistItem
                          title="Reply-To Address"
                          status={analysisResult.extracted.replyToEmail ? "info" : "manual"}
                          icon={<Reply className="h-5 w-5" />}
                          details={analysisResult.extracted.replyToEmail ? `Reply-To: ${analysisResult.extracted.replyToEmail}` : "Verify reply-to."}
                        />
                      </div>
                    </section>

                    {/* AI Suggestions */}
                    {analysisResult.qualitativeAnalysis.suggestions.length > 0 && (
                      <section className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI Recommendations</h3>
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                          <ul className="space-y-3">
                            {analysisResult.qualitativeAnalysis.suggestions.map((suggestion, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 text-xs font-medium">{i + 1}</span>
                                <span className="text-muted-foreground">{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </section>
                    )}
                  </div>
            </div>
              </>
            )}
          </div>
      )}
      </div>
    </TooltipProvider>
  )
}
