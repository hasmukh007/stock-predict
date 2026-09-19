// frontend/src/app/pages/analyzer/analyzer.component.ts
import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Stock, StockAnalysisResponse } from '../../models/stock.model';
import { InrPipe } from '../../pipes/inr.pipe';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-stock-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InrPipe],
  template: `
    <div class="analyzer-page">
      <div class="container py-4">
        
        <!-- TOP CONTROLS & TICKER SELECTOR -->
        <div class="card selector-card mb-4">
          <div class="selector-flex">
            <div class="search-col">
              <label class="form-label">Select or Type Indian Stock Symbol</label>
              <div class="search-input-group">
                <input 
                  type="text" 
                  class="form-control text-uppercase" 
                  placeholder="e.g. RELIANCE, TCS, INFY, HDFCBANK..." 
                  [(ngModel)]="selectedSymbol"
                  (keyup.enter)="analyzeStock()"
                />
                <button class="btn btn-primary" (click)="analyzeStock()" [disabled]="loading">
                  <span *ngIf="!loading">Analyze Stock</span>
                  <span *ngIf="loading">Fetching Data...</span>
                </button>
              </div>
            </div>

            <!-- Quick Allowed Stocks Selector -->
            <div class="allowed-chips-col">
              <label class="form-label">Allowed Indian Equities (NSE):</label>
              <div class="chips-container">
                <button 
                  *ngFor="let s of allowedStocks" 
                  class="chip-btn" 
                  [class.active]="s.symbol === selectedSymbol"
                  (click)="selectChip(s.symbol)"
                >
                  {{ s.symbol }}
                </button>
              </div>
            </div>

            <!-- Timeframe selector -->
            <div class="timeframe-col">
              <label class="form-label">Range</label>
              <div class="btn-group-range">
                <button 
                  *ngFor="let r of ranges" 
                  class="btn-range" 
                  [class.active]="selectedRange === r.value"
                  (click)="changeRange(r.value)"
                >
                  {{ r.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ERROR MESSAGE -->
        <div *ngIf="errorMessage" class="error-banner mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>Analysis Restricted or Failed:</strong>
            <p>{{ errorMessage }}</p>
          </div>
        </div>

        <!-- LOADING STATE -->
        <div *ngIf="loading" class="analyzer-loading">
          <div class="spinner-large"></div>
          <h4>Fetching Real-Time Market Data & Computing Indicators...</h4>
          <p class="text-secondary">Pulling historical candles from Yahoo Finance (NSE/BSE) and computing SMA, RSI & MACD</p>
        </div>

        <!-- MAIN ANALYSIS RESULTS DASHBOARD -->
        <div *ngIf="!loading && analysisData" class="analysis-results">
          
          <!-- 1. QUOTE HEADER & KEY METRICS -->
          <div class="card quote-card mb-4">
            <div class="quote-header">
              <div class="quote-title-block">
                <div class="quote-sym-flex">
                  <h2 class="quote-symbol">{{ analysisData.stock.symbol }}</h2>
                  <span class="badge badge-blue">{{ analysisData.stock.exchange }}</span>
                  <span class="badge" [ngClass]="analysisData.stock.is_live ? 'badge-bull' : 'badge-neutral'">
                    {{ analysisData.stock.is_live ? '● LIVE API FEED' : '● CACHED / FALLBACK' }}
                  </span>
                </div>
                <h3 class="quote-company">{{ analysisData.stock.name }} &bull; {{ analysisData.stock.sector }}</h3>
              </div>

              <div class="quote-price-block text-right">
                <div class="main-price">{{ analysisData.stock.current_price | inr }}</div>
                <div class="price-delta" [ngClass]="analysisData.stock.change >= 0 ? 'text-bull' : 'text-bear'">
                  {{ analysisData.stock.change >= 0 ? '+' : '' }}{{ analysisData.stock.change | inr }} 
                  ({{ analysisData.stock.change >= 0 ? '+' : '' }}{{ analysisData.stock.change_percent | number:'1.2-2' }}%)
                </div>
              </div>
            </div>

            <!-- 52-Week Range Bar -->
            <div class="range-bar-wrapper mt-3">
              <div class="range-labels">
                <span>52W Low: {{ analysisData.stock.fifty_two_week_low | inr }}</span>
                <span>Day High: {{ analysisData.stock.day_high | inr }}</span>
                <span>52W High: {{ analysisData.stock.fifty_two_week_high | inr }}</span>
              </div>
              <div class="range-track">
                <div class="range-progress" [style.width.%]="get52wPercent()"></div>
              </div>
            </div>
          </div>

          <!-- 2. GRID: CHART & VERDICT GAUGE -->
          <div class="chart-verdict-grid mb-4">
            
            <!-- INTERACTIVE PRICE & SMA CHART -->
            <div class="card chart-card">
              <div class="flex-between mb-2">
                <h4 class="card-heading">Price Action & Moving Average Overlay (INR)</h4>
                <div class="chart-legend">
                  <span class="legend-item"><span class="dot dot-blue"></span> Price Close</span>
                  <span class="legend-item"><span class="dot dot-amber"></span> 20 SMA</span>
                  <span class="legend-item"><span class="dot dot-purple"></span> 50 SMA</span>
                </div>
              </div>
              <div class="canvas-container">
                <canvas #chartCanvas></canvas>
              </div>
            </div>

            <!-- ALGORITHMIC VERDICT & CONFIDENCE GAUGE -->
            <div class="card verdict-card">
              <h4 class="card-heading">Algorithmic Recommendation</h4>
              
              <div class="verdict-display" [ngClass]="getVerdictTheme(analysisData.technical.verdict)">
                <div class="verdict-pill">
                  {{ formatVerdict(analysisData.technical.verdict) }}
                </div>
                <div class="confidence-meter mt-3">
                  <span class="conf-label">Model Confidence Score</span>
                  <div class="conf-bar-track">
                    <div class="conf-bar-fill" [style.width.%]="analysisData.technical.confidence"></div>
                  </div>
                  <div class="conf-val">{{ analysisData.technical.confidence }}% Algorithmic Conviction</div>
                </div>
              </div>

              <!-- Recommended Target -->
              <div class="target-box mt-3">
                <span class="target-title">Target Price Recommendation</span>
                <span class="target-value text-cyan">
                  {{ analysisData.technical.target_price_recommended | inr }}
                </span>
                <span class="target-sub">Based on support/resistance & momentum extrapolation</span>
              </div>

              <!-- Key Signal Bullets -->
              <div class="signals-list mt-3">
                <h5 class="signals-header">Quantitative Indicators Rationale:</h5>
                <ul>
                  <li *ngFor="let sig of analysisData.technical.signals">{{ sig }}</li>
                </ul>
              </div>
            </div>

          </div>

          <!-- 3. TECHNICAL INDICATORS MATRIX -->
          <div class="card indicators-matrix-card mb-4">
            <h4 class="card-heading mb-3">Technical Indicators Breakdown</h4>
            <div class="metrics-grid">
              
              <div class="metric-box">
                <span class="m-label">RSI (14) Momentum</span>
                <span class="m-value" [ngClass]="getRsiColor(analysisData.technical.indicators.rsi14)">
                  {{ analysisData.technical.indicators.rsi14 | number:'1.1-1' }}
                </span>
                <span class="m-sub">{{ getRsiText(analysisData.technical.indicators.rsi14) }}</span>
              </div>

              <div class="metric-box">
                <span class="m-label">20-Day Simple MA</span>
                <span class="m-value">{{ analysisData.technical.indicators.sma20 ? (analysisData.technical.indicators.sma20 | inr) : 'N/A' }}</span>
                <span class="m-sub">Short-term trendline</span>
              </div>

              <div class="metric-box">
                <span class="m-label">50-Day Simple MA</span>
                <span class="m-value">{{ analysisData.technical.indicators.sma50 ? (analysisData.technical.indicators.sma50 | inr) : 'N/A' }}</span>
                <span class="m-sub">Intermediate benchmark</span>
              </div>

              <div class="metric-box">
                <span class="m-label">MACD (12, 26, 9)</span>
                <span class="m-value" [ngClass]="(analysisData.technical.indicators.macd?.histogram || 0) >= 0 ? 'text-bull' : 'text-bear'">
                  {{ analysisData.technical.indicators.macd ? (analysisData.technical.indicators.macd.macd | number:'1.2-2') : '0.00' }}
                </span>
                <span class="m-sub">Hist: {{ analysisData.technical.indicators.macd ? (analysisData.technical.indicators.macd.histogram | number:'1.2-2') : '0.00' }}</span>
              </div>

              <div class="metric-box">
                <span class="m-label">Key Support Level</span>
                <span class="m-value text-bull">{{ analysisData.technical.indicators.support | inr }}</span>
                <span class="m-sub">Major price floor</span>
              </div>

              <div class="metric-box">
                <span class="m-label">Key Resistance Level</span>
                <span class="m-value text-bear">{{ analysisData.technical.indicators.resistance | inr }}</span>
                <span class="m-sub">Overhead ceiling</span>
              </div>

            </div>
          </div>

          <!-- 4. SAVE ANALYSIS FORM -->
          <div class="card save-card">
            <h4 class="card-heading mb-2">Record Analysis in Your Portfolio History</h4>
            <p class="text-secondary text-sm mb-3">
              Save this technical snapshot with your investment thesis, target price, and optionally request administrator approval to feature it on the community home page.
            </p>

            <form (ngSubmit)="saveUserAnalysis()" class="save-form">
              <div class="save-row">
                <div class="form-group flex-1">
                  <label class="form-label">Your Target Price (₹)</label>
                  <input 
                    type="number" 
                    step="0.05" 
                    class="form-control" 
                    [(ngModel)]="saveTargetPrice" 
                    name="targetPrice" 
                    required
                  />
                </div>

                <div class="form-group flex-1">
                  <label class="form-label">Investment Timeframe</label>
                  <select class="form-control" [(ngModel)]="saveTimeframe" name="timeframe">
                    <option value="1W">1 Week (Swing)</option>
                    <option value="1M">1 Month (Short Term)</option>
                    <option value="3M">3 Months (Medium Term)</option>
                    <option value="6M">6 Months (Long Term)</option>
                    <option value="1Y">1 Year (Core Position)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Trader Notes & Thesis</label>
                <textarea 
                  class="form-control" 
                  rows="3" 
                  placeholder="Record your entry strategy, stop-loss trigger, catalyst events, or fundamentals..."
                  [(ngModel)]="saveNotes"
                  name="notes"
                ></textarea>
              </div>

              <div class="home-feature-checkbox mb-3">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="saveRequestHome" name="requestHome"/>
                  <span>Request to publish this analysis to the public Home Page community feed</span>
                </label>
              </div>

              <div class="flex-between">
                <span *ngIf="saveSuccessMessage" class="text-bull font-bold">{{ saveSuccessMessage }}</span>
                <button type="submit" class="btn btn-primary btn-lg" [disabled]="saving">
                  <span *ngIf="!saving">Save to My History</span>
                  <span *ngIf="saving">Saving...</span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .selector-card {
      padding: 1.5rem;
    }
    .selector-flex {
      display: flex;
      align-items: flex-end;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .search-col {
      flex: 1;
      min-width: 260px;
    }
    .search-input-group {
      display: flex;
      gap: 0.5rem;
    }
    .allowed-chips-col {
      flex: 1.5;
      min-width: 280px;
    }
    .chips-container {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .chip-btn {
      background: #152238;
      border: 1px solid var(--border-subtle);
      color: #93c5fd;
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip-btn:hover {
      background: #1e3a5f;
      color: #ffffff;
    }
    .chip-btn.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #ffffff;
    }
    .btn-group-range {
      display: flex;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .btn-range {
      background: #0f172a;
      border: none;
      color: var(--text-secondary);
      padding: 0.55rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-range.active {
      background: #3b82f6;
      color: #ffffff;
    }
    .error-banner {
      background: var(--bear-red-bg);
      border: 1px solid rgba(244, 63, 94, 0.4);
      color: #fda4af;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .analyzer-loading {
      text-align: center;
      padding: 4rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .spinner-large {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .quote-card {
      padding: 1.5rem;
    }
    .quote-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .quote-sym-flex {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .quote-symbol {
      font-size: 2.2rem;
      color: #ffffff;
      line-height: 1;
    }
    .quote-company {
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin-top: 0.35rem;
    }
    .main-price {
      font-size: 2.2rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1;
      font-family: var(--font-display);
    }
    .price-delta {
      font-size: 1.05rem;
      font-weight: 700;
      margin-top: 0.25rem;
    }
    .range-bar-wrapper {
      background: rgba(0, 0, 0, 0.25);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
    }
    .range-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
    }
    .range-track {
      width: 100%;
      height: 8px;
      background: #1e293b;
      border-radius: 4px;
      overflow: hidden;
    }
    .range-progress {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);
      border-radius: 4px;
    }
    .chart-verdict-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }
    .canvas-container {
      position: relative;
      width: 100%;
      height: 340px;
    }
    .chart-legend {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 0.2rem;
    }
    .dot-blue { background: #3b82f6; }
    .dot-amber { background: #f59e0b; }
    .dot-purple { background: #a855f7; }

    .verdict-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .verdict-display {
      padding: 1.25rem;
      border-radius: var(--radius-md);
      text-align: center;
      background: #0f182a;
      border: 1px solid var(--border-subtle);
    }
    .verdict-pill {
      display: inline-block;
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 0.4rem 1.25rem;
      border-radius: var(--radius-full);
    }
    .theme-bull {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.08);
    }
    .theme-bull .verdict-pill {
      background: #10b981;
      color: #ffffff;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    }
    .theme-bear {
      border-color: rgba(244, 63, 94, 0.4);
      background: rgba(244, 63, 94, 0.08);
    }
    .theme-bear .verdict-pill {
      background: #f43f5e;
      color: #ffffff;
      box-shadow: 0 0 15px rgba(244, 63, 94, 0.4);
    }
    .theme-neutral {
      border-color: rgba(245, 158, 11, 0.4);
      background: rgba(245, 158, 11, 0.08);
    }
    .theme-neutral .verdict-pill {
      background: #f59e0b;
      color: #ffffff;
    }
    .conf-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .conf-bar-track {
      width: 100%;
      height: 6px;
      background: #1e293b;
      border-radius: 3px;
      margin: 0.4rem 0;
      overflow: hidden;
    }
    .conf-bar-fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 3px;
    }
    .conf-val {
      font-size: 0.8rem;
      font-weight: 700;
      color: #93c5fd;
    }
    .target-box {
      background: #0d1527;
      padding: 0.85rem;
      border-radius: var(--radius-md);
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .target-title {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .target-value {
      font-size: 1.5rem;
      font-weight: 800;
    }
    .target-sub {
      font-size: 0.7rem;
      color: var(--text-secondary);
    }
    .signals-list {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .signals-header {
      font-size: 0.82rem;
      color: var(--text-primary);
      margin-bottom: 0.4rem;
    }
    .signals-list ul {
      padding-left: 1.2rem;
      line-height: 1.45;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 1rem;
    }
    .metric-box {
      background: #0f172a;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .m-label {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .m-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      font-family: var(--font-display);
    }
    .m-sub {
      font-size: 0.7rem;
      color: var(--text-secondary);
    }

    .save-row {
      display: flex;
      gap: 1rem;
    }
    .flex-1 { flex: 1; }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #cbd5e1;
      cursor: pointer;
    }

    @media (max-width: 900px) {
      .chart-verdict-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class StockAnalyzerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  allowedStocks: Stock[] = [];
  selectedSymbol = 'RELIANCE';
  selectedRange = '3mo';

  ranges = [
    { label: '1M', value: '1mo' },
    { label: '3M', value: '3mo' },
    { label: '6M', value: '6mo' },
    { label: '1Y', value: '1y' }
  ];

  loading = false;
  errorMessage = '';
  analysisData: StockAnalysisResponse | null = null;
  chartInstance: Chart | null = null;

  // Save form fields
  saveTargetPrice: number = 0;
  saveTimeframe = '1M';
  saveNotes = '';
  saveRequestHome = true;
  saving = false;
  saveSuccessMessage = '';

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllowedStocks();
    this.route.queryParams.subscribe(params => {
      if (params['symbol']) {
        this.selectedSymbol = params['symbol'].toUpperCase();
      }
      this.analyzeStock();
    });
  }

  ngAfterViewInit(): void {
    // Canvas will render after analysisData is set
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  loadAllowedStocks(): void {
    this.api.getAllowedStocks().subscribe({
      next: (res) => {
        if (res.success) this.allowedStocks = res.stocks;
      }
    });
  }

  selectChip(sym: string): void {
    this.selectedSymbol = sym;
    this.analyzeStock();
  }

  changeRange(r: string): void {
    this.selectedRange = r;
    this.analyzeStock();
  }

  analyzeStock(): void {
    if (!this.selectedSymbol) return;
    this.selectedSymbol = this.selectedSymbol.trim().toUpperCase();
    this.loading = true;
    this.errorMessage = '';
    this.saveSuccessMessage = '';

    this.api.fetchAndAnalyzeStock(this.selectedSymbol, this.selectedRange).subscribe({
      next: (res) => {
        this.loading = false;
        this.analysisData = res;
        this.saveTargetPrice = res.technical.target_price_recommended;
        setTimeout(() => this.renderChart(), 50);
      },
      error: (err) => {
        this.loading = false;
        this.analysisData = null;
        this.errorMessage = err?.error?.error || 'Failed to fetch stock data or analysis.';
      }
    });
  }

  renderChart(): void {
    if (!this.chartCanvas || !this.analysisData) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const history = this.analysisData.history;
    const labels = history.map(h => h.date);
    const closes = history.map(h => h.close);

    // Compute simple moving averages for chart
    const sma20Values = this.computeSMAArray(closes, 20);
    const sma50Values = this.computeSMAArray(closes, 50);

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Gradient fill for area chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Close Price',
            data: closes,
            borderColor: '#3b82f6',
            backgroundColor: gradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 5
          },
          {
            label: '20 SMA',
            data: sma20Values,
            borderColor: '#f59e0b',
            borderWidth: 1.8,
            borderDash: [4, 4],
            fill: false,
            pointRadius: 0
          },
          {
            label: '50 SMA',
            data: sma50Values,
            borderColor: '#a855f7',
            borderWidth: 1.8,
            borderDash: [6, 6],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#93c5fd',
            bodyColor: '#ffffff',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b', maxTicksLimit: 8 }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
  }

  computeSMAArray(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((a, b) => a + b, 0);
        result.push(roundTo2(sum / period));
      }
    }
    return result;
  }

  saveUserAnalysis(): void {
    if (!this.analysisData) return;
    this.saving = true;
    this.saveSuccessMessage = '';

    const payload = {
      symbol: this.analysisData.stock.symbol,
      stock_name: this.analysisData.stock.name,
      current_price: this.analysisData.stock.current_price,
      target_price: this.saveTargetPrice,
      timeframe: this.saveTimeframe,
      indicators: this.analysisData.technical.indicators,
      verdict: this.analysisData.technical.verdict,
      confidence: this.analysisData.technical.confidence,
      notes: this.saveNotes,
      request_home: this.saveRequestHome
    };

    this.api.saveAnalysis(payload).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccessMessage = '✓ Analysis saved successfully to your History!';
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err?.error?.error || 'Failed to save analysis.';
      }
    });
  }

  get52wPercent(): number {
    if (!this.analysisData) return 50;
    const { current_price, fifty_two_week_low, fifty_two_week_high } = this.analysisData.stock;
    const range = fifty_two_week_high - fifty_two_week_low;
    if (range <= 0) return 50;
    const pct = ((current_price - fifty_two_week_low) / range) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  getVerdictTheme(verdict: string): string {
    if (verdict === 'STRONG_BUY' || verdict === 'BUY') return 'theme-bull';
    if (verdict === 'STRONG_SELL' || verdict === 'SELL') return 'theme-bear';
    return 'theme-neutral';
  }

  formatVerdict(verdict: string): string {
    return verdict ? verdict.replace('_', ' ') : 'NEUTRAL';
  }

  getRsiColor(rsi: number): string {
    if (rsi < 32) return 'text-bull';
    if (rsi > 68) return 'text-bear';
    return 'text-cyan';
  }

  getRsiText(rsi: number): string {
    if (rsi < 32) return 'Oversold (Rebound signal)';
    if (rsi > 68) return 'Overbought (Caution)';
    return 'Neutral zone (30-70)';
  }
}

function roundTo2(val: number): number {
  return Math.round(val * 100) / 100;
}
