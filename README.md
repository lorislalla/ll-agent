# LL Agent

Prototipo web per analizzare richieste cliente con AI o modalita mock. L'obiettivo e aiutare un operatore a capire rapidamente categoria, urgenza, sentiment, informazioni mancanti, azione consigliata e bozza di risposta modificabile.

## Stack

- Frontend: Angular 21.
- Backend: Node.js, Express, TypeScript.
- AI: Google Gemini tramite `@google/genai` o mock.
- Validazione: Zod sul backend.

## Avvio locale

Prerequisiti: Node.js 24+ e npm.

Eseguire:

```bash
npm install
npm run dev
```

Poi aprire nel browser:

- http://localhost:4300 per la versione originale.

Oppure:

- http://localhost:4300/v2 per la versione a tab.

Il backend parte su http://localhost:3333; Angular usa client/proxy.conf.json per chiamare /api.

## Modalita AI

Di default il progetto usa la modalità mock, cosi la demo funziona senza configurazioni esterne.

Per usare la modalità AI reale, il progetto chiama la Gemini Developer API tramite una chiave ottenibile da Google AI Studio.

Dopo aver ottenuto la chiave, bisogna creare il file .env (da inserire nella root della cartella 'server') con le seguenti variabili d'ambiente:

ANALYSIS_PROVIDER=auto
GEMINI_API_KEY=[la mia chiave]
MODEL_BASE=gemini-3.5-flash
MODEL_FAST=gemini-3.1-flash-lite

La UI permette anche di forzare 'Mock', 'Gemini' o 'Auto' per la singola analisi.

## Scelte progettuali

Ho tenuto il prototipo volutamente piccolo: una singola API /api/analyze, una UI operatore e un dataset di esempi (fornito da /api/examples).

Il backend separa tre responsabilità:

- mockAnalyzer: fallback demo sempre disponibile.
- geminiAnalyzer: prompt, scelta modello e parsing JSON.
- analyzeService: decide se usare mock, Gemini o fallback.

La risposta AI è validata con Zod prima di arrivare al frontend. Questo riduce output errati e aumenta la stabilità.

## Due modelli Gemini

C'è una scelta di modello in base alla complessità della richiesta:

- leggero per richieste semplici
- più pesante per richieste lunghe, urgenti o delicate.

Questa scelta serve per ridurre costi/latenze inutili.

## Funzionalità incluse

- Inserimento testo tramite textarea.
- Upload di file .txt o .md.
- 5 esempi di richieste cliente.
- Analisi con categoria, urgenza, sentiment, riassunto, informazioni mancanti, azione consigliata, evidenze e confidenza.
- Bozza risposta modificabile e copiabile.
- Storico locale nel browser.
- Esportazione JSON dello storico.
- Stati di caricamento, errore e risultato.

## Verifica

```bash
npm run test
npm run build
```

Per eseguire anche il test end-to-end, installare Chromium una sola volta e avviare Playwright:

```bash
npx playwright install chromium
npm run test:e2e
```

## Limiti noti

- Lo storico è solo in localStorage, quindi non è condiviso tra utenti o browser.
- Mancano autenticazione, ruoli o database.
- Non ho incluso osservabilità (Langfuse o altro) in questa versione.

## Privacy e sicurezza

Le richieste possono contenere dati personali o informazioni aziendali. In modalità Gemini il testo viene inviato al provider AI; in modalità mock resta nel flusso locale dell'applicazione. Il backend non registra nei log il contenuto completo delle richieste.

Lo storico è salvato nel `localStorage` del browser e può quindi contenere testo cliente e revisioni dell'operatore. Non è sincronizzato né cifrato dall'applicazione: su dispositivi condivisi va cancellato tramite gli strumenti del browser.

L'API applica un limite di 30 analisi al minuto per indirizzo e accetta richieste browser soltanto dalle origini indicate in `CORS_ORIGIN`. Le chiavi API devono essere conservate esclusivamente nel file `.env`, già escluso da Git; `.env.example` contiene soltanto valori dimostrativi.

Queste misure sono adeguate al prototipo, ma non sostituiscono autenticazione, autorizzazione, cifratura e policy di conservazione necessarie in produzione.

## Fonti tecniche

- [Gemini API docs](https://ai.google.dev/gemini-api/docs)
- [Google Gen AI JavaScript SDK](https://googleapis.github.io/js-genai/)
- [Angular CLI](https://angular.dev/tools/cli)
