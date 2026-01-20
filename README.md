# Vercel Marketing Toolkit

A comprehensive suite of tools to power your marketing campaigns, built with Next.js and deployed on Vercel.

## Overview

The Marketing Toolkit provides a collection of integrated tools for marketing operations teams:

- **Naming Generators** - Generate compelling names for campaigns and projects
- **Date & Time Picker** - Convert and manage timezones for global campaigns
- **UTM Generator** - Create trackable campaign URLs with UTM parameters
- **Image Generator** - Generate marketing images for campaigns
- **QR Code Generator** - Create QR codes for events and campaigns
- **Content Analyzer** - AI-powered content analysis and optimization
- **Email Review Agent** - AI-powered email quality assurance
- **SOQL Query Helper** - Generate and test Salesforce SOQL queries
- **List Import Agent** - AI-powered contact list validation and import

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Vercel account (for deployment)
- OpenAI API key (for AI-powered features)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/vercel/vercel-marketing-toolkit.git
cd vercel-marketing-toolkit
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create your environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

See `LIST_IMPORT_ENV_VARS.md` for detailed environment variable documentation.

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the toolkit.

### Environment Variables

Key environment variables required:

```bash
# Required for AI features
OPENAI_API_KEY=sk-your-api-key

# Required for List Import Agent
TRAY_WEBHOOK_URL=https://your-tray-webhook.com
SCORING_AGENT_URL=https://your-scoring-agent.com

# Optional - Security
INTERNAL_API_KEY=your-internal-api-key

# Optional - Blocklists
DOMAIN_BLOCKLIST=vercel.com,test.com
COMPANY_BLOCKLIST=Vercel,Test Corp
```

See `LIST_IMPORT_ENV_VARS.md` for complete documentation.

## Features

### List Import Agent

The List Import Agent helps Marketing Ops safely import contact lists with:

- **AI-Powered Validation** - Automatic data cleaning and normalization
- **Smart Column Mapping** - AI suggests correct field mappings
- **Data Quality Checks** - Email validation, name cleaning, country normalization
- **Blocklist Protection** - Prevent internal/competitor emails from being imported
- **Audit Trail** - Full logging with user attribution
- **Two Import Modes**:
  - Full List Import (via Tray.io)
  - Agent Scoring & Sequence (direct to scoring agent)

**Workflow:**
1. Upload CSV or connect Google Sheet
2. AI maps columns automatically
3. Validate and clean data
4. Preview and select rows
5. Send to Tray.io or Scoring Agent

### Authentication

The toolkit uses Vercel Team Authentication to protect all pages and API routes. To enable:

1. Go to your Vercel project settings
2. Enable "Vercel Authentication"
3. Add team members who should have access

The middleware (`middleware.ts`) handles authentication for both pages and API routes, with special CORS handling for external webhooks.

## Project Structure

```
vercel-marketing-toolkit/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx             # Homepage with tool grid
│   │   ├── layout.tsx           # Root layout
│   │   ├── list-import/         # List Import Agent
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   ├── api/                 # API Routes
│   │   │   ├── analyze-columns/
│   │   │   ├── validate/
│   │   │   ├── send-to-tray/
│   │   │   └── ...
│   │   └── [other-tools]/
│   ├── components/              # Shared components
│   │   ├── Navigation.tsx
│   │   ├── theme-toggle.tsx
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/                    # Utilities
│   │   ├── utils.ts
│   │   ├── validation-engine.ts
│   │   └── ...
│   └── hooks/                  # React hooks
├── middleware.ts               # Auth + CORS handling
├── package.json
└── tailwind.config.ts
```

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **UI Components:** shadcn/ui (Radix UI + Tailwind CSS)
- **Styling:** Tailwind CSS v3
- **AI:** OpenAI GPT-4o-mini via Vercel AI SDK
- **Hosting:** Vercel
- **Authentication:** Vercel Team Auth
- **Forms:** React Hook Form with Zod validation
- **State:** React hooks (no global state library)

## Development

### Adding a New Tool

1. Create a new directory in `src/app/[tool-name]/`
2. Add `page.tsx` as the main entry point
3. Add components in `[tool-name]/components/`
4. Add API routes in `src/app/api/[endpoint]/route.ts` if needed
5. Update `src/app/page.tsx` to add the tool to the homepage grid
6. Update `src/components/Navigation.tsx` to add navigation link

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow shadcn/ui component patterns
- Use CSS variables for colors (`--background`, `--foreground`, etc.)
- Support both light and dark themes

### API Routes

All API routes in `src/app/api/` follow Next.js App Router conventions:

```typescript
// src/app/api/example/route.ts
export async function POST(request: Request) {
  // Handle POST request
  return Response.json({ success: true })
}
```

Protected API routes are specified in `middleware.ts`.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables in Vercel dashboard
4. Enable Vercel Team Authentication
5. Deploy

### Environment Variables in Production

Go to **Project Settings → Environment Variables** in Vercel and add:
- All variables from `LIST_IMPORT_ENV_VARS.md`
- Set for Production, Preview, and/or Development environments
- Redeploy after adding/changing variables

## Contributing

Built with 🖤 by the Marketing Ops team.

### Guidelines

- Follow existing code patterns
- Test locally before committing
- Update documentation for new features
- Keep components focused and reusable

## Support

For issues or questions:
- Check existing documentation
- Review Vercel function logs
- Contact the engineering team

## License

Proprietary - Vercel Internal Use Only
