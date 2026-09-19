// frontend/src/app/components/navbar/navbar.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar-header">
      <div class="container navbar-container">
        <!-- Brand -->
        <a routerLink="/" class="brand-logo">
          <div class="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M3 3v18h18" stroke-linecap="round"/>
              <path d="M7 16l4-8 4 5 5-9" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">Stock<span class="brand-gradient">Predict</span></span>
            <span class="brand-badge">PRO</span>
          </div>
        </a>

        <!-- Market Status Badge -->
        <div class="market-pill">
          <span class="pulse-dot"></span>
          <span class="pill-text">NSE &amp; BSE ACTIVE</span>
        </div>

        <!-- Navigation Links -->
        <nav class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            Home
          </a>

          <a routerLink="/analyzer" routerLinkActive="active" class="nav-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Analyzer
          </a>

          <a *ngIf="auth.isLoggedIn()" routerLink="/history" routerLinkActive="active" class="nav-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            History
          </a>

          <a *ngIf="auth.isLoggedIn()" routerLink="/reminders" routerLinkActive="active" class="nav-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Alerts
          </a>

          <a routerLink="/compare" routerLinkActive="active" class="nav-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Compare
          </a>

          <!-- Admin Portal Link -->
          <a *ngIf="auth.isAdmin()" routerLink="/admin" routerLinkActive="active" class="nav-item admin-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Admin Panel
          </a>
        </nav>

        <!-- User Controls / Auth CTA -->
        <div class="nav-auth">
          <ng-container *ngIf="!auth.isLoggedIn()">
            <button class="btn btn-secondary btn-sm" (click)="openAuth('login')">
              Sign In
            </button>
            <button class="btn btn-primary btn-sm" (click)="openAuth('register')">
              Get Started
            </button>
          </ng-container>

          <ng-container *ngIf="auth.isLoggedIn()">
            <div class="user-profile-menu">
              <div class="avatar-ring">
                <div class="avatar-char">{{ (auth.currentUser()?.name || 'U')[0] }}</div>
              </div>
              <div class="user-meta">
                <span class="user-display-name">{{ auth.currentUser()?.name }}</span>
                <span class="user-role-tag" [ngClass]="auth.isAdmin() ? 'tag-admin' : 'tag-trader'">
                  {{ auth.isAdmin() ? 'ADMIN' : 'TRADER' }}
                </span>
              </div>
              <button class="btn-logout" (click)="logout()" title="Logout">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </ng-container>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-header {
      background: rgba(11, 15, 25, 0.85);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 500;
    }
    .navbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 70px;
      gap: 1.5rem;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }
    .logo-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
    }
    .brand-name {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .brand-gradient {
      background: linear-gradient(135deg, #60a5fa 0%, #22d3ee 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #60a5fa;
      border-radius: 4px;
      margin-left: 0.4rem;
    }
    .market-pill {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
      100% { opacity: 1; transform: scale(1); }
    }
    .pill-text {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #10b981;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-md);
      transition: all 0.2s;
    }
    .nav-item:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.04);
    }
    .nav-item.active {
      color: #ffffff;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .admin-link {
      color: #c084fc;
    }
    .admin-link.active {
      background: rgba(168, 85, 247, 0.15);
      border-color: rgba(168, 85, 247, 0.3);
    }
    .nav-auth {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-profile-menu {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #111a2e;
      border: 1px solid var(--border-subtle);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
    }
    .avatar-ring {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      color: #ffffff;
    }
    .user-meta {
      display: flex;
      flex-direction: column;
    }
    .user-display-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-primary);
      max-width: 130px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role-tag {
      font-size: 0.62rem;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .tag-admin { color: #c084fc; }
    .tag-trader { color: #60a5fa; }
    .btn-logout {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.25rem;
      border-radius: 4px;
      transition: color 0.2s;
    }
    .btn-logout:hover {
      color: var(--bear-red);
    }
    @media (max-width: 992px) {
      .market-pill { display: none; }
      .nav-links { gap: 0.2rem; }
      .nav-item { padding: 0.4rem 0.5rem; font-size: 0.8rem; }
    }
  `]
})
export class NavbarComponent {
  @Output() openAuthModal = new EventEmitter<'login' | 'register'>();

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  openAuth(mode: 'login' | 'register'): void {
    this.openAuthModal.emit(mode);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
