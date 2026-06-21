# Possibili miglioramenti

## Premessa

Ho mantenuto volutamente il progetto piccolo e focalizzato sul flusso principale: inserimento della richiesta, analisi AI o mock, revisione manuale e storico locale. Con più tempo da dedicarci, procederei con i seguenti miglioramenti, ho distinto quelli già suggeriti nella traccia da quelli che ho pensato durante la progettazione e sviluppo.

## Bonus della traccia già inclusi

Il prototipo include già storico locale, esportazione JSON, evidenze associate all'analisi, test automatici e design responsive. Ho preferito completare e verificare questi aspetti prima di ampliare ulteriormente il progetto.

## Bonus indicati nella traccia da sviluppare

### Evidenziazione nel testo originale

Il backend restituisce già le frasi che giustificano categoria e urgenza. Il passo successivo sarebbe evidenziarle direttamente nella richiesta originale, rendendo più semplice verificare il ragionamento dell'AI. Andrebbe gestito anche il caso in cui Gemini riformuli una frase invece di restituirla in modo identico.

### Feedback dell'operatore

Aggiungerei una valutazione "Utile / Non utile" e una nota facoltativa. Il feedback dovrebbe essere associato a provider, modello e versione del prompt, così da poter confrontare nel tempo la qualità dei modelli AI.

### Multilingua e varianti della risposta

Per un contesto customer care internazionale bisognerebbe aggiungere una rilevazione della lingua della richiesta e produrre la risposta nella stessa lingua. Bisognerebbe inoltre dare la possibilità all'operatore di scegliere tra risposta sintetica o dettagliata, evitando di generare sempre entrambe senza un'esigenza concreta.

## Miglioramenti individuati durante lo sviluppo

### Tipi condivisi e validazione dati in lettura

Frontend e backend dichiarano attualmente tipi simili. Bisognerebbe unificare il tutto o gerarli direttamente dallo schema Zod. Validerei inoltre i dati letti da "localStorage" (come faccio lato backend con le risposte dell'AI).

### Versionamento di prompt e valutazioni

Assocerei a ogni analisi la versione del prompt. Insieme al feedback dell'operatore, per permettere di confrontare modifiche diverse senza basarsi soltanto su impressioni qualitative.

### Persistenza e accesso multi-operatore

Sarebbero da implementare persistenza centralizzata, autenticazione e ruoli, salvando richiesta originale, analisi iniziale, revisioni, feedback, provider, modello, versione del prompt e timestamp della richiesta.

### Streaming (da valutare se necessario)

Con l'attuale output JSON strutturato, lo streaming aggiungerebbe complessità e poco valore. Lo introdurrei solo se la latenza diventasse un problema reale.

## Ordine di priorità

Come primo incremento sceglierei evidenziazione delle evidenze e feedback operatore, perché aumentano la comprensione dell'output dell'AI e la capacità di valutarlo. Successivamente lavorerei sul resto.
