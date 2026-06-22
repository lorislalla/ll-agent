import { DatePipe, NgFor, NgIf, PercentPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { App } from './app';

type WorkspaceTab = 'request' | 'analysis' | 'history';
type HistorySort = 'date' | 'urgency';

const urgencyOrder = { Alta: 0, Media: 1, Bassa: 2 } as const;

@Component({
  selector: 'app-v2',
  imports: [DatePipe, FormsModule, NgFor, NgIf, PercentPipe],
  templateUrl: './app-v2.html',
  styleUrl: './app-v2.css'
})
export class AppV2 extends App {
  activeTab = signal<WorkspaceTab>('request');
  historySort = signal<HistorySort>('date');
  sortedHistory = computed(() => {
    const items = [...this.history()];

    if (this.historySort() === 'date') {
      return items.sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt));
    }

    return items.sort((a, b) => {
      const urgencyDifference = urgencyOrder[a.analysis.urgency] - urgencyOrder[b.analysis.urgency];
      return urgencyDifference || Date.parse(a.generatedAt) - Date.parse(b.generatedAt);
    });
  });

  selectTab(tab: WorkspaceTab): void {
    this.activeTab.set(tab);
  }

  setHistorySort(sort: HistorySort): void {
    this.historySort.set(sort);
  }

  override analyze(): void {
    const canAnalyze = this.requestText.trim().length >= 10 && this.requestText.length <= 8000;
    super.analyze();
    if (canAnalyze) this.activeTab.set('analysis');
  }

  override clear(): void {
    super.clear();
    this.activeTab.set('request');
  }

  override restoreHistory(item: Parameters<App['restoreHistory']>[0]): void {
    super.restoreHistory(item);
    this.activeTab.set('analysis');
  }
}
