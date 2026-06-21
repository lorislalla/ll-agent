# Nota progettuale

## UX

Ho progettato l'interfaccia pensando a un operatore customer care che deve comprendere e gestire una richiesta rapidamente.
Su schermi grandi le tre aree principali sono visibili contemporaneamente: a sinistra si inserisce o si seleziona la richiesta, al centro si consulta e revisiona l'analisi, a destra si recupera lo storico locale.
Questa disposizione segue il flusso naturale di lavoro: input, decisione, memoria e permette di vedere a colpo d'occhio tutte le funzionalità richieste senza cambiare pagina.

L'interfaccia dà una priorità a categoria, urgenza e azione consigliata e evidenzia le richieste urgenti anche nello storico.
Gli stati di attesa, caricamento, errore e risultato sono distinti.
Categoria, urgenza e bozza di risposta sono modificabili (l'AI deve supportare la decisione, ma non sostituire il controllo umano).
Le revisioni vengono salvate nel browser in modo automatico e lo storico può essere esportato in JSON.
Il layout è responsive: sui dispositivi più piccoli i pannelli vengono disposti verticalmente, mantenendo sempre lo stesso ordine logico.

## Architettura

Ho scelto un'architettura client-server semplice. Il frontend, con Angular, gestisce interfaccia e stato locale, mentre il backend, con Express, valida le richieste, seleziona il metodo di analisi e restituisce un output stabile/standardizzato. In questo modo chiavi API, prompt e logica di orchestrazione non sono esposti nel browser.

Nel backend ho separato le responsabilità: 'geminiAnalyzer' contiene l'integrazione con Gemini, 'mockAnalyzer' implementa la modalità demo e 'analyzeService' decide quale provider utilizzare. Gli schemi di Zod fanno da tramite tra input esterni e applicazione. Con questa struttura si può cambiare facilmente modello o il provider senza modificare la parte frontend.

Ho evitato di inserire un database, autenticazione e altre cose al momento non necessarie. Una persistenza centralizzata sarebbe stata indispensabile in un contesto multi-operatore.

## Gestione AI

Gemini riceve un prompt con categorie, livelli di urgenza e regole esplicite (tra cui non inventare informazioni e produrre evidenze tratte dalla richiesta). La temperatura, impostata a 0.2, riduce la creatività. La risposta viene richiesta in JSON strutturato e validata con Zod prima di raggiungere il frontend: un testo formalmente valido ma non conforme ai valori ammessi viene quindi rifiutato.

Il modello viene scelto in base alla complessità: quello più rapido e meno costoso è usato per richieste semplici, mentre quello più completo è riservato a testi lunghi o con urgenze/anomalie critiche. La risposta conterrà sempre provider e modello utilizzati, rendendoli visibili all'operatore.

La modalità mock garantisce che la demo funzioni anche senza servizi esterni.

In caso di risposta vuota, JSON non valido, mancato rispetto dello schema o errore temporaneo, il sistema ripete una sola volta la chiamata a Gemini. Gli errori permanenti, come una configurazione errata, non vengono ritentati per evitare latenza e chiamate inutili. Se anche il secondo tentativo fallisce, in modalità automatica il sistema userà il mock e comunicherà il motivo del fallback.
