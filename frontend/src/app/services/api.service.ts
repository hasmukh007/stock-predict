// frontend/src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { 
  Stock, 
  StockAnalysisResponse, 
  SavedAnalysis, 
  NewsItem, 
  Holiday, 
  Reminder, 
  AdminStats 
} from '../models/stock.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private base = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  // 1. STOCKS
  getAllowedStocks(search = ''): Observable<{ success: boolean; stocks: Stock[] }> {
    return this.http.get<{ success: boolean; stocks: Stock[] }>(
      `${this.base}/stocks.php?action=allowed&search=${encodeURIComponent(search)}`
    );
  }

  getAdminStocks(search = ''): Observable<{ success: boolean; stocks: Stock[] }> {
    return this.http.get<{ success: boolean; stocks: Stock[] }>(
      `${this.base}/stocks.php?action=admin_list&search=${encodeURIComponent(search)}`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  toggleStockAllowed(id: number): Observable<any> {
    return this.http.post(
      `${this.base}/stocks.php?action=toggle_allowed`,
      { id },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  addStock(stock: Partial<Stock>): Observable<any> {
    return this.http.post(
      `${this.base}/stocks.php?action=add`,
      stock,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  deleteStock(id: number): Observable<any> {
    return this.http.post(
      `${this.base}/stocks.php?action=delete`,
      { id },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // 2. ANALYSIS
  fetchAndAnalyzeStock(symbol: string, range = '3mo'): Observable<StockAnalysisResponse> {
    return this.http.get<StockAnalysisResponse>(
      `${this.base}/analysis.php?action=fetch_and_analyze&symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  saveAnalysis(payload: any): Observable<any> {
    return this.http.post(
      `${this.base}/analysis.php?action=save`,
      payload,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getUserAnalysisHistory(): Observable<{ success: boolean; history: SavedAnalysis[] }> {
    return this.http.get<{ success: boolean; history: SavedAnalysis[] }>(
      `${this.base}/analysis.php?action=history`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getHomeFeaturedAnalyses(): Observable<{ success: boolean; analyses: SavedAnalysis[] }> {
    return this.http.get<{ success: boolean; analyses: SavedAnalysis[] }>(
      `${this.base}/analysis.php?action=home_featured`
    );
  }

  getAdminAnalyses(): Observable<{ success: boolean; analyses: SavedAnalysis[] }> {
    return this.http.get<{ success: boolean; analyses: SavedAnalysis[] }>(
      `${this.base}/analysis.php?action=admin_list`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  toggleHomeVisibility(id: number): Observable<any> {
    return this.http.post(
      `${this.base}/analysis.php?action=toggle_home_visibility`,
      { id },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  toggleAnalysisFeatured(id: number): Observable<any> {
    return this.http.post(
      `${this.base}/analysis.php?action=toggle_featured`,
      { id },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  deleteAnalysis(id: number): Observable<any> {
    return this.http.post(
      `${this.base}/analysis.php?action=delete`,
      { id },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // 3. NEWS
  getPublishedNews(category = ''): Observable<{ success: boolean; news: NewsItem[] }> {
    return this.http.get<{ success: boolean; news: NewsItem[] }>(
      `${this.base}/news.php?action=list&category=${encodeURIComponent(category)}`
    );
  }

  getAdminNews(): Observable<{ success: boolean; news: NewsItem[] }> {
    return this.http.get<{ success: boolean; news: NewsItem[] }>(
      `${this.base}/news.php?action=admin_list`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  createNews(item: Partial<NewsItem>): Observable<any> {
    return this.http.post(
      `${this.base}/news.php?action=create`,
      item,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  updateNews(item: Partial<NewsItem>): Observable<any> {
    return this.http.post(
      `${this.base}/news.php?action=update`,
      item,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  deleteNews(id: number): Observable<any> {
    return this.http.post(
      `${this.base}/news.php?action=delete`,
      { id },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  togglePublishNews(id: number): Observable<any> {
    return this.http.post(
      `${this.base}/news.php?action=toggle_publish`,
      { id },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // 4. HOLIDAYS
  getUpcomingHolidays(): Observable<{ success: boolean; holidays: Holiday[] }> {
    return this.http.get<{ success: boolean; holidays: Holiday[] }>(
      `${this.base}/holidays.php?action=upcoming`
    );
  }

  getAdminHolidays(): Observable<{ success: boolean; holidays: Holiday[] }> {
    return this.http.get<{ success: boolean; holidays: Holiday[] }>(
      `${this.base}/holidays.php?action=admin_list`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  createHoliday(holiday: Partial<Holiday>): Observable<any> {
    return this.http.post(
      `${this.base}/holidays.php?action=create`,
      holiday,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  updateHoliday(holiday: Partial<Holiday>): Observable<any> {
    return this.http.post(
      `${this.base}/holidays.php?action=update`,
      holiday,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  deleteHoliday(id: number): Observable<any> {
    return this.http.post(
      `${this.base}/holidays.php?action=delete`,
      { id },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // 5. REMINDERS
  getReminders(): Observable<{ success: boolean; reminders: Reminder[] }> {
    return this.http.get<{ success: boolean; reminders: Reminder[] }>(
      `${this.base}/reminders.php?action=list`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  createReminder(reminder: { symbol: string; target_price: number; condition: string; note: string }): Observable<any> {
    return this.http.post(
      `${this.base}/reminders.php?action=create`,
      reminder,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  checkReminders(): Observable<any> {
    return this.http.post(
      `${this.base}/reminders.php?action=check`,
      {},
      { headers: this.auth.getAuthHeaders() }
    );
  }

  deleteReminder(id: number): Observable<any> {
    return this.http.post(
      `${this.base}/reminders.php?action=delete`,
      { id },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  toggleReminderActive(id: number): Observable<any> {
    return this.http.post(
      `${this.base}/reminders.php?action=toggle_active`,
      { id },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // 6. ADMIN STATS
  getAdminStats(): Observable<{ success: boolean; stats: AdminStats }> {
    return this.http.get<{ success: boolean; stats: AdminStats }>(
      `${this.base}/admin.php?action=stats`,
      { headers: this.auth.getAuthHeaders() }
    );
  }
}
