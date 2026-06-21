import { DatePipe, NgFor, NgIf, PercentPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type AnalysisMode = 'auto' | 'mock' | 'gemini';
type CopyFeedback = 'idle' | 'success' | 'error';
const MAX_REQUEST_LENGTH = 8000;
type AnalysisCategory =
  | 'Problema tecnico'
  | 'Richiesta commerciale'
  | 'Reclamo'
  | 'Richiesta informazioni'
  | 'Richiesta urgente'
  | 'Messaggio ambiguo/incompleto'
  | 'Altro';
type AnalysisUrgency = 'Bassa' | 'Media' | 'Alta';

interface ExampleRequest {
  id: string;
  title: string;
  text: string;
}

interface Analysis {
  category: AnalysisCategory;
  urgency: AnalysisUrgency;
  summary: string;
  sentiment: string;
  missingInformation: string[];
  recommendedAction: string;
  draftReply: string;
  evidence: string[];
  confidence: number;
}

interface AnalyzeResponse {
  analysis: Analysis;
  provider: 'mock' | 'gemini';
  model: string;
  generatedAt: string;
  fallbackReason?: string;
}

interface SavedAnalysis extends AnalyzeResponse {
  requestText: string;
}

@Component({
  selector: 'app-root',
  imports: [DatePipe, FormsModule, NgFor, NgIf, PercentPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly historyKey = 'll-agent-history';

  requestText = '';
  editableReply = '';
  mode: AnalysisMode = 'auto';

  examples = signal<ExampleRequest[]>([]);
  lastResult = signal<SavedAnalysis | null>(null);
  history = signal<SavedAnalysis[]>([]);
  loading = signal(false);
  error = signal('');
  inputError = signal('');
  copyFeedback = signal<CopyFeedback>('idle');

  // Carica esempi e storico locale quando l'applicazione viene inizializzata.
  ngOnInit(): void {
    this.loadExamples();
    this.loadHistory();
  }

  // Invia la richiesta al backend e aggiorna risultato, bozza e storico.
  analyze(): void {
    const text = this.requestText.trim();
    if (text.length < 10) return;
    if (text.length > MAX_REQUEST_LENGTH) {
      this.inputError.set(`La richiesta non può superare ${MAX_REQUEST_LENGTH} caratteri.`);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.inputError.set('');

    this.http.post<AnalyzeResponse>('/api/analyze', { text, mode: this.mode }).subscribe({
      next: (result) => {
        const savedResult = { ...result, requestText: text, analysis: { ...result.analysis } };
        this.lastResult.set(savedResult);
        this.editableReply = savedResult.analysis.draftReply;
        this.addToHistory(savedResult);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Errore durante la chiamata al backend.');
        this.loading.set(false);
      }
    });
  }

  // Importa il contenuto del file testuale selezionato nella richiesta.
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.inputError.set('');
    try {
      const content = (await file.text()).trim();
      if (content.length > MAX_REQUEST_LENGTH) {
        this.inputError.set(`Il file supera il limite di ${MAX_REQUEST_LENGTH} caratteri.`);
        return;
      }
      this.requestText = content;
    } catch {
      this.inputError.set('Impossibile leggere il file selezionato.');
    } finally {
      input.value = '';
    }
  }

  // Copia un caso di esempio nell'area di inserimento.
  useExample(example: ExampleRequest): void {
    this.requestText = example.text;
    this.error.set('');
    this.inputError.set('');
  }

  // Ripristina lo stato iniziale dell'area di lavoro.
  clear(): void {
    this.requestText = '';
    this.editableReply = '';
    this.lastResult.set(null);
    this.error.set('');
    this.inputError.set('');
    this.copyFeedback.set('idle');
  }

  // Copia la risposta revisionata e conferma brevemente l'azione all'operatore.
  copyReply(): void {
    if (!this.editableReply.trim()) return;
    if (!navigator.clipboard) {
      this.showCopyFeedback('error');
      return;
    }

    void navigator.clipboard.writeText(this.editableReply).then(() => {
      this.showCopyFeedback('success');
    }).catch(() => this.showCopyFeedback('error'));
  }

  // Riapre un'analisi salvata con richiesta e revisioni effettuate dall'operatore.
  restoreHistory(item: SavedAnalysis): void {
    const restored = { ...item, analysis: { ...item.analysis } };
    this.lastResult.set(restored);
    this.requestText = item.requestText || '';
    this.editableReply = restored.analysis.draftReply;
    this.inputError.set('');
    this.copyFeedback.set('idle');
  }

  // Salva nello storico le modifiche a categoria, urgenza e bozza di risposta.
  saveCurrentRevision(): void {
    const current = this.lastResult();
    if (!current) return;

    const revised = {
      ...current,
      analysis: { ...current.analysis, draftReply: this.editableReply }
    };
    const next = this.history().map(item => item.generatedAt === current.generatedAt ? revised : item);
    this.lastResult.set(revised);
    this.history.set(next);
    localStorage.setItem(this.historyKey, JSON.stringify(next));
  }

  // Esporta lo storico corrente come file JSON.
  exportHistory(): void {
    const blob = new Blob([JSON.stringify(this.history(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'll-agent-history.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  // Recupera dal backend i casi dimostrativi disponibili.
  private loadExamples(): void {
    this.http.get<{ examples: ExampleRequest[] }>('/api/examples').subscribe({
      next: (response) => this.examples.set(response.examples),
      error: () => this.error.set('Impossibile caricare gli esempi dal backend.')
    });
  }

  // Ripristina fino a otto analisi salvate nel browser.
  private loadHistory(): void {
    const raw = localStorage.getItem(this.historyKey);
    if (!raw) return;

    try {
      this.history.set(JSON.parse(raw).slice(0, 8));
    } catch {
      localStorage.removeItem(this.historyKey);
    }
  }

  // Inserisce un risultato in testa allo storico e lo salva nel browser (localStorage).
  private addToHistory(result: SavedAnalysis): void {
    const next = [result, ...this.history()].slice(0, 8);
    this.history.set(next);
    localStorage.setItem(this.historyKey, JSON.stringify(next));
  }

  // Mostra temporaneamente l'esito della copia senza interrompere il flusso di lavoro.
  private showCopyFeedback(feedback: Exclude<CopyFeedback, 'idle'>): void {
    this.copyFeedback.set(feedback);
    window.setTimeout(() => this.copyFeedback.set('idle'), 1600);
  }
}
