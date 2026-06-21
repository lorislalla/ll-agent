import { z } from "zod"

export const CustomerRequestSchema = z.object({
  text: z.string().trim().min(10, "Inserisci almeno 10 caratteri.").max(8000),
  mode: z.enum(["auto", "mock", "gemini"]).optional().default("auto")
})

export const AnalysisSchema = z.object({
  category: z.enum([
    "Problema tecnico",
    "Richiesta commerciale",
    "Reclamo",
    "Richiesta informazioni",
    "Richiesta urgente",
    "Messaggio ambiguo/incompleto",
    "Altro"
  ]),
  urgency: z.enum(["Bassa", "Media", "Alta"]),
  summary: z.string().min(1),
  sentiment: z.string().min(1),
  missingInformation: z.array(z.string()).default([]),
  recommendedAction: z.string().min(1),
  draftReply: z.string().min(1),
  evidence: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1)
})

export const AnalyzeResponseSchema = z.object({
  analysis: AnalysisSchema,
  provider: z.enum(["mock", "gemini"]),
  model: z.string(),
  generatedAt: z.string(),
  fallbackReason: z.string().optional()
})

export type CustomerRequest = z.infer<typeof CustomerRequestSchema>
export type Analysis = z.infer<typeof AnalysisSchema>
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>
