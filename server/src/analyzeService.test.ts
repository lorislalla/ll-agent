import { beforeEach, describe, expect, it, vi } from "vitest"
import { analyzeWithGemini, isRetryableGeminiError } from "./geminiAnalyzer.js"
import { analyzeWithMock } from "./mockAnalyzer.js"
import { analyzeCustomerRequest } from "./analyzeService.js"

vi.mock("./config.js", () => ({
  config: { provider: "auto", geminiApiKey: "test-key" }
}))

vi.mock("./geminiAnalyzer.js", () => ({
  analyzeWithGemini: vi.fn(),
  isRetryableGeminiError: vi.fn((error: unknown) => error instanceof Error && error.message === "retryable")
}))

vi.mock("./mockAnalyzer.js", () => ({
  analyzeWithMock: vi.fn(() => ({
    category: "Altro",
    urgency: "Bassa",
    summary: "Risultato mock",
    sentiment: "Neutro",
    missingInformation: [],
    recommendedAction: "Verificare la richiesta.",
    draftReply: "Grazie per averci contattato.",
    evidence: [],
    confidence: 0.5
  }))
}))

const geminiResult = {
  analysis: {
    category: "Richiesta informazioni" as const,
    urgency: "Bassa" as const,
    summary: "Richiesta di informazioni",
    sentiment: "Neutro",
    missingInformation: [],
    recommendedAction: "Fornire le informazioni richieste.",
    draftReply: "Grazie per averci contattato.",
    evidence: ["Vorrei maggiori informazioni"],
    confidence: 0.9
  },
  model: "gemini-test"
}

describe("analyzeCustomerRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isRetryableGeminiError).mockImplementation(
      error => error instanceof Error && error.message === "retryable"
    )
  })

  it("usa direttamente il mock quando viene richiesto", async () => {
    const result = await analyzeCustomerRequest("Vorrei maggiori informazioni sul servizio.", "mock")

    expect(analyzeWithGemini).not.toHaveBeenCalled()
    expect(analyzeWithMock).toHaveBeenCalledOnce()
    expect(result.provider).toBe("mock")
  })

  it("usa Gemini quando viene richiesto esplicitamente", async () => {
    vi.mocked(analyzeWithGemini).mockResolvedValueOnce(geminiResult)

    const result = await analyzeCustomerRequest("Vorrei maggiori informazioni sul servizio.", "gemini")

    expect(analyzeWithGemini).toHaveBeenCalledOnce()
    expect(result.provider).toBe("gemini")
  })

  it("ritenta una volta Gemini dopo un errore recuperabile", async () => {
    vi.mocked(analyzeWithGemini)
      .mockRejectedValueOnce(new Error("retryable"))
      .mockResolvedValueOnce(geminiResult)

    const result = await analyzeCustomerRequest("Vorrei maggiori informazioni sul servizio.", "auto")

    expect(analyzeWithGemini).toHaveBeenCalledTimes(2)
    expect(result.provider).toBe("gemini")
  })

  it("usa il mock se fallisce anche il secondo tentativo", async () => {
    vi.mocked(analyzeWithGemini).mockRejectedValue(new Error("retryable"))

    const result = await analyzeCustomerRequest("Vorrei maggiori informazioni sul servizio.", "auto")

    expect(analyzeWithGemini).toHaveBeenCalledTimes(2)
    expect(analyzeWithMock).toHaveBeenCalledOnce()
    expect(result.provider).toBe("mock")
    expect(result.fallbackReason).toBe("Gemini non disponibile o risposta non valida dopo il retry.")
  })

  it("non ritenta gli errori permanenti", async () => {
    vi.mocked(analyzeWithGemini).mockRejectedValue(new Error("GEMINI_API_KEY non valida"))
    vi.mocked(isRetryableGeminiError).mockReturnValue(false)

    const result = await analyzeCustomerRequest("Vorrei maggiori informazioni sul servizio.", "auto")

    expect(analyzeWithGemini).toHaveBeenCalledOnce()
    expect(result.provider).toBe("mock")
    expect(result.fallbackReason).toBe("Gemini non disponibile per un errore di configurazione o richiesta.")
  })
})
