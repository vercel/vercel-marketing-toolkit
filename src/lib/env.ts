export const ENV = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  TRAY_WEBHOOK_URL: process.env.TRAY_WEBHOOK_URL || "",
  TRAY_HEADERS: process.env.TRAY_HEADERS ? JSON.parse(process.env.TRAY_HEADERS) : {},
  SCORING_WEBHOOK_URL: process.env.SCORING_WEBHOOK_URL || "https://79f33720-dc35-41ae-b0b8-75a167bddcf4.trayapp.io",
  SCORING_AGENT_URL: process.env.SCORING_AGENT_URL || "",
  DOMAIN_BLOCKLIST: process.env.DOMAIN_BLOCKLIST?.split(",") || ["vercel.com"],
  COMPANY_BLOCKLIST: process.env.COMPANY_BLOCKLIST?.split(",") || ["Vercel"],
  MAX_FILE_MB: Number.parseInt(process.env.MAX_FILE_MB || "25"),
  GPT_MODEL: process.env.GPT_MODEL || "gpt-4o-mini",
  GPT_TEMPERATURE: 0, // Zero temperature for deterministic, consistent results
  GPT_MAX_TOKENS: 400, // Balanced for detailed reasoning without timeout
}
