import { CopyCard } from "@/components/docs/copy-card"
import { SamplePanel } from "@/components/docs/sample-panel"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

export default function EmailGuidelinesPage() {
  return (
    <div className="space-y-16">
      {/* Content Analyzer CTA */}
      <Link
        href="/content-analyzer"
        className="group relative flex items-center justify-between gap-6 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent p-6 transition-all hover:border-blue-500/50 hover:from-blue-500/15 hover:via-blue-500/10"
      >
        <div className="absolute inset-0 rounded-xl bg-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="relative space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <svg
                className="h-4 w-4 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Content Analyzer
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Paste your draft and instantly check it against our voice and tone guidelines
          </p>
        </div>
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 transition-all group-hover:border-blue-500/50 group-hover:bg-blue-500/20">
          <ArrowUpRight className="h-5 w-5 text-blue-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </Link>

      {/* Header */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Voice & Tone Guidelines
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          How we apply voice and tone in the words we write. Recommendations may seem
          contradicting, and that&apos;s ok. There are exceptions to every rule. The goal is
          to keep these tips in mind and find the balance.
        </p>
      </section>

      {/* Keep Sentences Short */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Keep sentences short</h2>
          <p className="text-muted-foreground">
            Every sentence should be purposeful and drive the reader forward. Fewer commas.
            More periods. Using fewer words lets the words you keep feel intentional.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-medium text-foreground">Writing tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              Write short, declarative sentences.
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              Every time you use a comma, ask yourself whether you can use a period instead.
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              A great sentence is a good sentence made shorter. Write with the delete key. You know a sentence is ready to ship when there&apos;s nothing left to remove.
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              Avoid repeating the same words in a paragraph. Try to rephrase, or use synonyms when possible.
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              Remove unnecessary &quot;filler&quot; words: &quot;This is <s>very</s> good.&quot; — Very adds nothing.
            </li>
          </ul>
        </div>
      </section>

      {/* Vary Sentence Length */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Vary sentence length</h2>
          <p className="text-muted-foreground">
            We want to keep sentences short, but we should avoid sounding robotic. Mix your phrasing to make reading interesting.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-medium text-foreground">Writing tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              Use short sentences to make impactful statements or as a bridge between two statements.
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              Use longer sentences to build momentum.
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              Varying the sentence length gives the paragraph life and personality.
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              Use em dashes to change things up.
            </li>
          </ul>
        </div>
      </section>

      {/* Write Like You Speak */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Write like you speak</h2>
          <p className="text-muted-foreground">
            It&apos;s tempting to use words or phrases to sound more impressive or smart, but it usually has the opposite effect. It clouds the points you&apos;re trying to make. Write like you speak.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-medium text-foreground">Writing tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              Don&apos;t get fancy. Get to the point faster. If you can, always use the shorter, simpler word.
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              Sentences can start with &quot;but&quot; and &quot;and&quot;, but don&apos;t overdo it.
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              Jargon and fluff can surface when there is a lack of clarity or facts. Dig deeper to uncover the underlying targets, facts, and data.
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              Avoid corporate jargon and marketing fluff. If it doesn&apos;t add meaningful value, cut it.
            </li>
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <WordSwap before="Facilitate" after="Help" />
          <WordSwap before="Utilize" after="Use" />
          <WordSwap before="Commence" after="Start" />
        </div>

        <SamplePanel
          before="Observability is mission-critical."
          after="Observability is important."
        />
      </section>

      {/* Be Specific */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Be specific</h2>
          <p className="text-muted-foreground">
            We can use words like &quot;best&quot;, &quot;bigger&quot;, &quot;better&quot;, and &quot;faster&quot;, but it&apos;s more powerful when we can back statements with facts or data. Explicitly stating &quot;why&quot; or &quot;how&quot; is more concrete.
          </p>
          <p className="text-muted-foreground">
            If you do use these superlatives, use them sparingly. If everything is &quot;great&quot;, then nothing is.
          </p>
        </div>

        <SamplePanel
          before="Vercel is fast"
          after="With zero-configuration support for 35+ frameworks, Vercel gets your team building faster"
        />
      </section>

      {/* Be Confident */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Be confident</h2>
          <p className="text-muted-foreground">
            We&apos;re confident in our product and the value it provides. Phrases like &quot;I think,&quot; &quot;maybe,&quot; &quot;could,&quot; etc., soften our impact. Vercel is an authority in our space. Be bold. But also, be humble.
          </p>
          <p className="text-muted-foreground">
            Know the difference between confidence and arrogance.
          </p>
        </div>

        <SamplePanel
          before="Vercel should make your app faster"
          after="Vercel's Edge Network is built on a global infrastructure designed for optimal performance and reliability"
        />
      </section>

      {/* Highlight Customers */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Highlight customers and community</h2>
          <p className="text-muted-foreground">
            Our customers and community are filled with builders and creators from around the world. Featuring their thoughts and words allows us to give them the spotlight and show value versus telling. Our favorite moments are when our customers do the talking for us.
          </p>
        </div>

        <SamplePanel
          before="Vercel is fast."
          after={`"Switching to Edge Functions improved our site load times by 60%." — ACME`}
        />
      </section>

      {/* Say "You" More */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Say &quot;you&quot; more than &quot;we&quot;</h2>
          <p className="text-muted-foreground">
            When talking to an external audience, the conversation should be more about them than us. Less &quot;we did&quot; and more &quot;you can&quot;.
          </p>
          <p className="text-muted-foreground">
            We know how great Vercel can be. We help others understand by showing the impact Vercel can have on their team and empathizing with their software development challenges.
          </p>
        </div>

        <SamplePanel
          before="Edge Functions make personalization faster."
          after="With Edge Functions, you can personalize and experiment without sacrificing speed or performance."
        />
      </section>

      {/* Active Voice */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Use active voice</h2>
          <p className="text-muted-foreground">
            Active voice is more interesting to read and leaves less room for ambiguity. The active form makes sentences more vigorous, direct, and efficient.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-medium text-foreground">Writing tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              If you find yourself using words like &quot;has&quot;, &quot;was&quot;, &quot;by&quot;, or words ending with &quot;-ed&quot;, you may be using passive voice. Try to restructure the sentence.
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              A tip for catching passive voice: add &quot;...by monkeys&quot; to the end of the sentence. If it makes sense, you&apos;re using passive voice.
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <SamplePanel
            before="If you make changes to your code, the page will be updated."
            after="To update the page, make changes to your code."
          />
          <SamplePanel
            before="The account was created."
            after="You created an account."
          />
        </div>
      </section>

      {/* Positive Phrasing */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Use positive phrasing</h2>
          <p className="text-muted-foreground">
            Positive phrasing is easier to understand than negative. We can be more clear saying what something is than trying to express what it isn&apos;t. A positive tone is uplifting and enabling. Negative tone creates tension, apprehension, or limitation.
          </p>
          <p className="text-muted-foreground">
            Conjunctions can also feel negative. Swapping them out can turn a confrontational statement into a positive one.
          </p>
        </div>

        <div className="space-y-4">
          <SamplePanel
            before="You can't update the page if you don't make any changes to your code."
            after="To update the page, make changes to your code."
          />
          <SamplePanel
            before="We're excited for you to join us. However, you need to confirm your account."
            after="We're excited for you to join us. There's one thing left to do: Confirm your account."
          />
        </div>
      </section>

      {/* Exclamation Points */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Use exclamation points thoughtfully</h2>
          <p className="text-muted-foreground">
            Almost never use exclamation points. When we do use them, it&apos;s very sparingly. Treat exclamation points like salt. They add flavor, while too much ruins the dish. Exclamation points also lose their emphasis over time. If everything is worth an exclamation point, then nothing is.
          </p>
        </div>

        <div className="grid gap-3">
          <CopyCard
            variant="dont"
            title="Not from a company account"
            content="Never use exclamation points in company messages or official communications."
            hideCopy
          />
          <CopyCard
            variant="do"
            title="Maybe when congratulating"
            content="Ok when congratulating a customer—never when something's gone wrong. No one likes being yelled at."
            hideCopy
          />
          <CopyCard
            variant="do"
            title="Personal communication"
            content="Ok from personal accounts or in direct one-on-one communication with a customer."
            hideCopy
          />
        </div>
      </section>
    </div>
  )
}

function WordSwap({ before, after }: { before: string; after: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <p className="text-sm text-muted-foreground line-through mb-1">{before}</p>
      <p className="text-sm font-medium text-foreground">{after}</p>
    </div>
  )
}
