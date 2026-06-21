import "dotenv/config"

export type AnalysisProvider = "mock" | "gemini" | "auto"

// Legge il provider richiesto dall'ambiente e usa il mock come default sicuro.
function readProvider(): AnalysisProvider {
  const value = process.env.ANALYSIS_PROVIDER
  if (value === "gemini" || value === "auto" || value === "mock") return value
  return "mock"
}

// Legge una o più origini frontend consentite, separate da virgola.
function readCorsOrigins(): string[] {
  return (process.env.CORS_ORIGIN || "http://localhost:4300")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean)
}

export const config = {
  port: Number(process.env.PORT || 3333),
  provider: readProvider(),
  corsOrigins: readCorsOrigins(),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModelAnalysis: process.env.MODEL_BASE || "gemini-3.5-flash",
  geminiModelFast: process.env.MODEL_FAST || "gemini-3.1-flash-lite"
}
