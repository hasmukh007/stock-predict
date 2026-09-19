// frontend/src/app/pages/compare/compare.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Stock, StockAnalysisResponse } from '../../models/stock.model';
import { InrPipe } from '../../pipes/inr.pipe';

@Component({
  selector: 'app-stock-compare',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe],
  template: `
    <div class="compare-page container py-4">
      
      <div class="mb-4 text-center">
        <div class="badge badge-purple mb-1">DUAL ENGINE COMPARISON</div>
        <h2 class="page-title">Side-by-Side Equities Comparator</h2>
        <p class="text-secondary">Compare technical momentum, valuation indicators, and algorithmic ratings between any two Indian stocks.</p>
      </div>

      <!-- PICKER CONTROLS -->
      <div class="card picker-card mb-4">
        <div class="picker-flex">
          
          <div class="pick-box">
            <label class="form-label">Stock A (Benchmark)</label>
            <select class="form-control" [(ngModel)]="symbolA" (change)="compare()">
              <option *ngFor="let s of allowedStocks" [value]="s.symbol">{{ s.symbol }} - {{ s.name }}</option>
            </select>
          </div>

          <div class="vs-badge">VS</div>

          <div class="pick-box">
            <label class="form-label">Stock B (Contender)</label>
            <select class="form-control" [(ngModel)]="symbolB" (change)="compare()">
              <option *ngFor="let s of allowedStocks" [value]="s.symbol">{{ s.symbol }} - {{ s.name }}</option>
            </select>
          </div>

        </div>
      </div>

      <!-- LOADING -->
      <div *ngIf="loading" class="loading-state text-center py-5">
        <div class="spinner mx-auto"></div>
        <span>Fetching live comparative feeds...</span>
      </div>

      <!-- COMPARISON RESULTS GRID -->
      <div *ngIf="!loading && dataA && dataB" class="compare-grid">
        
        <!-- STOCK A CARD -->
        <div class="card stock-col">
          <div class="col-head">
            <h3 class="sym-title">{{ dataA.stock.symbol }}</h3>
            <span class="comp-sub">{{ dataA.stock.name }} &bull; {{ dataA.stock.exchange }}</span>
            <div class="price-large mt-2">{{ dataA.stock.current_price | inr }}</div>
            <div [ngClass]="dataA.stock.change >= 0 ? 'text-bull' : 'text-bear'">
              {{ dataA.stock.change >= 0 ? '+' : '' }}{{ dataA.stock.change_percent | number:'1.2-2' }}%
            </div>
          </div>

          <div class="verdict-banner mt-3" [ngClass]="getVerdictTheme(dataA.technical.verdict)">
            <span class="v-label">Verdict:</span>
            <strong>{{ formatVerdict(dataA.technical.verdict) }} ({{ dataA.technical.confidence }}%)</strong>
          </div>

          <div class="metrics-list mt-3">
            <div class="m-row"><span>RSI (14):</span> <strong>{{ dataA.technical.indicators.rsi14 | number:'1.1-1' }}</strong></div>
            <div class="m-row"><span>20 SMA:</span> <strong>{{ dataA.technical.indicators.sma20 ? (dataA.technical.indicators.sma20 | inr) : 'N/A' }}</strong></div>
            <div class="m-row"><span>50 SMA:</span> <strong>{{ dataA.technical.indicators.sma50 ? (dataA.technical.indicators.sma50 | inr) : 'N/A' }}</strong></div>
            <div class="m-row"><span>Support:</span> <strong>{{ dataA.technical.indicators.support | inr }}</strong></div>
            <div class="m-row"><span>Resistance:</span> <strong>{{ dataA.technical.indicators.resistance | inr }}</strong></div>
            <div class="m-row"><span>52W High:</span> <strong>{{ dataA.stock.fifty_two_week_high | inr }}</strong></div>
            <div class="m-row"><span>52W Low:</span> <strong>{{ dataA.stock.fifty_two_week_low | inr }}</strong></div>
          </div>
        </div>

        <!-- STOCK B CARD -->
        <div class="card stock-col">
          <div class="col-head">
            <h3 class="sym-title">{{ dataB.stock.symbol }}</h3>
            <span class="comp-sub">{{ dataB.stock.name }} &bull; {{ dataB.stock.exchange }}</span>
            <div class="price-large mt-2">{{ dataB.stock.current_price | inr }}</div>
            <div [ngClass]="dataB.stock.change >= 0 ? 'text-bull' : 'text-bear'">
              {{ dataB.stock.change >= 0 ? '+' : '' }}{{ dataB.stock.change_percent | number:'1.2-2' }}%
            </div>
          </div>

          <div class="verdict-banner mt-3" [ngClass]="getVerdictTheme(dataB.technical.verdict)">
            <span class="v-label">Verdict:</span>
            <strong>{{ formatVerdict(dataB.technical.verdict) }} ({{ dataB.technical.confidence }}%)</strong>
          </div>

          <div class="metrics-list mt-3">
            <div class="m-row"><span>RSI (14):</span> <strong>{{ dataB.technical.indicators.rsi14 | number:'1.1-1' }}</strong></div>
            <div class="m-row"><span>20 SMA:</span> <strong>{{ dataB.technical.indicators.sma20 ? (dataB.technical.indicators.sma20 | inr) : 'N/A' }}</strong></div>
            <div class="m-row"><span>50 SMA:</span> <strong>{{ dataB.technical.indicators.sma50 ? (dataB.technical.indicators.sma50 | inr) : 'N/A' }}</strong></div>
            <div class="m-row"><span>Support:</span> <strong>{{ dataB.technical.indicators.support | inr }}</strong></div>
            <div class="m-row"><span>Resistance:</span> <strong>{{ dataB.technical.indicators.resistance | inr }}</strong></div>
            <div class="m-row"><span>52W High:</span> <strong>{{ dataB.stock.fifty_two_week_high | inr }}</strong></div>
            <div class="m-row"><span>52W Low:</span> <strong>{{ dataB.stock.fifty_two_week_low | inr }}</strong></div>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .page-title {
      font-size: 2.2rem;
      color: #ffffff;
    }
    .picker-card {
      padding: 1.5rem;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    .picker-flex {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .pick-box {
      flex: 1;
    }
    .vs-badge {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #1e293b;
      border: 1px solid var(--border-medium);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #93c5fd;
      flex-shrink: 0;
      margin-top: 1.2rem;
    }
    .compare-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }
    .stock-col {
      padding: 2rem;
    }
    .sym-title {
      font-size: 2rem;
      color: #ffffff;
      line-height: 1;
    }
    .comp-sub {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .price-large {
      font-size: 2.2rem;
      font-weight: 800;
      color: #ffffff;
      font-family: var(--font-display);
    }
    .verdict-banner {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
    }
    .theme-bull { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .theme-bear { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }
    .theme-neutral { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .metrics-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .m-row {
      display: flex;
      justify-content: space-between;
      padding: 0.6rem 0;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.88rem;
    }
    .m-row span { color: var(--text-muted); }
    .m-row strong { color: #ffffff; }

    @media (max-width: 768px) {
      .picker-flex { flex-direction: column; }
      .vs-badge { margin-top: 0; }
      .compare-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CompareComponent implements OnInit {
  allowedStocks: Stock[] = [];
  symbolA = 'NVDA';
  symbolB = 'AAPL';

  loading = false;
  dataA: StockAnalysisResponse | null = null;
  dataB: StockAnalysisResponse | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAllowedStocks().subscribe({
      next: (res) => {
        if (res.success && res.stocks.length > 1) {
          this.allowedStocks = res.stocks;
          this.symbolA = res.stocks[0].symbol;
          this.symbolB = res.stocks[1].symbol;
          this.compare();
        }
      }
    });
  }

  compare(): void {
    if (!this.symbolA || !this.symbolB) return;
    this.loading = true;

    this.api.fetchAndAnalyzeStock(this.symbolA).subscribe({
      next: (resA) => {
        this.dataA = resA;
        this.api.fetchAndAnalyzeStock(this.symbolB).subscribe({
          next: (resB) => {
            this.dataB = resB;
            this.loading = false;
          },
          error: () => this.loading = false
        });
      },
      error: () => this.loading = false
    });
  }

  getVerdictTheme(verdict: string): string {
    if (verdict === 'STRONG_BUY' || verdict === 'BUY') return 'theme-bull';
    if (verdict === 'STRONG_SELL' || verdict === 'SELL') return 'theme-bear';
    return 'theme-neutral';
  }

  formatVerdict(verdict: string): string {
    return verdict ? verdict.replace('_', ' ') : 'NEUTRAL';
  }
}
