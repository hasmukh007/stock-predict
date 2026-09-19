// frontend/src/app/pages/home/home.component.ts
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NewsItem, SavedAnalysis, Holiday, Stock } from '../../models/stock.model';
import { InrPipe } from '../../pipes/inr.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InrPipe],
  template: `
    <div class="home-page">
      <!-- HERO BANNER -->
      <section class="hero-section">
        <div class="container hero-container">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            <span>NSE &amp; BSE INDIA EQUITY INTELLIGENCE ENGINE</span>
          </div>

          <h1 class="hero-title">
            Intelligent Stock Insights & <br/>
            <span class="hero-gradient">Indian Equities Predictions</span>
          </h1>

          <p class="hero-desc">
            Analyze Indian stocks on NSE &amp; BSE with real-time Yahoo Finance market feeds, automated moving averages (20/50/200 SMA), RSI momentum gauges, MACD signals, and price alerts in INR (₹).
          </p>

          <!-- Quick Search Bar -->
          <div class="hero-search-box">
            <div class="search-input-wrapper">
              <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                class="search-input" 
                placeholder="Search Indian ticker (e.g. RELIANCE, TCS, HDFCBANK, INFY)..." 
                [(ngModel)]="searchQuery" 
                (keyup.enter)="startAnalysis(searchQuery)"
              />
            </div>
            <button class="btn btn-primary btn-lg" (click)="startAnalysis(searchQuery)">
              Analyze Stock
            </button>
          </div>

          <!-- Allowed Quick Tags -->
          <div class="quick-tags">
            <span class="quick-tag-label">Popular Indian Equities (NSE):</span>
            <div class="tags-list">
              <button 
                *ngFor="let s of allowedStocks.slice(0, 7)" 
                class="tag-chip" 
                (click)="startAnalysis(s.symbol)"
              >
                {{ s.symbol }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- FREQUENT & FEATURED ANALYSES SECTION -->
      <section class="section-py bg-card-layer">
        <div class="container">
          <div class="section-header flex-between">
            <div>
              <div class="badge badge-blue mb-2">COMMUNITY INTELLIGENCE</div>
              <h2 class="section-title">Frequent &amp; Featured Analyses</h2>
              <p class="section-subtitle">Verified analyses on Indian equities shared by quant analysts and approved by administrators</p>
            </div>
            <a routerLink="/analyzer" class="btn btn-secondary btn-sm">
              Conduct New Analysis →
            </a>
          </div>

          <div *ngIf="loadingAnalyses" class="loading-state">
            <div class="spinner"></div>
            <span>Loading community analyses...</span>
          </div>

          <div *ngIf="!loadingAnalyses && featuredAnalyses.length === 0" class="empty-state">
            <p>No featured community analyses yet. Be the first to analyze and submit!</p>
          </div>

          <div *ngIf="!loadingAnalyses && featuredAnalyses.length > 0" class="analyses-grid">
            <div *ngFor="let item of featuredAnalyses" class="card analysis-card">
              <div class="analysis-top">
                <div>
                  <div class="symbol-header">
                    <span class="stock-ticker">{{ item.symbol }}</span>
                    <span *ngIf="item.is_featured" class="badge badge-purple">★ FEATURED</span>
                  </div>
                  <span class="stock-subname">{{ item.stock_name }}</span>
                </div>
                <div class="verdict-badge" [ngClass]="getVerdictClass(item.verdict)">
                  {{ formatVerdict(item.verdict) }}
                </div>
              </div>

              <!-- Price & Target -->
              <div class="price-row">
                <div class="price-block">
                  <span class="price-label">Price at Analysis</span>
                  <span class="price-val">{{ item.current_price | inr }}</span>
                </div>
                <div class="price-block text-right" *ngIf="item.target_price">
                  <span class="price-label">Target Goal</span>
                  <span class="price-val text-cyan">{{ item.target_price | inr }}</span>
                </div>
              </div>

              <!-- Key Indicators Summary -->
              <div class="indicators-summary">
                <div class="ind-pill">
                  <span class="ind-name">RSI(14):</span>
                  <span class="ind-val" [ngClass]="getRsiClass(item.indicators.rsi14)">
                    {{ item.indicators.rsi14 | number:'1.1-1' }}
                  </span>
                </div>
                <div class="ind-pill">
                  <span class="ind-name">Confidence:</span>
                  <span class="ind-val">{{ item.confidence }}%</span>
                </div>
                <div class="ind-pill">
                  <span class="ind-name">SMA20:</span>
                  <span class="ind-val">{{ item.indicators.sma20 ? (item.indicators.sma20 | inr) : 'N/A' }}</span>
                </div>
              </div>

              <!-- Notes Snippet -->
              <p class="analysis-notes">
                "{{ item.notes || 'Algorithmic indicators confirm positive momentum with favorable risk-reward profile.' }}"
              </p>

              <!-- Footer -->
              <div class="card-footer-flex">
                <div class="author-meta">
                  <span class="author-name">{{ item.author_name || 'Community Analyst' }}</span>
                  <span class="author-date">{{ item.created_at | date:'mediumDate' }}</span>
                </div>
                <button class="btn btn-secondary btn-sm" (click)="startAnalysis(item.symbol)">
                  Inspect
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- RECENT MARKET NEWS & HOLIDAYS 2-COLUMN SECTION -->
      <section class="section-py">
        <div class="container">
          <div class="two-col-grid">
            
            <!-- LEFT COLUMN: RECENT NEWS -->
            <div class="news-column">
              <div class="section-header flex-between mb-3">
                <div>
                  <div class="badge badge-purple mb-1">MARKET DESK</div>
                  <h3 class="column-title">Recent Financial News</h3>
                </div>
                <!-- Category Filters -->
                <div class="category-filters">
                  <button 
                    *ngFor="let cat of categories" 
                    class="filter-pill" 
                    [class.active]="selectedCategory === cat"
                    (click)="filterCategory(cat)"
                  >
                    {{ cat }}
                  </button>
                </div>
              </div>

              <div *ngIf="loadingNews" class="loading-state">
                <div class="spinner"></div>
                <span>Fetching latest market news...</span>
              </div>

              <div *ngIf="!loadingNews" class="news-list">
                <article *ngFor="let n of newsList" class="news-card card" (click)="openNewsModal(n)">
                  <img [src]="n.image_url" [alt]="n.title" class="news-img" loading="lazy"/>
                  <div class="news-body">
                    <div class="news-meta">
                      <span class="badge badge-blue">{{ n.category }}</span>
                      <span class="news-source">{{ n.source }}</span>
                      <span class="news-time">{{ n.published_at | date:'shortTime' }}</span>
                    </div>
                    <h4 class="news-title">{{ n.title }}</h4>
                    <p class="news-summary">{{ n.summary }}</p>
                  </div>
                </article>
              </div>
            </div>

            <!-- RIGHT COLUMN: UPCOMING MARKET HOLIDAYS -->
            <div class="holidays-column">
              <div class="section-header mb-3">
                <div class="badge badge-neutral mb-1">EXCHANGE CALENDAR</div>
                <h3 class="column-title">Upcoming Market Holidays</h3>
                <p class="text-secondary text-sm">Trading halts &amp; Muhurat sessions for NSE &amp; BSE</p>
              </div>

              <!-- Next Holiday Countdown Spotlight Card -->
              <div *ngIf="nextHoliday" class="card countdown-card">
                <div class="countdown-badge">
                  <span class="pulse-dot"></span>
                  <span>NEXT TRADING PAUSE</span>
                </div>
                <div class="countdown-main">
                  <h4 class="holiday-name">{{ nextHoliday.name }}</h4>
                  <div class="holiday-date-highlight">
                    {{ nextHoliday.holiday_date | date:'fullDate' }}
                  </div>
                </div>
                <div class="countdown-pill-row">
                  <div class="count-box">
                    <span class="count-num">{{ nextHoliday.days_until }}</span>
                    <span class="count-unit">DAYS AWAY</span>
                  </div>
                  <div class="holiday-status-box">
                    <span class="status-badge" [ngClass]="nextHoliday.status === 'closed' ? 'badge-bear' : 'badge-neutral'">
                      {{ nextHoliday.status === 'closed' ? 'FULL CLOSURE' : 'MUHURAT / SPECIAL SESSION' }}
                    </span>
                    <span class="exchange-tag">{{ nextHoliday.exchange }}</span>
                  </div>
                </div>
                <p *ngIf="nextHoliday.notes" class="holiday-note">{{ nextHoliday.notes }}</p>
              </div>

              <!-- Holidays List -->
              <div class="card holidays-card mt-3">
                <h5 class="subhead mb-2">2026 Scheduled Closures</h5>
                <div class="holidays-table-wrap">
                  <div *ngFor="let h of upcomingHolidays" class="holiday-row">
                    <div class="holiday-info">
                      <span class="h-name">{{ h.name }}</span>
                      <span class="h-exchange">{{ h.exchange }}</span>
                    </div>
                    <div class="holiday-meta-right">
                      <span class="h-date">{{ h.holiday_date | date:'mediumDate' }}</span>
                      <span class="badge" [ngClass]="h.status === 'closed' ? 'badge-bear' : 'badge-neutral'">
                        {{ h.status === 'closed' ? 'Closed' : 'Early Close' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- GUEST LOGIN / GET STARTED SECTION -->
      <section *ngIf="!auth.isLoggedIn()" class="section-py bg-card-layer">
        <div class="container">
          <div class="card auth-promo-card">
            <div class="promo-text">
              <div class="badge badge-purple mb-2">INSTANT ACCESS</div>
              <h2 class="promo-title">Start Analyzing Stocks with Real-Time Data</h2>
              <p class="promo-desc">
                Sign in or use our 1-click Demo credentials to access the interactive Stock Analyzer, calculate live technical indicators, manage watchlists, and set automated price alerts.
              </p>
              <div class="demo-buttons-promo">
                <button class="btn btn-primary btn-lg" (click)="triggerAuth('login')">
                  Sign In to Your Account
                </button>
                <button class="btn btn-secondary btn-lg" (click)="quickLogin('trader')">
                  ⚡ 1-Click Demo Trader
                </button>
                <button class="btn btn-secondary btn-lg" (click)="quickLogin('admin')">
                  👑 1-Click Demo Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- NEWS DETAIL MODAL -->
      <div *ngIf="selectedArticle" class="modal-backdrop" (click)="selectedArticle = null">
        <div class="modal-content news-modal" (click)="$event.stopPropagation()">
          <img [src]="selectedArticle.image_url" [alt]="selectedArticle.title" class="modal-news-img"/>
          <div class="modal-news-body">
            <div class="news-meta mb-2">
              <span class="badge badge-blue">{{ selectedArticle.category }}</span>
              <span class="news-source">{{ selectedArticle.source }}</span>
              <span class="news-time">{{ selectedArticle.published_at | date:'medium' }}</span>
            </div>
            <h3 class="modal-news-title">{{ selectedArticle.title }}</h3>
            <p class="modal-news-content">{{ selectedArticle.content }}</p>
            <div class="modal-footer mt-4 flex-between">
              <span class="source-credit">Source: {{ selectedArticle.source }}</span>
              <button class="btn btn-secondary btn-sm" (click)="selectedArticle = null">Close</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .hero-section {
      padding: 5rem 0 3.5rem;
      text-align: center;
      background: radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.15), transparent 60%);
    }
    .hero-container {
      max-width: 860px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 0.35rem 0.9rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #93c5fd;
      margin-bottom: 1.5rem;
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #3b82f6;
    }
    .hero-title {
      font-size: 3.1rem;
      line-height: 1.15;
      margin-bottom: 1.25rem;
    }
    .hero-gradient {
      background: linear-gradient(135deg, #60a5fa 0%, #22d3ee 50%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-desc {
      font-size: 1.1rem;
      color: var(--text-secondary);
      max-width: 680px;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .hero-search-box {
      width: 100%;
      max-width: 620px;
      display: flex;
      gap: 0.75rem;
      background: rgba(19, 29, 51, 0.85);
      border: 1px solid var(--border-medium);
      padding: 0.4rem 0.4rem 0.4rem 1rem;
      border-radius: var(--radius-lg);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      margin-bottom: 1.5rem;
    }
    .search-input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }
    .search-icon {
      color: var(--text-muted);
    }
    .search-input {
      background: transparent;
      border: none;
      outline: none;
      color: #ffffff;
      font-size: 1rem;
      width: 100%;
    }
    .quick-tags {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: center;
      font-size: 0.82rem;
    }
    .quick-tag-label {
      color: var(--text-muted);
    }
    .tags-list {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .tag-chip {
      background: #152238;
      border: 1px solid var(--border-subtle);
      color: #93c5fd;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tag-chip:hover {
      background: #1e3a5f;
      border-color: #3b82f6;
      color: #ffffff;
    }
    .bg-card-layer {
      background: #0c1220;
    }
    .section-header {
      margin-bottom: 2rem;
    }
    .section-title {
      font-size: 1.85rem;
      color: #ffffff;
    }
    .section-subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
    .analyses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .analysis-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
    }
    .analysis-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .symbol-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .stock-ticker {
      font-size: 1.35rem;
      font-weight: 800;
      color: #ffffff;
      font-family: var(--font-display);
    }
    .stock-subname {
      font-size: 0.8rem;
      color: var(--text-muted);
      display: block;
    }
    .verdict-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-full);
      letter-spacing: 0.04em;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      background: rgba(0, 0, 0, 0.2);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }
    .price-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      display: block;
    }
    .price-val {
      font-size: 1.1rem;
      font-weight: 700;
      color: #ffffff;
    }
    .indicators-summary {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .ind-pill {
      background: #162035;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      display: flex;
      gap: 0.3rem;
    }
    .ind-name { color: var(--text-muted); }
    .ind-val { font-weight: 600; color: #ffffff; }
    .analysis-notes {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-style: italic;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-footer-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border-subtle);
      padding-top: 0.75rem;
    }
    .author-name {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .author-date {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    /* 2-Column Grid */
    .two-col-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 2.5rem;
    }
    .column-title {
      font-size: 1.45rem;
      color: #ffffff;
    }
    .category-filters {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .filter-pill {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-pill.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #ffffff;
    }
    .news-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .news-card {
      display: flex;
      gap: 1.25rem;
      padding: 1.1rem;
      cursor: pointer;
      transition: transform 0.2s, border-color 0.2s;
    }
    .news-card:hover {
      transform: translateY(-2px);
      border-color: rgba(59, 130, 246, 0.4);
    }
    .news-img {
      width: 110px;
      height: 90px;
      border-radius: var(--radius-md);
      object-fit: cover;
      flex-shrink: 0;
    }
    .news-body {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .news-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .news-title {
      font-size: 0.95rem;
      color: #ffffff;
      line-height: 1.35;
    }
    .news-summary {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .countdown-card {
      background: linear-gradient(135deg, #131d33 0%, #1e2c4c 100%);
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 1.5rem;
    }
    .countdown-badge {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }
    .holiday-name {
      font-size: 1.3rem;
      color: #ffffff;
      margin-bottom: 0.2rem;
    }
    .holiday-date-highlight {
      font-size: 0.85rem;
      color: #94a3b8;
      margin-bottom: 1rem;
    }
    .countdown-pill-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(0, 0, 0, 0.25);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      margin-bottom: 0.75rem;
    }
    .count-box {
      display: flex;
      flex-direction: column;
    }
    .count-num {
      font-size: 1.8rem;
      font-weight: 800;
      color: #38bdf8;
      font-family: var(--font-display);
      line-height: 1;
    }
    .count-unit {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.04em;
    }
    .holiday-status-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }
    .exchange-tag {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .holiday-note {
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-style: italic;
    }
    .holidays-card {
      padding: 1.25rem;
    }
    .subhead {
      font-size: 0.95rem;
      color: #ffffff;
    }
    .holiday-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.82rem;
    }
    .holiday-info {
      display: flex;
      flex-direction: column;
    }
    .h-name { font-weight: 600; color: #ffffff; }
    .h-exchange { font-size: 0.7rem; color: var(--text-muted); }
    .holiday-meta-right {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .h-date { color: var(--text-secondary); }

    .auth-promo-card {
      background: linear-gradient(135deg, #162035 0%, #1e2e4f 100%);
      border: 1px solid rgba(59, 130, 246, 0.4);
      padding: 3rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .promo-title {
      font-size: 2.1rem;
      color: #ffffff;
      margin-bottom: 0.75rem;
    }
    .promo-desc {
      color: var(--text-secondary);
      font-size: 1rem;
      max-width: 620px;
      margin-bottom: 2rem;
      line-height: 1.5;
    }
    .demo-buttons-promo {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .news-modal {
      max-width: 640px;
      padding: 0;
      overflow: hidden;
    }
    .modal-news-img {
      width: 100%;
      height: 240px;
      object-fit: cover;
    }
    .modal-news-body {
      padding: 1.5rem;
    }
    .modal-news-title {
      font-size: 1.35rem;
      color: #ffffff;
      margin-bottom: 0.75rem;
    }
    .modal-news-content {
      color: var(--text-secondary);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    @media (max-width: 900px) {
      .two-col-grid { grid-template-columns: 1fr; }
      .hero-title { font-size: 2.2rem; }
    }
  `]
})
export class HomeComponent implements OnInit {
  @Output() openAuthModal = new EventEmitter<'login' | 'register'>();

  searchQuery = '';
  allowedStocks: Stock[] = [];
  featuredAnalyses: SavedAnalysis[] = [];
  newsList: NewsItem[] = [];
  upcomingHolidays: Holiday[] = [];
  nextHoliday: Holiday | null = null;
  selectedArticle: NewsItem | null = null;

  categories = ['All', 'Market', 'Tech', 'Economy', 'Earnings'];
  selectedCategory = 'All';

  loadingAnalyses = false;
  loadingNews = false;

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllowedStocks();
    this.loadFeaturedAnalyses();
    this.loadNews();
    this.loadHolidays();
  }

  loadAllowedStocks(): void {
    this.api.getAllowedStocks().subscribe({
      next: (res) => {
        if (res.success) this.allowedStocks = res.stocks;
      }
    });
  }

  loadFeaturedAnalyses(): void {
    this.loadingAnalyses = true;
    this.api.getHomeFeaturedAnalyses().subscribe({
      next: (res) => {
        this.loadingAnalyses = false;
        if (res.success) this.featuredAnalyses = res.analyses;
      },
      error: () => this.loadingAnalyses = false
    });
  }

  loadNews(): void {
    this.loadingNews = true;
    const cat = this.selectedCategory === 'All' ? '' : this.selectedCategory;
    this.api.getPublishedNews(cat).subscribe({
      next: (res) => {
        this.loadingNews = false;
        if (res.success) this.newsList = res.news;
      },
      error: () => this.loadingNews = false
    });
  }

  filterCategory(cat: string): void {
    this.selectedCategory = cat;
    this.loadNews();
  }

  loadHolidays(): void {
    this.api.getUpcomingHolidays().subscribe({
      next: (res) => {
        if (res.success && res.holidays.length > 0) {
          this.upcomingHolidays = res.holidays;
          this.nextHoliday = res.holidays[0];
        }
      }
    });
  }

  startAnalysis(symbol: string): void {
    if (!symbol) return;
    const s = symbol.trim().toUpperCase();
    if (!this.auth.isLoggedIn()) {
      this.openAuthModal.emit('login');
      return;
    }
    this.router.navigate(['/analyzer'], { queryParams: { symbol: s } });
  }

  triggerAuth(mode: 'login' | 'register'): void {
    this.openAuthModal.emit(mode);
  }

  quickLogin(type: 'admin' | 'trader'): void {
    const creds = type === 'admin' 
      ? { email: 'admin@stockpredict.com', password: 'Admin@123' }
      : { email: 'trader@stockpredict.com', password: 'Trader@123' };

    this.auth.login(creds).subscribe({
      next: () => {
        this.router.navigate(['/analyzer']);
      }
    });
  }

  openNewsModal(article: NewsItem): void {
    this.selectedArticle = article;
  }

  getVerdictClass(verdict: string): string {
    if (verdict === 'STRONG_BUY' || verdict === 'BUY') return 'badge-bull';
    if (verdict === 'STRONG_SELL' || verdict === 'SELL') return 'badge-bear';
    return 'badge-neutral';
  }

  formatVerdict(verdict: string): string {
    return verdict ? verdict.replace('_', ' ') : 'NEUTRAL';
  }

  getRsiClass(rsi: number | undefined): string {
    if (!rsi) return '';
    if (rsi < 35) return 'text-bull';
    if (rsi > 68) return 'text-bear';
    return 'text-secondary';
  }
}
