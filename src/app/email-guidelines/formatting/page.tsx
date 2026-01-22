import { CopyCard } from "@/components/docs/copy-card"

export default function EmailFormattingPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Email Formatting
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Standards and formatting rules for Vercel marketing emails. Follow these guidelines to ensure consistency across all communications.
        </p>
      </section>

      {/* Subject Line */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Subject Line</h2>
        </div>

        <div className="grid gap-3">
          <CopyCard
            variant="do"
            title="Be mindful of optimal length"
            content="~35 characters, up to 50 characters max."
            hideCopy
          />
          <CopyCard
            variant="do"
            title="One clear idea"
            content="One subject line = one promise or benefit. No bundling."
            hideCopy
          />
          <CopyCard
            variant="do"
            title="Clarity over cleverness"
            content="It should be instantly understandable while scanning an inbox."
            hideCopy
          />
          <CopyCard
            variant="do"
            title="Lead with specificity"
            content="Put the most concrete, meaningful words first (numbers, outcomes, changes)."
            hideCopy
          />
          <CopyCard
            variant="do"
            title="Cut filler aggressively"
            content="Remove words that add length but no value: 'introducing,' 'exciting,' 'update.'"
            hideCopy
          />
        </div>
      </section>

      {/* Pre-header */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Pre-header</h2>
        </div>

        <div className="grid gap-3">
          <CopyCard
            variant="do"
            title="Be mindful of optimal length"
            content="Between 40-90 characters."
            hideCopy
          />
          <CopyCard
            variant="dont"
            title="No punctuation"
            content="We do not use punctuation in pre-headers as a general rule of thumb."
            hideCopy
          />
          <CopyCard
            variant="dont"
            title="Never repeat the subject line"
            content="Treat the preheader as line 2 of the sentence, not an echo."
            hideCopy
          />
          <CopyCard
            variant="do"
            title="Finish the thought from the subject line"
            content="Preheader = context, payoff, or proof."
            hideCopy
          />
          <CopyCard
            variant="do"
            title="Front-load the value"
            content="Put the most important information at the beginning of the preheader."
            hideCopy
          />
        </div>
      </section>

      {/* Job Titles */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Job Titles</h2>
        </div>

        <div className="grid gap-3">
          <CopyCard
            variant="do"
            title="Title before name"
            content="Campaign Operations Manager Ethan White"
            hideCopy
          />
          <CopyCard
            variant="dont"
            title="Don't use comma separation or include Vercel"
            content="Ethan White, Campaign Operations Manager, Vercel
Do not include Vercel in the title unless there are multiple companies participating in the event."
            hideCopy
          />
          <CopyCard
            variant="do"
            title="Guillermo's title"
            content="When mentioning Guillermo, it should always read 'Vercel Founder & CEO Guillermo Rauch'"
            hideCopy
          />
        </div>
      </section>

      {/* Dates and Times */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Dates and Times</h2>
        </div>

        <div className="grid gap-3">
          <CopyCard
            variant="do"
            title="Date format"
            content="Always include the day of the week and year: Thursday, January 22, 2026"
            hideCopy
          />
          <CopyCard
            variant="do"
            title="Time format"
            content="10:00 AM PT (note the spacing)"
            hideCopy
          />
        </div>
      </section>

      {/* Images */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Images</h2>
        </div>

        <div className="grid gap-3">
          <CopyCard
            variant="do"
            title="Include a banner image"
            content="Emails should include a banner image whenever possible as this has been shown to increase CTR. The banner should be 600px wide and 200-400px tall."
            hideCopy
          />
          <CopyCard
            variant="do"
            title="Include speaker headshots"
            content="Emails should include a speaker headshot whenever possible/relevant."
            hideCopy
          />
        </div>
      </section>

      {/* Bullet Points */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Bullet Points</h2>
        </div>

        <div className="grid gap-3">
          <CopyCard
            variant="dont"
            title="No periods at the end"
            content="Bullet points should not have periods at the end"
            hideCopy
          />
        </div>
      </section>

      {/* UTMs */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">UTMs</h2>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            MOPs will create UTMs for you, but if there is a specific UTM you would like to use for tracking, please provide that in your <span className="font-mono text-foreground">#review-emails</span> request.
          </p>
        </div>
      </section>

      {/* Signature */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Signature</h2>
          <p className="text-sm text-muted-foreground">
            When including a closing signature, there should be a hard return between the closing and the Vercel team line.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="font-mono text-sm text-foreground whitespace-pre-line leading-loose">
            {`See you soon,

▲ The Vercel Team`}
          </div>
        </div>
      </section>
    </div>
  )
}
