import Image from "next/image"
import { Check } from "lucide-react"

const emailExamples = [
  {
    title: "Vercel Live Session Invite",
    subject: "Agentic commerce is coming. Here's how to prepare.",
    preheader: "Commerce is expanding beyond storefronts and checkout pages",
    image: "/images/email-example-1.png",
    imageAlt: "Vercel Live session invitation email example showing proper formatting with speaker title, bullet points without periods, date/time formatting, CTA button, and signature spacing",
    highlights: [
      "Speaker title is written correctly (title before name, no comma)",
      "No periods at the end of the bullet points",
      "Date and time clearly called out and in the right format",
      "Closing signature has correct spacing",
      "CTA button is used instead of hyperlinking text",
    ],
  },
  {
    title: "Finance Team Internal Apps",
    subject: "How finance automates financial workflows with v0 pipelines",
    preheader: "Last chance to join the v0 Financial Workflows webinar",
    image: "/images/email-example-2.png",
    imageAlt: "Vercel finance team email example showing proper formatting with bullet points without periods, date with day of week and timezone spacing, CTA button, and signature spacing",
    highlights: [
      "Bullet points do not contain periods",
      "Date includes day of the week and proper spacing between PM and timezones",
      "CTA button used instead of hyperlinking",
      "Closing follows spacing guidelines",
    ],
  },
  {
    title: "Vercel Ship 2025 - AEO Session",
    subject: "How to engineer your site for LLMs and AI search optimization",
    preheader: "Best practices from startup Profound",
    image: "/images/email-example-3.png",
    imageAlt: "Vercel Ship 2025 email about answer engine optimization featuring banner image with speaker, proper title formatting, bullet points without periods, and CTA button with hyperlink",
    highlights: [
      "Includes banner image with speaker headshot",
      "Speaker title comes before their name with no comma separation",
      "No periods on bullet points",
      "CTA button in addition to hyperlink",
    ],
  },
]

export default function EmailExamplesPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Email Examples
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Real examples of emails that follow our voice, tone, and formatting guidelines.
        </p>
      </section>

      {emailExamples.map((example, exampleIndex) => (
        <section key={exampleIndex} className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">{example.title}</h2>
          
          {/* Subject & Preheader */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="text-sm font-medium text-foreground shrink-0 w-20">Subject:</span>
              <span className="text-sm text-muted-foreground">{example.subject}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="text-sm font-medium text-foreground shrink-0 w-20">Preheader:</span>
              <span className="text-sm text-muted-foreground">{example.preheader}</span>
            </div>
          </div>
          
          {/* Email Image */}
          <div className="rounded-lg border border-border overflow-hidden bg-white">
            <Image
              src={example.image || "/placeholder.svg"}
              alt={example.imageAlt}
              width={1000}
              height={1800}
              className="w-full h-auto"
            />
          </div>

          {/* What was done well */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">What was done well</h3>
            <ul className="space-y-3">
              {example.highlights.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-green-500" />
                  </span>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  )
}
