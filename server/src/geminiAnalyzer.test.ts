import { describe, expect, it } from "vitest"
import { buildPrompt, isRetryableGeminiError } from "./geminiAnalyzer.js"

describe("buildPrompt", () => {
  it("include le regole che limitano invenzioni e valori non ammessi", () => {
    const prompt = buildPrompt("Vorrei maggiori informazioni sul servizio.")

    expect(prompt).toContain("Non inventare dettagli non presenti")
    expect(prompt).toContain("Le informazioni mancanti devono essere operative")
    expect(prompt).toContain("Urgenza ammessa: Bassa, Media, Alta")
    expect(prompt).toContain("Vorrei maggiori informazioni sul servizio.")
  })
})

describe("isRetryableGeminiError", () => {
  it("ritenta errori temporanei ma non errori di configurazione", () => {
    expect(isRetryableGeminiError({ status: 503 })).toBe(true)
    expect(isRetryableGeminiError(new Error("Network timeout"))).toBe(true)
    expect(isRetryableGeminiError(new Error("GEMINI_API_KEY non valida"))).toBe(false)
  })
})
