// frontend/src/app/pages/history/history.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SavedAnalysis } from '../../models/stock.model';
import { InrPipe } from '../../pipes/inr.pipe';

@Component({
  selector: 'app-analysis-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InrPipe],
  template: `
    <div class="history-page container py-4">
      
      <div class="header-flex mb-4">
        <div>
          <div class="badge badge-blue mb-1">TRADER PORTFOLIO</div>
          <h2 class="page-title">My Analysis History</h2>
          <p class="text-secondary">Review past analyses, thesis notes, and evaluate performance over time.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/analyzer" class="btn btn-primary">
            + New Analysis
          </a>
        </div>
      </div>

      <!-- FILTERS -->
      <div class="card filter-card mb-4">
        <div class="filter-row">
          <div class="form-group flex-1">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search by Symbol (e.g. RELIANCE, TCS) or notes..." 
              [(ngModel)]="searchQuery"
            />
          </div>
          <div class="form-group">
            <select class="form-control" [(ngModel)]="selectedVerdict">
              <option value="">All Verdicts</option>
              <option value="STRONG_BUY">Strong Buy</option>
              <option value="BUY">Buy</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="SELL">Sell</option>
              <option value="STRONG_SELL">Strong Sell</option>
            </select>
          </div>
        </div>
      </div>

      <!-- LOADING STATE -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Retrieving your analysis history...</span>
      </div>

      <!-- EMPTY STATE -->
      <div *ngIf="!loading && filteredHistory.length === 0" class="card empty-card text-center p-5">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto mb-3 text-muted">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>No Analysis Records Found</h3>
        <p class="text-secondary mb-4">You haven't recorded any stock analyses yet. Pick a stock and test the algorithmic engine!</p>
        <a routerLink="/analyzer" class="btn btn-primary">Analyze First Stock</a>
      </div>

      <!-- HISTORY LIST / CARDS -->
      <div *ngIf="!loading && filteredHistory.length > 0" class="history-grid">
        <div *ngFor="let item of filteredHistory" class="card history-card">
          <div class="card-top flex-between">
            <div class="symbol-meta">
              <span class="ticker-large">{{ item.symbol }}</span>
              <span class="comp-name">{{ item.stock_name }}</span>
            </div>
            <span class="badge" [ngClass]="getVerdictBadge(item.verdict)">
              {{ formatVerdict(item.verdict) }}
            </span>
          </div>

          <!-- Price & Target -->
          <div class="price-banner mt-3">
            <div class="p-item">
              <span class="p-label">Price Recorded</span>
              <span class="p-val">{{ item.current_price | inr }}</span>
            </div>
            <div class="p-item text-right" *ngIf="item.target_price">
              <span class="p-label">Target Goal</span>
              <span class="p-val text-cyan">{{ item.target_price | inr }}</span>
            </div>
            <div class="p-item text-right">
              <span class="p-label">Timeframe</span>
              <span class="p-val text-secondary">{{ item.timeframe }}</span>
            </div>
          </div>

          <!-- Technical Snapshot -->
          <div class="tech-snapshot mt-3">
            <div class="t-pill">
              <span class="t-k">RSI:</span>
              <span class="t-v">{{ item.indicators.rsi14 | number:'1.1-1' }}</span>
            </div>
            <div class="t-pill">
              <span class="t-k">Confidence:</span>
              <span class="t-v">{{ item.confidence }}%</span>
            </div>
            <div class="t-pill">
              <span class="t-k">Home Feed:</span>
              <span class="t-v" [ngClass]="item.is_visible_on_home ? 'text-bull' : 'text-muted'">
                {{ item.is_visible_on_home ? 'Approved' : 'Pending' }}
              </span>
            </div>
          </div>

          <!-- Notes -->
          <div class="thesis-box mt-3" *ngIf="item.notes">
            <span class="thesis-label">Trader Thesis:</span>
            <p class="thesis-text">"{{ item.notes }}"</p>
          </div>

          <!-- Footer Actions -->
          <div class="card-footer flex-between mt-3 pt-3">
            <span class="date-tag">{{ item.created_at | date:'medium' }}</span>
            <div class="actions-group">
              <button class="btn btn-secondary btn-sm" (click)="reAnalyze(item.symbol)">
                Re-Analyze
              </button>
              <button class="btn btn-secondary btn-sm" (click)="openPrintReport(item)">
                Report
              </button>
              <button class="btn-icon-del" (click)="deleteItem(item.id)" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- REPORT MODAL / EXPORT VIEW -->
      <div *ngIf="reportItem" class="modal-backdrop" (click)="reportItem = null">
        <div class="modal-content report-modal" (click)="$event.stopPropagation()">
          <div class="report-header">
            <div>
              <h3 class="report-title">Technical Analysis Dossier (INR)</h3>
              <span class="text-secondary">Symbol: {{ reportItem.symbol }} &bull; {{ reportItem.stock_name }}</span>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="printReport()">
              🖨️ Print Dossier
            </button>
          </div>

          <div class="report-body mt-3">
            <div class="report-metric-row">
              <div class="rm-box">
                <span class="rm-label">Verdict Recommendation</span>
                <span class="rm-val">{{ formatVerdict(reportItem.verdict) }}</span>
              </div>
              <div class="rm-box">
                <span class="rm-label">Model Confidence</span>
                <span class="rm-val">{{ reportItem.confidence }}%</span>
              </div>
              <div class="rm-box">
                <span class="rm-label">Recorded Price</span>
                <span class="rm-val">{{ reportItem.current_price | inr }}</span>
              </div>
              <div class="rm-box">
                <span class="rm-label">Target Objective</span>
                <span class="rm-val text-cyan">{{ reportItem.target_price | inr }}</span>
              </div>
            </div>

            <div class="report-indicators mt-4">
              <h5 class="sub-heading">Technical Matrix at Record Time</h5>
              <div class="tech-grid mt-2">
                <div class="tg-item"><span>RSI(14):</span> <strong>{{ reportItem.indicators.rsi14 | number:'1.1-1' }}</strong></div>
                <div class="tg-item"><span>20 SMA:</span> <strong>{{ reportItem.indicators.sma20 ? (reportItem.indicators.sma20 | inr) : 'N/A' }}</strong></div>
                <div class="tg-item"><span>50 SMA:</span> <strong>{{ reportItem.indicators.sma50 ? (reportItem.indicators.sma50 | inr) : 'N/A' }}</strong></div>
                <div class="tg-item"><span>Support:</span> <strong>{{ reportItem.indicators.support | inr }}</strong></div>
                <div class="tg-item"><span>Resistance:</span> <strong>{{ reportItem.indicators.resistance | inr }}</strong></div>
                <div class="tg-item"><span>Volume Rel:</span> <strong>{{ reportItem.indicators.volume_vs_avg }}</strong></div>
              </div>
            </div>

            <div class="report-notes mt-4">
              <h5 class="sub-heading">Trader Strategy & Thesis</h5>
              <p class="notes-full mt-2">"{{ reportItem.notes || 'No custom notes provided.' }}"</p>
            </div>
          </div>

          <div class="modal-footer flex-between mt-4">
            <span class="text-muted text-sm">Timestamp: {{ reportItem.created_at | date:'medium' }}</span>
            <button class="btn btn-secondary btn-sm" (click)="reportItem = null">Close</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .header-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title {
      font-size: 2.2rem;
      color: #ffffff;
    }
    .filter-card {
      padding: 1rem;
    }
    .filter-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .history-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.5rem;
    }
    .history-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .ticker-large {
      font-size: 1.6rem;
      font-weight: 800;
      color: #ffffff;
      font-family: var(--font-display);
      display: block;
      line-height: 1;
    }
    .comp-name {
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .price-banner {
      display: flex;
      justify-content: space-between;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
    }
    .p-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      display: block;
    }
    .p-val {
      font-size: 1.05rem;
      font-weight: 700;
      color: #ffffff;
    }
    .tech-snapshot {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .t-pill {
      background: #152238;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      display: flex;
      gap: 0.3rem;
    }
    .t-k { color: var(--text-muted); }
    .t-v { font-weight: 600; color: #ffffff; }
    .thesis-box {
      background: #0e1526;
      border-radius: var(--radius-sm);
      padding: 0.75rem;
      font-size: 0.85rem;
    }
    .thesis-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--brand-primary);
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }
    .thesis-text {
      color: var(--text-secondary);
      font-style: italic;
      line-height: 1.4;
    }
    .card-footer {
      border-top: 1px solid var(--border-subtle);
    }
    .date-tag {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .actions-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-icon-del {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.35rem;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      transition: color 0.2s;
    }
    .btn-icon-del:hover {
      color: var(--bear-red);
    }
    .report-modal {
      max-width: 650px;
      padding: 2rem;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 1rem;
    }
    .report-title {
      font-size: 1.5rem;
      color: #ffffff;
    }
    .report-metric-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.75rem;
    }
    .rm-box {
      background: #0c1324;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      text-align: center;
    }
    .rm-label {
      display: block;
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }
    .rm-val {
      font-size: 1.15rem;
      font-weight: 800;
      color: #ffffff;
    }
    .sub-heading {
      font-size: 0.95rem;
      color: #93c5fd;
    }
    .tech-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      background: #0a0f1d;
      padding: 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.82rem;
    }
    .notes-full {
      background: #0a0f1d;
      padding: 1rem;
      border-radius: var(--radius-md);
      color: #cbd5e1;
      font-style: italic;
      line-height: 1.5;
    }
  `]
})
export class AnalysisHistoryComponent implements OnInit {
  history: SavedAnalysis[] = [];
  loading = false;
  searchQuery = '';
  selectedVerdict = '';
  reportItem: SavedAnalysis | null = null;

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.api.getUserAnalysisHistory().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) this.history = res.history;
      },
      error: () => this.loading = false
    });
  }

  get filteredHistory(): SavedAnalysis[] {
    return this.history.filter(item => {
      const q = this.searchQuery.trim().toLowerCase();
      const matchesQuery = !q || 
        item.symbol.toLowerCase().includes(q) || 
        item.stock_name.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      const matchesVerdict = !this.selectedVerdict || item.verdict === this.selectedVerdict;

      return matchesQuery && matchesVerdict;
    });
  }

  reAnalyze(symbol: string): void {
    this.router.navigate(['/analyzer'], { queryParams: { symbol } });
  }

  deleteItem(id: number): void {
    if (!confirm('Are you sure you want to remove this analysis from your portfolio?')) return;
    this.api.deleteAnalysis(id).subscribe({
      next: () => {
        this.history = this.history.filter(h => h.id !== id);
      }
    });
  }

  openPrintReport(item: SavedAnalysis): void {
    this.reportItem = item;
  }

  printReport(): void {
    window.print();
  }

  getVerdictBadge(verdict: string): string {
    if (verdict === 'STRONG_BUY' || verdict === 'BUY') return 'badge-bull';
    if (verdict === 'STRONG_SELL' || verdict === 'SELL') return 'badge-bear';
    return 'badge-neutral';
  }

  formatVerdict(verdict: string): string {
    return verdict ? verdict.replace('_', ' ') : 'NEUTRAL';
  }
}
