// frontend/src/app/app.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { TickerTapeComponent } from './components/ticker-tape/ticker-tape.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, TickerTapeComponent, AuthModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  showAuthModal = false;
  authMode: 'login' | 'register' = 'login';

  openAuth(mode: 'login' | 'register' = 'login'): void {
    this.authMode = mode;
    this.showAuthModal = true;
  }

  closeAuth(): void {
    this.showAuthModal = false;
  }
}
