import type { Analysis } from "./schemas.js"

const CATEGORY_RULES: Array<{ category: Analysis["category"], keywords: string[] }> = [
  { category: "Problema tecnico", keywords: ["errore", "accesso", "login", "piattaforma", "bug", "non funziona", "blocc"] },
  { category: "Richiesta commerciale", keywords: ["preventivo", "demo", "prezzo", "abbonamento", "licenza", "acquist"] },
  { category: "Reclamo", keywords: ["reclamo", "deluso", "disservizio", "rimborso", "insoddisf"] },
  { category: "Richiesta informazioni", keywords: ["informazioni", "vorrei sapere", "come funziona", "dettagli"] }
]

// Costruisce un'analisi deterministica applicando regole lessicali al testo del cliente.
export function analyzeWithMock(text: string): Analysis {
  const normalized = text.toLowerCase()
  const category = CATEGORY_RULES.find(rule =>
    rule.keywords.some(keyword => normalized.includes(keyword))
  )?.category ?? (text.length < 80 ? "Messaggio ambiguo/incompleto" : "Altro")

  const urgency = inferUrgency(normalized)
  const missingInformation = inferMissingInformation(normalized, category)

  return {
    category,
    urgency,
    summary: buildSummary(text),
    sentiment: inferSentiment(normalized, urgency),
    missingInformation,
    recommendedAction: buildRecommendedAction(category, urgency, missingInformation),
    draftReply: buildDraftReply(category, urgency, missingInformation),
    evidence: pickEvidence(text),
    confidence: category === "Messaggio ambiguo/incompleto" ? 0.58 : 0.78
  }
}

// Stima l'urgenza cercando indicatori temporali o di blocco nel testo.
function inferUrgency(text: string): Analysis["urgency"] {
  if (["urgente", "subito", "bloccati", "domani", "immediato", "grave"].some(word => text.includes(word))) return "Alta"
  if (["problema", "errore", "reclamo", "ritardo"].some(word => text.includes(word))) return "Media"
  return "Bassa"
}

// Deduce il tono del cliente dagli indicatori emotivi e dal livello di urgenza.
function inferSentiment(text: string, urgency: Analysis["urgency"]): string {
  if (text.includes("deluso") || text.includes("insoddisf") || text.includes("reclamo")) return "Negativo / insoddisfatto"
  if (urgency === "Alta") return "Preoccupato / urgente"
  if (text.includes("grazie") || text.includes("vorrei")) return "Neutro / collaborativo"
  return "Neutro"
}

// Elenca i dettagli operativi mancanti in base alla categoria individuata.
function inferMissingInformation(text: string, category: Analysis["category"]): string[] {
  const missing: string[] = []
  if (category === "Problema tecnico") {
    if (!text.includes("account") && !text.includes("utente")) missing.push("Account o utente coinvolto")
    if (!text.includes("errore")) missing.push("Messaggio di errore visualizzato")
    missing.push("Numero di utenti impattati")
  }
  if (category === "Richiesta commerciale") {
    missing.push("Dimensione azienda o numero utenti")
    missing.push("Prodotto o piano di interesse")
  }
  if (category === "Messaggio ambiguo/incompleto") {
    missing.push("Obiettivo della richiesta")
    missing.push("Contesto operativo")
  }
  return [...new Set(missing)].slice(0, 4)
}

// Normalizza la richiesta e la tronca alla lunghezza prevista per il riassunto.
function buildSummary(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length <= 160 ? clean : `${clean.slice(0, 157).trim()}...`
}

// Propone il prossimo passo operativo in base a categoria, urgenza e dati mancanti.
function buildRecommendedAction(
  category: Analysis["category"],
  urgency: Analysis["urgency"],
  missingInformation: string[]
): string {
  if (category === "Problema tecnico") {
    return urgency === "Alta"
      ? "Aprire un ticket prioritario al supporto tecnico e raccogliere subito i dettagli mancanti."
      : "Creare un ticket tecnico ordinario e chiedere le informazioni necessarie per la diagnosi."
  }
  if (category === "Richiesta commerciale") return "Assegnare la richiesta al team commerciale e qualificare il bisogno."
  if (category === "Reclamo") return "Rispondere con presa in carico formale e far gestire il caso a un referente."
  if (missingInformation.length > 0) return "Chiedere chiarimenti prima di assegnare definitivamente la richiesta."
  return "Rispondere con una prima presa in carico e assegnare al reparto competente."
}

// Prepara una risposta iniziale adattata al tipo di richiesta e alla sua priorità.
function buildDraftReply(
  category: Analysis["category"],
  urgency: Analysis["urgency"],
  missingInformation: string[]
): string {
  const priority = urgency === "Alta" ? "con priorita alta" : "quanto prima"
  const missing = missingInformation.length > 0
    ? ` Per procedere, ci servirebbero: ${missingInformation.join(", ")}.`
    : ""

  if (category === "Reclamo") {
    return `Buongiorno, ci dispiace per il disservizio segnalato. Abbiamo preso in carico la richiesta ${priority} e la inoltriamo al referente competente.${missing}`
  }
  return `Buongiorno, grazie per averci contattato. Abbiamo preso in carico la richiesta ${priority} e la assegniamo al team piu adatto.${missing}`
}

// Estrae fino a tre frasi utili a motivare categoria e urgenza assegnate.
function pickEvidence(text: string): string[] {
  return text
    .split(/[.!?\n]/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 15)
    .slice(0, 3)
}
