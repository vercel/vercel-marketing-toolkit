# List Import Agent - Environment Variables

This document describes the environment variables required for the List Import Agent functionality in the Marketing Toolkit.

## Required Variables

### OpenAI API Key (Required for AI validation)
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```
Get your API key from: https://platform.openai.com/api-keys

**Used for:**
- AI-powered column mapping
- Data validation and anomaly detection
- Intelligent field normalization

### Tray Webhook URL (Required for Full List Import)
```bash
TRAY_WEBHOOK_URL=https://your-tray-webhook-url.com/webhook
```
This is where validated contact data will be sent in batches for the Full List Import workflow.

### Scoring Agent URL (Required for Agent Scoring & Sequence)
```bash
SCORING_AGENT_URL=https://your-scoring-agent-url.com/api/score
```
This is the endpoint for sending contacts directly to the scoring agent for sequence assignment.

## Optional Variables

### AI Model Selection
```bash
GPT_MODEL=gpt-4o-mini
```
**Options:** `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`
**Default:** `gpt-4o-mini` (recommended for cost/performance balance)

### Tray Webhook Headers
```bash
TRAY_HEADERS={"Authorization": "Bearer your-token", "X-API-Key": "your-key"}
```
Additional headers to send with Tray webhook requests (JSON format)
**Default:** `{}`

### Domain Blocklist
```bash
DOMAIN_BLOCKLIST=vercel.com,test.com,example.com
```
Comma-separated list of email domains to block
**Default:** `vercel.com`

### Company Blocklist
```bash
COMPANY_BLOCKLIST=Vercel,Test Company,Example Inc
```
Comma-separated list of company names to block
**Default:** `Vercel`

### File Upload Limit
```bash
MAX_FILE_MB=25
```
Maximum CSV file size in megabytes
**Default:** `25`

### Row Limits
```bash
MAX_ROWS_FULL_LIST=10000
MAX_ROWS_SCORING=50000
```
Maximum rows per import for each workflow type
**Defaults:** `10000` (Full List), `50000` (Scoring)

### Security (Optional but Recommended)
```bash
INTERNAL_API_KEY=your-secret-api-key-for-service-to-service-calls
```
Optional API key for service-to-service authentication
**Default:** None (relies on Vercel team authentication)

### Google Sheets Integration (Optional)
```bash
GOOGLE_SHEETS_API_KEY=your-google-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```
Required only if using Google Sheets import functionality

## Complete Example

```bash
# .env.local

# Required
OPENAI_API_KEY=sk-proj-abc123...
TRAY_WEBHOOK_URL=https://hooks.tray.io/v1/workflows/abc123/webhook
SCORING_AGENT_URL=https://scoring-agent.vercel.app/api/score

# Optional - AI Configuration
GPT_MODEL=gpt-4o-mini

# Optional - Webhook Configuration
TRAY_HEADERS={"Authorization":"Bearer xyz789"}

# Optional - Blocklists
DOMAIN_BLOCKLIST=vercel.com,test.com,competitor.com
COMPANY_BLOCKLIST=Vercel,Test Corp,Competitor Inc

# Optional - Limits
MAX_FILE_MB=25
MAX_ROWS_FULL_LIST=10000
MAX_ROWS_SCORING=50000

# Optional - Security
INTERNAL_API_KEY=your-secret-key-here

# Optional - Google Sheets
GOOGLE_SHEETS_API_KEY=your-google-api-key
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Vercel Deployment

### Local Development
1. Create a `.env.local` file in the project root
2. Copy the variables above and fill in your values
3. Never commit `.env.local` to version control

### Production Deployment
1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add each variable with its value
4. Choose the appropriate environment (Production, Preview, Development)
5. Redeploy after adding/changing variables

## Important Security Notes

⚠️ **Never commit secrets to version control**
✅ Use `.env.local` for local development
🔐 Keep API keys and webhook URLs secret
☁️ Set environment variables in Vercel dashboard for production
🔒 Use `INTERNAL_API_KEY` for service-to-service authentication
👥 Enable Vercel Team Authentication for user-level access control

## Vercel Team Authentication

The List Import Agent requires Vercel Team Authentication for user access. This is configured in:
- `middleware.ts` - Handles authentication checks
- Vercel Project Settings - Enable "Vercel Authentication"

All imports are logged with the authenticated user's email for audit trails.

## Testing Configuration

For testing without external services:
- `OPENAI_API_KEY` - Use a test key with low rate limits
- `TRAY_WEBHOOK_URL` - Point to a webhook testing service like webhook.site
- `SCORING_AGENT_URL` - Point to a local development server or staging environment

## Troubleshooting

**AI features not working?**
→ Verify `OPENAI_API_KEY` is set and valid

**Send to Tray failing?**
→ Check `TRAY_WEBHOOK_URL` is correct and endpoint is accessible
→ Verify `TRAY_HEADERS` format is valid JSON

**Authentication errors?**
→ Ensure Vercel Team Auth is enabled in project settings
→ Check `INTERNAL_API_KEY` if using service-to-service calls

**Blocklist not working?**
→ Verify `DOMAIN_BLOCKLIST` and `COMPANY_BLOCKLIST` are comma-separated
→ Check for trailing commas or extra whitespace
