// frontend/src/app/pages/admin/admin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Stock, SavedAnalysis, NewsItem, Holiday, AdminStats } from '../../models/stock.model';
import { InrPipe } from '../../pipes/inr.pipe';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe],
  template: `
    <div class="admin-page container py-4">
      
      <!-- ADMIN HEADER -->
      <div class="admin-header-flex mb-4">
        <div>
          <div class="badge badge-purple mb-1">SUPERUSER GOVERNANCE</div>
          <h2 class="page-title">Platform Administration Panel</h2>
          <p class="text-secondary">Control allowed equities, home page community feeds, news desk, and market holiday calendars.</p>
        </div>
      </div>

      <!-- TABS NAVIGATION -->
      <div class="admin-tabs mb-4">
        <button class="tab-btn" [class.active]="activeTab === 'stocks'" (click)="activeTab = 'stocks'">
          📊 Allowed Stocks ({{ stocks.length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'analyses'" (click)="activeTab = 'analyses'">
          🔍 Analysis Moderation ({{ analyses.length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'news'" (click)="activeTab = 'news'">
          📰 News Management ({{ newsList.length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'holidays'" (click)="activeTab = 'holidays'">
          🗓️ Holidays Management ({{ holidays.length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'stats'" (click)="activeTab = 'stats'">
          📈 Platform Metrics
        </button>
      </div>

      <!-- TAB 1: ALLOWED STOCKS MANAGEMENT -->
      <div *ngIf="activeTab === 'stocks'" class="tab-pane">
        <div class="card p-4">
          <div class="flex-between mb-3 flex-wrap gap-2">
            <div>
              <h3 class="pane-title">Allowed Stocks Whitelist</h3>
              <p class="text-secondary text-sm">Control which stock tickers users are permitted to analyze.</p>
            </div>
            <div class="d-flex gap-2">
              <input 
                type="text" 
                class="form-control form-control-sm" 
                placeholder="Filter stocks..." 
                [(ngModel)]="stockFilter"
                style="max-width: 200px;"
              />
              <button class="btn btn-primary btn-sm" (click)="showAddStockModal = true">
                + Add New Stock
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company Name</th>
                  <th>Exchange</th>
                  <th>Sector</th>
                  <th>Analysis Allowed?</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of filteredStocks">
                  <td><strong class="text-primary text-md">{{ s.symbol }}</strong></td>
                  <td>{{ s.name }}</td>
                  <td><span class="badge badge-blue">{{ s.exchange }}</span></td>
                  <td>{{ s.sector }}</td>
                  <td>
                    <label class="switch">
                      <input 
                        type="checkbox" 
                        [checked]="s.is_allowed === 1" 
                        (change)="toggleStockAllowed(s)"
                      />
                      <span class="slider"></span>
                    </label>
                    <span class="ml-2 status-text" [ngClass]="s.is_allowed === 1 ? 'text-bull' : 'text-muted'">
                      {{ s.is_allowed === 1 ? 'Permitted' : 'Disabled' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-secondary btn-sm text-bear" (click)="deleteStock(s.id!)">
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: ANALYSES MODERATION (SHOW ON HOME PAGE OR NOT) -->
      <div *ngIf="activeTab === 'analyses'" class="tab-pane">
        <div class="card p-4">
          <div class="flex-between mb-3">
            <div>
              <h3 class="pane-title">Community Analysis Moderation</h3>
              <p class="text-secondary text-sm">Control which user-submitted analyses appear on the public Home Page feed.</p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Analyst</th>
                  <th>Verdict</th>
                  <th>Price / Target</th>
                  <th>Show on Home?</th>
                  <th>Featured?</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of analyses">
                  <td>
                    <strong>{{ a.symbol }}</strong>
                    <div class="text-muted text-xs">{{ a.stock_name }}</div>
                  </td>
                  <td>
                    <div>{{ a.user_name || 'Trader' }}</div>
                    <div class="text-muted text-xs">{{ a.user_email }}</div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getVerdictBadge(a.verdict)">
                      {{ formatVerdict(a.verdict) }}
                    </span>
                  </td>
                  <td>
                    <div>{{ a.current_price | inr }}</div>
                    <div class="text-cyan text-xs" *ngIf="a.target_price">Tgt: {{ a.target_price | inr }}</div>
                  </td>
                  <td>
                    <label class="switch">
                      <input 
                        type="checkbox" 
                        [checked]="a.is_visible_on_home === 1" 
                        (change)="toggleHomeVisibility(a)"
                      />
                      <span class="slider"></span>
                    </label>
                    <span class="ml-2 status-text" [ngClass]="a.is_visible_on_home === 1 ? 'text-bull' : 'text-muted'">
                      {{ a.is_visible_on_home === 1 ? 'Visible' : 'Hidden' }}
                    </span>
                  </td>
                  <td>
                    <button 
                      class="btn btn-sm" 
                      [ngClass]="a.is_featured === 1 ? 'btn-primary' : 'btn-secondary'"
                      (click)="toggleFeatured(a)"
                    >
                      {{ a.is_featured === 1 ? '★ Featured' : '☆ Standard' }}
                    </button>
                  </td>
                  <td>
                    <span class="text-muted text-xs">{{ a.created_at | date:'short' }}</span>
                  </td>
                  <td>
                    <button class="btn btn-secondary btn-sm text-bear" (click)="deleteAnalysis(a.id)">
                      Remove
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: NEWS MANAGEMENT -->
      <div *ngIf="activeTab === 'news'" class="tab-pane">
        <div class="card p-4">
          <div class="flex-between mb-3">
            <div>
              <h3 class="pane-title">Market Desk News Management</h3>
              <p class="text-secondary text-sm">Draft, publish, edit, or remove financial and economic news articles.</p>
            </div>
            <button class="btn btn-primary btn-sm" (click)="openAddNewsModal()">
              + Write News Article
            </button>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Article Title</th>
                  <th>Category</th>
                  <th>Source</th>
                  <th>Published?</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let n of newsList">
                  <td>
                    <img [src]="n.image_url" [alt]="n.title" class="admin-thumb-img"/>
                  </td>
                  <td style="max-width: 300px;">
                    <strong>{{ n.title }}</strong>
                    <div class="text-muted text-xs text-truncate">{{ n.summary }}</div>
                  </td>
                  <td><span class="badge badge-blue">{{ n.category }}</span></td>
                  <td>{{ n.source }}</td>
                  <td>
                    <label class="switch">
                      <input 
                        type="checkbox" 
                        [checked]="n.is_published === 1" 
                        (change)="togglePublishNews(n)"
                      />
                      <span class="slider"></span>
                    </label>
                  </td>
                  <td><span class="text-muted text-xs">{{ n.published_at | date:'shortDate' }}</span></td>
                  <td>
                    <div class="d-flex gap-1">
                      <button class="btn btn-secondary btn-sm" (click)="editNews(n)">Edit</button>
                      <button class="btn btn-secondary btn-sm text-bear" (click)="deleteNews(n.id)">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: HOLIDAYS MANAGEMENT -->
      <div *ngIf="activeTab === 'holidays'" class="tab-pane">
        <div class="card p-4">
          <div class="flex-between mb-3">
            <div>
              <h3 class="pane-title">Exchange Holidays Calendar</h3>
              <p class="text-secondary text-sm">Configure market closure dates and trading schedules for NSE and BSE.</p>
            </div>
            <button class="btn btn-primary btn-sm" (click)="openAddHolidayModal()">
              + Add Holiday
            </button>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Holiday Name</th>
                  <th>Date</th>
                  <th>Exchange</th>
                  <th>Trading Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of holidays">
                  <td><strong>{{ h.name }}</strong></td>
                  <td><span class="text-cyan">{{ h.holiday_date | date:'fullDate' }}</span></td>
                  <td><span class="badge badge-purple">{{ h.exchange }}</span></td>
                  <td>
                    <span class="badge" [ngClass]="h.status === 'closed' ? 'badge-bear' : 'badge-neutral'">
                      {{ h.status === 'closed' ? 'Full Closure' : 'Early Close (1 PM)' }}
                    </span>
                  </td>
                  <td class="text-muted text-xs">{{ h.notes || '-' }}</td>
                  <td>
                    <div class="d-flex gap-1">
                      <button class="btn btn-secondary btn-sm" (click)="editHoliday(h)">Edit</button>
                      <button class="btn btn-secondary btn-sm text-bear" (click)="deleteHoliday(h.id)">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 5: SYSTEM STATS -->
      <div *ngIf="activeTab === 'stats' && stats" class="tab-pane">
        <div class="metrics-row mb-4">
          <div class="card metric-stat-card">
            <span class="m-stat-label">Total Users</span>
            <span class="m-stat-val text-cyan">{{ stats.total_users }}</span>
          </div>
          <div class="card metric-stat-card">
            <span class="m-stat-label">Allowed Stocks</span>
            <span class="m-stat-val text-bull">{{ stats.allowed_stocks }} / {{ stats.total_stocks }}</span>
          </div>
          <div class="card metric-stat-card">
            <span class="m-stat-label">Total Analyses Run</span>
            <span class="m-stat-val text-primary">{{ stats.total_analyses }}</span>
          </div>
          <div class="card metric-stat-card">
            <span class="m-stat-label">Active on Home Page</span>
            <span class="m-stat-val text-purple">{{ stats.home_featured_analyses }}</span>
          </div>
          <div class="card metric-stat-card">
            <span class="m-stat-label">Published News</span>
            <span class="m-stat-val text-neutral">{{ stats.total_news }}</span>
          </div>
          <div class="card metric-stat-card">
            <span class="m-stat-label">Scheduled Holidays</span>
            <span class="m-stat-val text-secondary">{{ stats.total_holidays }}</span>
          </div>
        </div>

        <div class="card p-4">
          <h3 class="pane-title mb-3">Recently Registered Traders</h3>
          <table class="custom-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of stats.recent_users">
                <td>#{{ u.id }}</td>
                <td><strong>{{ u.name }}</strong></td>
                <td>{{ u.email }}</td>
                <td><span class="badge" [ngClass]="u.role === 'admin' ? 'badge-purple' : 'badge-blue'">{{ u.role }}</span></td>
                <td>{{ u.created_at | date:'medium' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ADD STOCK MODAL -->
      <div *ngIf="showAddStockModal" class="modal-backdrop" (click)="showAddStockModal = false">
        <div class="modal-content p-4" (click)="$event.stopPropagation()">
          <h3 class="modal-title mb-3">Add Stock to Whitelist</h3>
          <form (ngSubmit)="submitAddStock()">
            <div class="form-group">
              <label class="form-label">Symbol (e.g. INFY, AMD, ADBE)</label>
              <input type="text" class="form-control text-uppercase" [(ngModel)]="newStock.symbol" name="symbol" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Company Name</label>
              <input type="text" class="form-control" [(ngModel)]="newStock.name" name="name" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Exchange</label>
              <select class="form-control" [(ngModel)]="newStock.exchange" name="exchange">
                <option value="NSE">NSE (National Stock Exchange)</option>
                <option value="BSE">BSE (Bombay Stock Exchange)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Sector</label>
              <input type="text" class="form-control" [(ngModel)]="newStock.sector" name="sector"/>
            </div>
            <div class="form-group mb-3">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="newStock.is_allowed" name="is_allowed"/>
                <span>Enable immediately for user analysis</span>
              </label>
            </div>
            <div class="flex-between mt-3">
              <button type="button" class="btn btn-secondary" (click)="showAddStockModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Stock</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ADD/EDIT NEWS MODAL -->
      <div *ngIf="showNewsModal" class="modal-backdrop" (click)="showNewsModal = false">
        <div class="modal-content p-4" (click)="$event.stopPropagation()">
          <h3 class="modal-title mb-3">{{ editingNewsId ? 'Edit News Article' : 'Publish New Market News' }}</h3>
          <form (ngSubmit)="submitNews()">
            <div class="form-group">
              <label class="form-label">Headline Title</label>
              <input type="text" class="form-control" [(ngModel)]="newsForm.title" name="title" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Summary</label>
              <textarea class="form-control" rows="2" [(ngModel)]="newsForm.summary" name="summary" required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Full Article Content</label>
              <textarea class="form-control" rows="4" [(ngModel)]="newsForm.content" name="content"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Category</label>
                <select class="form-control" [(ngModel)]="newsForm.category" name="category">
                  <option value="Market">Market</option>
                  <option value="Tech">Tech</option>
                  <option value="Economy">Economy</option>
                  <option value="Earnings">Earnings</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Source / Attribution</label>
                <input type="text" class="form-control" [(ngModel)]="newsForm.source" name="source"/>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Image URL</label>
              <input type="text" class="form-control" [(ngModel)]="newsForm.image_url" name="image_url"/>
            </div>
            <div class="flex-between mt-3">
              <button type="button" class="btn btn-secondary" (click)="showNewsModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">{{ editingNewsId ? 'Save Changes' : 'Publish Article' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ADD/EDIT HOLIDAY MODAL -->
      <div *ngIf="showHolidayModal" class="modal-backdrop" (click)="showHolidayModal = false">
        <div class="modal-content p-4" (click)="$event.stopPropagation()">
          <h3 class="modal-title mb-3">{{ editingHolidayId ? 'Edit Market Holiday' : 'Add Market Holiday' }}</h3>
          <form (ngSubmit)="submitHoliday()">
            <div class="form-group">
              <label class="form-label">Holiday Name</label>
              <input type="text" class="form-control" [(ngModel)]="holidayForm.name" name="name" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Date (YYYY-MM-DD)</label>
              <input type="date" class="form-control" [(ngModel)]="holidayForm.holiday_date" name="date" required/>
            </div>
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Exchange</label>
                <input type="text" class="form-control" [(ngModel)]="holidayForm.exchange" name="exchange"/>
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Trading Status</label>
                <select class="form-control" [(ngModel)]="holidayForm.status" name="status">
                  <option value="closed">Closed (Full Day)</option>
                  <option value="early_close">Special Session / Muhurat Trading</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Special Notes (Optional)</label>
              <input type="text" class="form-control" [(ngModel)]="holidayForm.notes" name="notes"/>
            </div>
            <div class="flex-between mt-3">
              <button type="button" class="btn btn-secondary" (click)="showHolidayModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">{{ editingHolidayId ? 'Update Holiday' : 'Create Holiday' }}</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-title {
      font-size: 2.2rem;
      color: #ffffff;
    }
    .admin-tabs {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      background: #0f172a;
      padding: 0.4rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-family: var(--font-sans);
      font-weight: 600;
      font-size: 0.85rem;
      padding: 0.6rem 1.1rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
    }
    .tab-btn.active {
      background: var(--brand-primary);
      color: #ffffff;
    }
    .pane-title {
      font-size: 1.35rem;
      color: #ffffff;
    }
    .status-text {
      font-size: 0.8rem;
      font-weight: 600;
    }
    .admin-thumb-img {
      width: 50px;
      height: 40px;
      border-radius: var(--radius-sm);
      object-fit: cover;
    }
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 1rem;
    }
    .metric-stat-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      text-align: center;
    }
    .m-stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .m-stat-val {
      font-size: 1.8rem;
      font-weight: 800;
      font-family: var(--font-display);
    }
    .text-purple { color: #c084fc; }
    .text-neutral { color: #f59e0b; }
    .text-xs { font-size: 0.75rem; }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .d-flex { display: flex; }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .ml-2 { margin-left: 0.5rem; }
  `]
})
export class AdminComponent implements OnInit {
  activeTab: 'stocks' | 'analyses' | 'news' | 'holidays' | 'stats' = 'stocks';

  stocks: Stock[] = [];
  stockFilter = '';
  analyses: SavedAnalysis[] = [];
  newsList: NewsItem[] = [];
  holidays: Holiday[] = [];
  stats: AdminStats | null = null;

  // Stock modal
  showAddStockModal = false;
  newStock: any = { symbol: '', name: '', exchange: 'NSE', sector: 'Technology', is_allowed: true };

  // News modal
  showNewsModal = false;
  editingNewsId: number | null = null;
  newsForm: any = { title: '', summary: '', content: '', category: 'Market', source: 'MarketDesk', image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60' };

  // Holiday modal
  showHolidayModal = false;
  editingHolidayId: number | null = null;
  holidayForm: any = { name: '', holiday_date: '', exchange: 'NSE/BSE', status: 'closed', notes: '' };

  constructor(
    private api: ApiService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStocks();
    this.loadAnalyses();
    this.loadNews();
    this.loadHolidays();
    this.loadStats();
  }

  loadStocks(): void {
    this.api.getAdminStocks().subscribe({
      next: (res) => { if (res.success) this.stocks = res.stocks; }
    });
  }

  loadAnalyses(): void {
    this.api.getAdminAnalyses().subscribe({
      next: (res) => { if (res.success) this.analyses = res.analyses; }
    });
  }

  loadNews(): void {
    this.api.getAdminNews().subscribe({
      next: (res) => { if (res.success) this.newsList = res.news; }
    });
  }

  loadHolidays(): void {
    this.api.getAdminHolidays().subscribe({
      next: (res) => { if (res.success) this.holidays = res.holidays; }
    });
  }

  loadStats(): void {
    this.api.getAdminStats().subscribe({
      next: (res) => { if (res.success) this.stats = res.stats; }
    });
  }

  // 1. Stocks Actions
  get filteredStocks(): Stock[] {
    const q = this.stockFilter.trim().toLowerCase();
    if (!q) return this.stocks;
    return this.stocks.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  }

  toggleStockAllowed(stock: Stock): void {
    this.api.toggleStockAllowed(stock.id!).subscribe({
      next: (res) => {
        if (res.success) stock.is_allowed = res.is_allowed;
      }
    });
  }

  submitAddStock(): void {
    if (!this.newStock.symbol || !this.newStock.name) return;
    this.api.addStock({
      symbol: this.newStock.symbol.toUpperCase(),
      name: this.newStock.name,
      exchange: this.newStock.exchange,
      sector: this.newStock.sector,
      is_allowed: this.newStock.is_allowed ? 1 : 0
    }).subscribe({
      next: () => {
        this.showAddStockModal = false;
        this.newStock = { symbol: '', name: '', exchange: 'NSE', sector: 'Technology', is_allowed: true };
        this.loadStocks();
      }
    });
  }

  deleteStock(id: number): void {
    if (!confirm('Are you sure you want to remove this stock from the platform?')) return;
    this.api.deleteStock(id).subscribe({
      next: () => { this.stocks = this.stocks.filter(s => s.id !== id); }
    });
  }

  // 2. Analyses Actions
  toggleHomeVisibility(analysis: SavedAnalysis): void {
    this.api.toggleHomeVisibility(analysis.id).subscribe({
      next: (res) => {
        if (res.success) analysis.is_visible_on_home = res.is_visible_on_home;
      }
    });
  }

  toggleFeatured(analysis: SavedAnalysis): void {
    this.api.toggleAnalysisFeatured(analysis.id).subscribe({
      next: (res) => {
        if (res.success) analysis.is_featured = res.is_featured;
      }
    });
  }

  deleteAnalysis(id: number): void {
    if (!confirm('Delete this community analysis?')) return;
    this.api.deleteAnalysis(id).subscribe({
      next: () => { this.analyses = this.analyses.filter(a => a.id !== id); }
    });
  }

  // 3. News Actions
  openAddNewsModal(): void {
    this.editingNewsId = null;
    this.newsForm = { title: '', summary: '', content: '', category: 'Market', source: 'MarketDesk', image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60' };
    this.showNewsModal = true;
  }

  editNews(n: NewsItem): void {
    this.editingNewsId = n.id;
    this.newsForm = { ...n };
    this.showNewsModal = true;
  }

  submitNews(): void {
    if (this.editingNewsId) {
      this.api.updateNews({ id: this.editingNewsId, ...this.newsForm }).subscribe({
        next: () => {
          this.showNewsModal = false;
          this.loadNews();
        }
      });
    } else {
      this.api.createNews(this.newsForm).subscribe({
        next: () => {
          this.showNewsModal = false;
          this.loadNews();
        }
      });
    }
  }

  togglePublishNews(n: NewsItem): void {
    this.api.togglePublishNews(n.id).subscribe({
      next: (res) => {
        if (res.success) n.is_published = res.is_published;
      }
    });
  }

  deleteNews(id: number): void {
    if (!confirm('Are you sure you want to delete this news article?')) return;
    this.api.deleteNews(id).subscribe({
      next: () => { this.newsList = this.newsList.filter(n => n.id !== id); }
    });
  }

  // 4. Holidays Actions
  openAddHolidayModal(): void {
    this.editingHolidayId = null;
    this.holidayForm = { name: '', holiday_date: '', exchange: 'NSE/BSE', status: 'closed', notes: '' };
    this.showHolidayModal = true;
  }

  editHoliday(h: Holiday): void {
    this.editingHolidayId = h.id;
    this.holidayForm = { ...h };
    this.showHolidayModal = true;
  }

  submitHoliday(): void {
    if (this.editingHolidayId) {
      this.api.updateHoliday({ id: this.editingHolidayId, ...this.holidayForm }).subscribe({
        next: () => {
          this.showHolidayModal = false;
          this.loadHolidays();
        }
      });
    } else {
      this.api.createHoliday(this.holidayForm).subscribe({
        next: () => {
          this.showHolidayModal = false;
          this.loadHolidays();
        }
      });
    }
  }

  deleteHoliday(id: number): void {
    if (!confirm('Are you sure you want to delete this holiday schedule?')) return;
    this.api.deleteHoliday(id).subscribe({
      next: () => { this.holidays = this.holidays.filter(h => h.id !== id); }
    });
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
