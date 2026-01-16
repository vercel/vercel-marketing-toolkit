import { EmailReviewAgent } from "@/components/email-review-agent"

export const dynamic = "force-dynamic"

export default function EmailReviewPage() {
  return (
    <div className="container mx-auto p-6">
      <EmailReviewAgent />
    </div>
  )
}
