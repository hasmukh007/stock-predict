// frontend/src/app/pages/reminders/reminders.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Reminder, Stock } from '../../models/stock.model';
import { InrPipe } from '../../pipes/inr.pipe';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe],
  template: `
    <div class="reminders-page container py-4">
      
      <div class="header-flex mb-4">
        <div>
          <div class="badge badge-neutral mb-1">PRICE WATCHDOG</div>
          <h2 class="page-title">Price Reminders & Alerts</h2>
          <p class="text-secondary">Automated triggers that monitor when an allowed Indian stock hits your target threshold in INR (₹).</p>
        </div>
        <div>
          <button class="btn btn-primary" (click)="checkLiveAlerts()" [disabled]="checking">
            <span *ngIf="!checking">⚡ Check Live Prices Now</span>
            <span *ngIf="checking">Checking Live NSE Feeds...</span>
          </button>
        </div>
      </div>

      <!-- TRIGGERED ALERT BANNER -->
      <div *ngIf="newlyTriggered.length > 0" class="card alert-success-card mb-4">
        <div class="alert-icon">🔔</div>
        <div>
          <h4 class="text-bull">Alert Triggered!</h4>
          <p class="text-secondary text-sm">One or more of your watched stock thresholds was hit:</p>
          <div class="triggered-tags mt-2">
            <span *ngFor="let t of newlyTriggered" class="triggered-badge">
              <strong>{{ t.symbol }}</strong> reached {{ t.current_price | inr }} 
              (Target: {{ t.target_price | inr }} {{ t.condition }})
            </span>
          </div>
        </div>
      </div>

      <div class="two-column-layout">
        
        <!-- LEFT: CREATE REMINDER FORM -->
        <div class="card create-reminder-card">
          <h3 class="card-heading mb-3">Set New Price Reminder</h3>
          
          <form (ngSubmit)="createReminder()" class="reminder-form">
            <div class="form-group">
              <label class="form-label">Stock Symbol (NSE/BSE)</label>
              <select class="form-control text-uppercase" [(ngModel)]="newSymbol" name="symbol" required>
                <option value="" disabled selected>-- Select an Allowed Stock --</option>
                <option *ngFor="let s of allowedStocks" [value]="s.symbol">
                  {{ s.symbol }} - {{ s.name }}
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Condition</label>
                <select class="form-control" [(ngModel)]="newCondition" name="condition">
                  <option value="above">Crosses Above (≥)</option>
                  <option value="below">Drops Below (≤)</option>
                </select>
              </div>

              <div class="form-group flex-1">
                <label class="form-label">Target Price (₹)</label>
                <input 
                  type="number" 
                  step="0.05" 
                  class="form-control" 
                  placeholder="e.g. 3100.00" 
                  [(ngModel)]="newTargetPrice" 
                  name="targetPrice" 
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notification Note (Optional)</label>
              <input 
                type="text" 
                class="form-control" 
                placeholder="e.g. Breakout above resistance, accumulate on dips" 
                [(ngModel)]="newNote" 
                name="note"
              />
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-100 mt-2" [disabled]="submitting">
              <span *ngIf="!submitting">+ Activate Price Alert</span>
              <span *ngIf="submitting">Creating Alert...</span>
            </button>
          </form>
        </div>

        <!-- RIGHT: ACTIVE REMINDERS LIST -->
        <div class="reminders-list-column">
          <div class="card list-card">
            <div class="flex-between mb-3">
              <h3 class="card-heading">Your Active Alerts ({{ reminders.length }})</h3>
              <span class="text-secondary text-sm">Real-time status</span>
            </div>

            <div *ngIf="loading" class="loading-state">
              <div class="spinner"></div>
              <span>Loading reminders...</span>
            </div>

            <div *ngIf="!loading && reminders.length === 0" class="empty-state p-4 text-center">
              <p class="text-muted">No active price reminders. Use the form to set an alert.</p>
            </div>

            <div *ngIf="!loading && reminders.length > 0" class="reminders-stack">
              <div *ngFor="let rem of reminders" class="reminder-item" [class.item-triggered]="rem.is_triggered">
                
                <div class="rem-header flex-between">
                  <div class="rem-sym-flex">
                    <span class="rem-symbol">{{ rem.symbol }}</span>
                    <span class="badge" [ngClass]="rem.condition === 'above' ? 'badge-bull' : 'badge-bear'">
                      {{ rem.condition === 'above' ? '≥ ABOVE' : '≤ BELOW' }} {{ rem.target_price | inr }}
                    </span>
                    <span *ngIf="rem.is_triggered" class="badge badge-purple">
                      TRIGGERED
                    </span>
                  </div>

                  <div class="rem-controls">
                    <button class="btn-del" (click)="deleteReminder(rem.id)" title="Delete Alert">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="rem-note mt-2" *ngIf="rem.note">
                  "{{ rem.note }}"
                </div>

                <div class="rem-footer flex-between mt-2 pt-2">
                  <span class="rem-date">Created: {{ rem.created_at | date:'shortDate' }}</span>
                  <span *ngIf="rem.is_triggered" class="text-bull text-xs">
                    Triggered at: {{ rem.triggered_at | date:'shortTime' }}
                  </span>
                </div>
              </div>
            </div>

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
    .alert-success-card {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid var(--bull-green);
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1.25rem;
    }
    .alert-icon {
      font-size: 2rem;
    }
    .triggered-tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .triggered-badge {
      background: #0f291e;
      border: 1px solid #10b981;
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      color: #ffffff;
    }
    .two-column-layout {
      display: grid;
      grid-template-columns: 1fr 1.3fr;
      gap: 2rem;
    }
    .card-heading {
      font-size: 1.2rem;
      color: #ffffff;
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .flex-1 { flex: 1; }
    .w-100 { width: 100%; }
    .reminders-stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .reminder-item {
      background: #0d1424;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1rem;
      transition: border-color 0.2s;
    }
    .reminder-item:hover {
      border-color: var(--border-medium);
    }
    .item-triggered {
      border-color: rgba(168, 85, 247, 0.5);
      background: rgba(168, 85, 247, 0.05);
    }
    .rem-sym-flex {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .rem-symbol {
      font-size: 1.2rem;
      font-weight: 800;
      color: #ffffff;
    }
    .btn-del {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
    }
    .btn-del:hover {
      color: var(--bear-red);
    }
    .rem-note {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-style: italic;
    }
    .rem-footer {
      border-top: 1px solid var(--border-subtle);
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .text-xs { font-size: 0.75rem; }

    @media (max-width: 900px) {
      .two-column-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class RemindersComponent implements OnInit {
  reminders: Reminder[] = [];
  allowedStocks: Stock[] = [];
  loading = false;
  submitting = false;
  checking = false;
  newlyTriggered: any[] = [];

  newSymbol = 'RELIANCE';
  newTargetPrice = 1300;
  newCondition = 'above';
  newNote = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadReminders();
    this.loadAllowedStocks();
  }

  loadReminders(): void {
    this.loading = true;
    this.api.getReminders().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) this.reminders = res.reminders;
      },
      error: () => this.loading = false
    });
  }

  loadAllowedStocks(): void {
    this.api.getAllowedStocks().subscribe({
      next: (res) => {
        if (res.success) this.allowedStocks = res.stocks;
      }
    });
  }

  createReminder(): void {
    if (!this.newSymbol || this.newTargetPrice <= 0) return;
    this.submitting = true;

    this.api.createReminder({
      symbol: this.newSymbol,
      target_price: this.newTargetPrice,
      condition: this.newCondition,
      note: this.newNote
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.newNote = '';
        this.loadReminders();
      },
      error: () => this.submitting = false
    });
  }

  checkLiveAlerts(): void {
    this.checking = true;
    this.newlyTriggered = [];

    this.api.checkReminders().subscribe({
      next: (res) => {
        this.checking = false;
        if (res.newly_triggered && res.newly_triggered.length > 0) {
          this.newlyTriggered = res.newly_triggered;
        }
        this.loadReminders();
      },
      error: () => this.checking = false
    });
  }

  deleteReminder(id: number): void {
    this.api.deleteReminder(id).subscribe({
      next: () => {
        this.reminders = this.reminders.filter(r => r.id !== id);
      }
    });
  }
}
