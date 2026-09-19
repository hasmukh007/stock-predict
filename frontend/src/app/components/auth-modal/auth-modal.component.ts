// frontend/src/app/components/auth-modal/auth-modal.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-content auth-dialog" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="auth-header">
          <div>
            <h3 class="auth-title">{{ mode === 'login' ? 'Welcome Back' : 'Create Trader Account' }}</h3>
            <p class="auth-subtitle">
              {{ mode === 'login' ? 'Access full technical indicators & analysis history' : 'Join thousands of quant traders & analysts' }}
            </p>
          </div>
          <button class="close-btn" (click)="close()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Quick Demo Switcher -->
        <div class="demo-buttons">
          <span class="demo-label">1-Click Quick Demo:</span>
          <div class="demo-flex">
            <button type="button" class="btn btn-secondary btn-sm" (click)="fillDemo('admin')">
              👑 Demo Admin
            </button>
            <button type="button" class="btn btn-secondary btn-sm" (click)="fillDemo('trader')">
              📈 Demo Trader
            </button>
          </div>
        </div>

        <!-- Error Alert -->
        <div *ngIf="errorMessage" class="error-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Form -->
        <form (ngSubmit)="submit()" class="auth-form">
          <div class="form-group" *ngIf="mode === 'register'">
            <label class="form-label">Full Name</label>
            <input 
              type="text" 
              class="form-control" 
              placeholder="e.g. Alex Vance" 
              [(ngModel)]="name" 
              name="name" 
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input 
              type="email" 
              class="form-control" 
              placeholder="trader@stockpredict.com" 
              [(ngModel)]="email" 
              name="email" 
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input 
              type="password" 
              class="form-control" 
              placeholder="••••••••" 
              [(ngModel)]="password" 
              name="password" 
              required
            />
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-100 mt-2" [disabled]="loading">
            <span *ngIf="!loading">{{ mode === 'login' ? 'Sign In to Dashboard' : 'Complete Registration' }}</span>
            <span *ngIf="loading">Authenticating...</span>
          </button>
        </form>

        <!-- Footer toggle -->
        <div class="auth-footer">
          <span *ngIf="mode === 'login'">
            Don't have an account? 
            <a href="javascript:void(0)" (click)="setMode('register')">Register here</a>
          </span>
          <span *ngIf="mode === 'register'">
            Already registered? 
            <a href="javascript:void(0)" (click)="setMode('login')">Sign in</a>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-dialog {
      padding: 2rem;
      max-width: 460px;
    }
    .auth-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
    }
    .auth-title {
      font-size: 1.4rem;
      color: #ffffff;
      margin-bottom: 0.25rem;
    }
    .auth-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;
      transition: color 0.2s;
    }
    .close-btn:hover {
      color: #ffffff;
    }
    .demo-buttons {
      background: rgba(59, 130, 246, 0.08);
      border: 1px dashed rgba(59, 130, 246, 0.25);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .demo-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #93c5fd;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .demo-flex {
      display: flex;
      gap: 0.5rem;
    }
    .error-box {
      background: var(--bear-red-bg);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #fda4af;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .auth-form {
      margin-bottom: 1.25rem;
    }
    .w-100 {
      width: 100%;
    }
    .mt-2 {
      margin-top: 0.75rem;
    }
    .auth-footer {
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-secondary);
      border-top: 1px solid var(--border-subtle);
      padding-top: 1rem;
    }
  `]
})
export class AuthModalComponent {
  @Input() mode: 'login' | 'register' = 'login';
  @Output() closeEvent = new EventEmitter<void>();

  name = '';
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(private auth: AuthService) {}

  setMode(newMode: 'login' | 'register'): void {
    this.mode = newMode;
    this.errorMessage = '';
  }

  fillDemo(type: 'admin' | 'trader'): void {
    this.mode = 'login';
    this.errorMessage = '';
    if (type === 'admin') {
      this.email = 'admin@stockpredict.com';
      this.password = 'Admin@123';
    } else {
      this.email = 'trader@stockpredict.com';
      this.password = 'Trader@123';
    }
  }

  submit(): void {
    this.errorMessage = '';
    this.loading = true;

    if (this.mode === 'login') {
      this.auth.login({ email: this.email, password: this.password }).subscribe({
        next: () => {
          this.loading = false;
          this.close();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.error || 'Login failed. Please verify credentials.';
        }
      });
    } else {
      this.auth.register({ name: this.name, email: this.email, password: this.password }).subscribe({
        next: () => {
          this.loading = false;
          this.close();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.error || 'Registration failed.';
        }
      });
    }
  }

  close(): void {
    this.closeEvent.emit();
  }
}
