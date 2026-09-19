// frontend/src/app/models/stock.model.ts

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at?: string;
}

export interface Stock {
  id?: number;
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  is_allowed: number;
  created_at?: string;
}

export interface Candle {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  current_price: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema20: number | null;
  rsi14: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  } | null;
  bollinger?: {
    upper: number;
    middle: number;
    lower: number;
  } | null;
  support: number;
  resistance: number;
  volume_vs_avg: string;
}

export interface AnalysisResult {
  indicators: TechnicalIndicators;
  verdict: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  signals: string[];
  target_price_recommended: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  day_high: number;
  day_low: number;
  fifty_two_week_high: number;
  fifty_two_week_low: number;
  source: string;
  is_live: boolean;
}

export interface StockAnalysisResponse {
  success: boolean;
  stock: StockQuote;
  history: Candle[];
  technical: AnalysisResult;
}

export interface SavedAnalysis {
  id: number;
  user_id?: number;
  symbol: string;
  stock_name: string;
  current_price: number;
  target_price: number | null;
  timeframe: string;
  indicators: TechnicalIndicators;
  verdict: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  notes: string;
  is_featured?: number;
  is_visible_on_home?: number;
  created_at: string;
  author_name?: string;
  author_role?: string;
  user_name?: string;
  user_email?: string;
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  image_url: string;
  source: string;
  is_published: number;
  published_at: string;
}

export interface Holiday {
  id: number;
  name: string;
  holiday_date: string;
  exchange: string;
  status: 'closed' | 'early_close';
  notes?: string;
  days_until?: number;
}

export interface Reminder {
  id: number;
  user_id: number;
  symbol: string;
  target_price: number;
  condition: 'above' | 'below';
  is_triggered: number;
  triggered_at: string | null;
  is_active: number;
  note?: string;
  created_at: string;
  current_price?: number;
}

export interface AdminStats {
  total_users: number;
  total_stocks: number;
  allowed_stocks: number;
  total_analyses: number;
  home_featured_analyses: number;
  total_news: number;
  total_holidays: number;
  top_stocks: { symbol: string; count: number }[];
  recent_users: User[];
}
