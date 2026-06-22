import type { NextFunction, Request, Response } from "express"
import cors from "cors"
import express from "express"
import { rateLimit } from "express-rate-limit"
import { analyzeCustomerRequest } from "./analyzeService.js"
import { config } from "./config.js"
import { examples } from "./examples.js"
import { CustomerRequestSchema } from "./schemas.js"

const app = express()
const analyzeRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Troppe richieste di analisi. Riprova tra un minuto." }
})

app.use(cors({ origin: config.corsOrigins }))
app.use(express.json({ limit: "1mb" }))

// Espone lo stato del servizio e il provider configurato.
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, provider: config.provider })
})

// Restituisce i casi di esempio disponibili nell'interfaccia.
app.get("/api/examples", (_req, res) => {
  res.json({ examples })
})

// Valida la richiesta e restituisce l'analisi prodotta dal provider selezionato, solo se l'utente non ha superato il limite di richieste al minuto.
app.post("/api/analyze", analyzeRateLimit, async (req, res) => {
  const parsed = CustomerRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message || "Richiesta non valida" })
    return
  }

  try {
    const result = await analyzeCustomerRequest(parsed.data.text, parsed.data.mode)
    res.json(result)
  } catch {
    res.status(502).json({ message: "Servizio AI non disponibile. Usa la modalità mock o riprova." })
  }
})

// Trasforma gli errori di parsing JSON in una risposta comprensibile al client.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof SyntaxError) {
    res.status(400).json({ message: "JSON non valido nella richiesta." })
    return
  }
  res.status(500).json({ message: "Errore interno del servizio." })
})

// Avvia l'API sulla porta configurata e segnala l'indirizzo locale.
app.listen(config.port, () => {
  console.log(`LL Agent API avviata su http://localhost:${config.port}`)
})
