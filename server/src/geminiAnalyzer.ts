import { GoogleGenAI, Type } from "@google/genai"
import { config } from "./config.js"
import { AnalysisSchema, type Analysis } from "./schemas.js"

const RETRYABLE_RESPONSE_ERROR = "RetryableGeminiResponseError"

// Richiede l'analisi a Gemini e valida la risposta prima di esporla all'applicazione.
export async function analyzeWithGemini(text: string): Promise<{ analysis: Analysis, model: string }> {
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY non configurata")
  }

  const model = chooseModel(text)
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey })

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: buildPrompt(text) }] }],
    config: {
      temperature: 0.2, // Deve essere basso per avere una risposta più deterministica
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          urgency: { type: Type.STRING },
          summary: { type: Type.STRING },
          sentiment: { type: Type.STRING },
          missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedAction: { type: Type.STRING },
          draftReply: { type: Type.STRING },
          evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence: { type: Type.NUMBER }
        },
        required: [
          "category",
          "urgency",
          "summary",
          "sentiment",
          "missingInformation",
          "recommendedAction",
          "draftReply",
          "evidence",
          "confidence"
        ]
      }
    }
  })

  const raw = response.text
  if (!raw) throw createRetryableResponseError("Risposta Gemini vuota")

  let candidate: unknown
  try {
    candidate = JSON.parse(raw)
  } catch {
    throw createRetryableResponseError("Risposta Gemini con JSON non valido")
  }

  // Questo è lo schema con cui validiamo la struttura della risposta di Gemini prima di esporla all'applicazione.
  const parsed = AnalysisSchema.safeParse(candidate)
  if (!parsed.success) {
    const details = parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ")
    throw createRetryableResponseError(`Risposta Gemini non conforme allo schema: ${details}`)
  }

  return { analysis: parsed.data, model }
}

// Distingue gli errori temporanei o di risposta dagli errori permanenti di configurazione.
export function isRetryableGeminiError(error: unknown): boolean {
  if (error instanceof Error && error.name === RETRYABLE_RESPONSE_ERROR) return true
  if (typeof error !== "object" || error === null) return false

  const details = error as Record<string, unknown>
  const status = Number(details["status"] ?? details["code"])
  if (status === 408 || status === 429 || status >= 500) return true

  const message = error instanceof Error ? error.message : String(details["message"] ?? "")
  return /timeout|timed out|temporar|network|fetch failed|econnreset|etimedout/i.test(message)
}

// Marca gli output Gemini vuoti o non validi come recuperabili con un nuovo tentativo.
function createRetryableResponseError(message: string): Error {
  const error = new Error(message)
  error.name = RETRYABLE_RESPONSE_ERROR
  return error
}

// Riserva il modello più completo alle richieste lunghe o potenzialmente critiche.
function chooseModel(text: string): string {
  const lower = text.toLowerCase()
  const looksCritical = ["urgente", "blocc", "reclamo", "rimborso", "legale", "domani"].some(word => lower.includes(word))
  return looksCritical || text.length > 900 ? config.geminiModelAnalysis : config.geminiModelFast
}

// Definisce istruzioni, valori ammessi e testo cliente inviati al modello.
export function buildPrompt(text: string): string {
  return `Sei un assistente per operatori customer care.
Analizza la richiesta cliente e restituisci SOLO JSON valido.

Categorie ammesse:
- Problema tecnico
- Richiesta commerciale
- Reclamo
- Richiesta informazioni
- Richiesta urgente
- Messaggio ambiguo/incompleto
- Altro

Urgenza ammessa: Bassa, Media, Alta.

Regole:
- Non inventare dettagli non presenti.
- Le informazioni mancanti devono essere operative e chiedibili al cliente.
- La bozza di risposta deve essere pronta da inviare ma modificabile da un operatore.
- Il campo 'evidence' contiene brevi frasi del testo cliente che giustificano categoria/urgenza.
- Il campo 'confidence' è un numero tra 0 e 1.

RICHIESTA CLIENTE:
${text}`
}
