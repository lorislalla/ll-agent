import { config, type AnalysisProvider } from "./config.js"
import { analyzeWithGemini, isRetryableGeminiError } from "./geminiAnalyzer.js"
import { analyzeWithMock } from "./mockAnalyzer.js"
import type { AnalyzeResponse } from "./schemas.js"

// Seleziona il provider e, in modalità automatica, ripiega sul mock se Gemini fallisce.
export async function analyzeCustomerRequest(text: string, requestedMode: AnalysisProvider): Promise<AnalyzeResponse> {
  const effectiveMode = requestedMode === "auto" ? config.provider : requestedMode

  if (effectiveMode === "gemini") {
    const result = await analyzeWithGeminiWithRetry(text)
    return buildResponse(result.analysis, "gemini", result.model)
  }

  if (effectiveMode === "auto" && config.geminiApiKey) {
    try {
      const result = await analyzeWithGeminiWithRetry(text)
      return buildResponse(result.analysis, "gemini", result.model)
    } catch (error) {
      return buildResponse(analyzeWithMock(text), "mock", "rules", getSafeFallbackReason(error))
    }
  }

  return buildResponse(analyzeWithMock(text), "mock", "rules")
}

// Ripete una sola volta la chiamata Gemini quando l'errore è considerato "recuperabile".
async function analyzeWithGeminiWithRetry(text: string): ReturnType<typeof analyzeWithGemini> {
  try {
    return await analyzeWithGemini(text)
  } catch (error) {
    if (!isRetryableGeminiError(error)) throw error
    return analyzeWithGemini(text)
  }
}

// Uniforma i risultati dei provider nel contratto restituito dall'API.
function buildResponse(
  analysis: AnalyzeResponse["analysis"],
  provider: AnalyzeResponse["provider"],
  model: string,
  fallbackReason?: string
): AnalyzeResponse {
  return {
    analysis,
    provider,
    model,
    generatedAt: new Date().toISOString(),
    ...(fallbackReason ? { fallbackReason } : {})
  }
}

// Espone al client una motivazione utile senza includere dettagli tecnici del provider.
function getSafeFallbackReason(error: unknown): string {
  return isRetryableGeminiError(error)
    ? "Gemini non disponibile o risposta non valida dopo il retry."
    : "Gemini non disponibile per un errore di configurazione o richiesta."
}
