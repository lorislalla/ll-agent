import { describe, expect, it } from "vitest"
import { analyzeWithMock } from "./mockAnalyzer.js"

describe("analyzeWithMock", () => {
  it("classifica una richiesta tecnica urgente", () => {
    const result = analyzeWithMock("Non riusciamo ad accedere alla piattaforma, siamo bloccati e ci serve aiuto urgente.")

    expect(result.category).toBe("Problema tecnico")
    expect(result.urgency).toBe("Alta")
    expect(result.draftReply.length).toBeGreaterThan(40)
  })

  it("segnala informazioni mancanti per messaggi ambigui", () => {
    const result = analyzeWithMock("Non va. Aiuto.")

    expect(result.category).toBe("Messaggio ambiguo/incompleto")
    expect(result.missingInformation.length).toBeGreaterThan(0)
  })
})
