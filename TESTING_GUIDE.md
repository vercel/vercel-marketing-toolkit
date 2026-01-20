# Testing Guide - List Import Agent Migration

## Quick Start - Local Testing

### 1. Install Dependencies

```bash
cd /Users/corygabor/Downloads/vercel-marketing-toolkit
npm install
```

This will install all the new dependencies including:
- react-dropzone
- react-hook-form
- @hookform/resolvers
- sonner
- And other list-import dependencies

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Required for AI features
OPENAI_API_KEY=sk-your-api-key-here

# Required for List Import
TRAY_WEBHOOK_URL=https://your-tray-webhook.com/webhook
SCORING_AGENT_URL=https://your-scoring-agent.com/api/score

# Optional - for testing
DOMAIN_BLOCKLIST=vercel.com,test.com
COMPANY_BLOCKLIST=Vercel,Test Corp
```

You can copy these from your existing list-import-agent `.env.local` file.

### 3. Start the Development Server

```bash
npm run dev
```

The server will start on **http://localhost:3000**

### 4. Test the Integration

Open your browser to http://localhost:3000 and you should see:

1. **Homepage** - New "List Import Agent" tile in the grid (indigo color with Upload icon)
2. **Navigation** - "List Import" link in the top navigation bar
3. **Click the tile** - Navigate to /list-import

## Testing Checklist

### Homepage Tests
- [ ] List Import Agent tile appears in the grid
- [ ] Tile has correct title, description, and icon
- [ ] Clicking tile navigates to /list-import
- [ ] Dark/light theme toggle works
- [ ] Mobile responsive layout works

### Navigation Tests
- [ ] "List Import" appears in navigation menu
- [ ] Navigation link works on desktop
- [ ] Navigation link works on mobile menu
- [ ] Active state highlights when on /list-import page

### List Import Page Tests
- [ ] Page loads without errors
- [ ] Header with "Upload. Clean. Send." appears
- [ ] Upload stage displays correctly
- [ ] CSV upload dropzone works
- [ ] Google Sheets button is visible (if configured)

### Functionality Tests
1. **Upload CSV**
   - [ ] Drag and drop CSV file
   - [ ] Click to browse and upload
   - [ ] File parsing works
   - [ ] Data preview displays

2. **Column Mapping**
   - [ ] AI auto-mapping triggers
   - [ ] Column dropdowns work
   - [ ] Required fields are marked
   - [ ] Manual override works

3. **Validation**
   - [ ] Email validation works
   - [ ] Name cleaning works
   - [ ] Country normalization works
   - [ ] Blocklist checking works
   - [ ] Invalid rows are blocked

4. **Preview & Send**
   - [ ] Preview table displays all rows
   - [ ] Row selection checkboxes work
   - [ ] Export CSV button works
   - [ ] Send to Tray button works
   - [ ] Send to Scoring button works

### API Routes Tests

Test each API endpoint:

```bash
# Test column analysis
curl -X POST http://localhost:3000/api/analyze-columns \
  -H "Content-Type: application/json" \
  -d '{"columns": ["email", "first_name", "last_name"]}'

# Test validation
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{"rows": [{"email": "test@example.com"}]}'
```

### Authentication Tests
- [ ] Middleware allows access in development mode
- [ ] Protected API routes are accessible
- [ ] CORS headers are present on API responses

### Error Handling Tests
- [ ] Invalid CSV format shows error message
- [ ] Missing required fields shows validation error
- [ ] Network errors display user-friendly messages
- [ ] API failures are caught and displayed

## Common Issues & Fixes

### Issue: TypeScript errors after migration

**Fix:** Some components may need path adjustments:
```bash
# Check for import errors
npm run build
```

If you see import errors, they're likely:
- Missing UI components (copy from list-import `components/ui/`)
- Path mismatches (`@/components` vs relative paths)

### Issue: Styling looks different

**Fix:** The toolkit uses Tailwind v3, while list-import used v4. You may need to:
1. Check for v4-specific syntax in component styles
2. Verify dark mode classes work (dark: prefix)
3. Ensure color variables are correct

### Issue: AI features not working

**Fix:** Verify OPENAI_API_KEY is set:
```bash
# In your terminal
echo $OPENAI_API_KEY
# Or check the .env.local file
```

### Issue: Webpack/build errors

**Fix:** Clear Next.js cache:
```bash
rm -rf .next
npm run dev
```

### Issue: Module not found errors

**Fix:** Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Build Test

Before deploying, test the production build:

```bash
# Build the app
npm run build

# Start production server
npm start
```

This will catch any build-time issues before deployment.

## Component Compatibility Check

The list-import-agent uses these UI components that should already exist in the toolkit:
- Button
- Card
- Input
- Select
- Checkbox
- Progress
- Tabs
- Toast/Sonner
- Dialog
- ScrollArea

If any are missing, copy them from `/Users/corygabor/Downloads/list-import-agent/components/ui/`.

## Next Steps After Local Testing

Once local testing passes:

1. **Commit the changes:**
```bash
cd /Users/corygabor/Downloads/vercel-marketing-toolkit
git add .
git commit -m "feat: integrate list-import-agent into marketing toolkit

- Add list-import tile to homepage
- Port all API routes and components
- Add middleware with auth and CORS
- Update dependencies
- Add comprehensive documentation
"
git push origin feat/add-list-import-agent
```

2. **Create Pull Request**
   - Go to GitHub
   - Create PR from `feat/add-list-import-agent` to `main`
   - Add description and testing notes

3. **Deploy to Vercel Preview**
   - Vercel will auto-deploy the PR
   - Test on the preview URL
   - Verify environment variables are set

4. **Set Production Environment Variables**
   - Go to Vercel dashboard
   - Settings → Environment Variables
   - Add all variables from `LIST_IMPORT_ENV_VARS.md`

5. **Enable Vercel Team Auth**
   - Project Settings → Authentication
   - Enable "Vercel Team Authentication"
   - Add team members

6. **Merge and Deploy**
   - Merge PR to main
   - Vercel auto-deploys to production
   - Test production URL

## Rollback Plan

If issues arise in production:
- Keep the standalone list-import-agent deployment active
- Revert the PR in GitHub
- Redirect users back to standalone URL

The standalone is at: `/Users/corygabor/Downloads/list-import-agent`

## Support

For issues:
1. Check browser console for errors
2. Check Vercel function logs
3. Review this testing guide
4. Check `LIST_IMPORT_ENV_VARS.md` for configuration
