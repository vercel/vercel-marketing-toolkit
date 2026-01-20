import { NextResponse } from "next/server"

// Test CSV endpoint for development/testing
export async function GET() {
  const testCSV = `Email,FullName,Company,Country,State,Phone,Website,Title
jane.doe@example.com,Jane Doe,Acme inc,United States,Washington,(206) 555-0123,acme.com,sr mktg dir
alex@vercel.com,Alex Vercel,Vercel,US,CA,+1 415 555 0000,vercel.com,Engineer
john.smith@test.com,John Smith,Test Corp,Canada,ON,416-555-0199,testcorp.ca,Manager
invalid-email,Bad Data,Bad Company,Unknown,XX,bad-phone,bad-website,bad title`

  return new NextResponse(testCSV, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=test-contacts.csv",
    },
  })
}
