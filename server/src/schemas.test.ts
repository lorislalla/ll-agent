import { describe, expect, it } from "vitest"
import { AnalysisSchema, CustomerRequestSchema } from "./schemas.js"

const validAnalysis = {
  category: "Richiesta informazioni",
  urgency: "Bassa",
  summary: "Il cliente richiede informazioni.",
  sentiment: "Neutro",
  missingInformation: [],
  recommendedAction: "Fornire i dettagli richiesti.",
  draftReply: "Grazie per averci contattato.",
  evidence: ["Vorrei maggiori informazioni"],
  confidence: 0.8
}

describe("CustomerRequestSchema", () => {
  it("rifiuta testi troppo brevi e modalità non supportate", () => {
    expect(CustomerRequestSchema.safeParse({ text: "Breve" }).success).toBe(false)
    expect(CustomerRequestSchema.safeParse({ text: "Richiesta sufficientemente lunga", mode: "altro" }).success).toBe(false)
  })

  it("applica la modalità automatica quando non viene specificata", () => {
    const result = CustomerRequestSchema.parse({ text: "Richiesta sufficientemente lunga" })

    expect(result.mode).toBe("auto")
  })
})

describe("AnalysisSchema", () => {
  it("accetta un output completo con valori ammessi", () => {
    expect(AnalysisSchema.safeParse(validAnalysis).success).toBe(true)
  })

  it("rifiuta categoria, urgenza e confidenza fuori contratto", () => {
    expect(AnalysisSchema.safeParse({ ...validAnalysis, category: "Inventata" }).success).toBe(false)
    expect(AnalysisSchema.safeParse({ ...validAnalysis, urgency: "Critica" }).success).toBe(false)
    expect(AnalysisSchema.safeParse({ ...validAnalysis, confidence: 1.5 }).success).toBe(false)
  })
})
