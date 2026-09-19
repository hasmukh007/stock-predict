// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { StockAnalyzerComponent } from './pages/analyzer/analyzer.component';
import { AnalysisHistoryComponent } from './pages/history/history.component';
import { RemindersComponent } from './pages/reminders/reminders.component';
import { CompareComponent } from './pages/compare/compare.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'StockPredict - Real-Time Stock Analysis & Market Portal' },
  { path: 'analyzer', component: StockAnalyzerComponent, title: 'Stock Analyzer - Technical Indicators & Prediction' },
  { path: 'history', component: AnalysisHistoryComponent, title: 'My Analysis History & Portfolio Dossier' },
  { path: 'reminders', component: RemindersComponent, title: 'Price Reminders & Automated Alerts' },
  { path: 'compare', component: CompareComponent, title: 'Side-by-Side Equities Comparator' },
  { path: 'admin', component: AdminComponent, title: 'Platform Administration & Moderation' },
  { path: '**', redirectTo: '' }
];
