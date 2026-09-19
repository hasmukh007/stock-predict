// frontend/src/app/services/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/stock.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api/auth.php';

  // State signals
  currentUser = signal<User | null>(null);
  token = signal<string | null>(null);

  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const savedToken = localStorage.getItem('stock_predict_token');
    const savedUser = localStorage.getItem('stock_predict_user');

    if (savedToken && savedUser) {
      try {
        this.token.set(savedToken);
        this.currentUser.set(JSON.parse(savedUser));
        // Verify with /me
        this.fetchProfile().subscribe({
          error: () => this.logout()
        });
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}?action=login`, credentials).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          this.token.set(res.token);
          this.currentUser.set(res.user);
          localStorage.setItem('stock_predict_token', res.token);
          localStorage.setItem('stock_predict_user', JSON.stringify(res.user));
        }
      })
    );
  }

  register(payload: { name: string; email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}?action=register`, payload).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          this.token.set(res.token);
          this.currentUser.set(res.user);
          localStorage.setItem('stock_predict_token', res.token);
          localStorage.setItem('stock_predict_user', JSON.stringify(res.user));
        }
      })
    );
  }

  fetchProfile(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}?action=me`, { headers }).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
          localStorage.setItem('stock_predict_user', JSON.stringify(res.user));
        }
      })
    );
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('stock_predict_token');
    localStorage.removeItem('stock_predict_user');
  }

  getAuthHeaders(): { [header: string]: string } {
    const t = this.token();
    return t ? { 'Authorization': `Bearer ${t}` } : {};
  }
}
