// frontend/src/app/components/ticker-tape/ticker-tape.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InrPipe } from '../../pipes/inr.pipe';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

@Component({
  selector: 'app-ticker-tape',
  standalone: true,
  imports: [CommonModule, InrPipe],
  template: `
    <div class="ticker-wrapper">
      <div class="ticker-track">
        <div class="ticker-item" *ngFor="let item of items.concat(items)">
          <span class="ticker-symbol">{{ item.symbol }}</span>
          <span class="ticker-price">{{ item.price | inr }}</span>
          <span class="ticker-change" [ngClass]="item.change >= 0 ? 'text-bull' : 'text-bear'">
            {{ item.change >= 0 ? '+' : '' }}{{ item.changePercent | number:'1.2-2' }}%
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ticker-wrapper {
      background: #080c14;
      border-bottom: 1px solid var(--border-subtle);
      overflow: hidden;
      white-space: nowrap;
      height: 38px;
      display: flex;
      align-items: center;
      position: relative;
    }
    .ticker-track {
      display: inline-flex;
      align-items: center;
      gap: 2.5rem;
      animation: tickerMarquee 45s linear infinite;
    }
    .ticker-track:hover {
      animation-play-state: paused;
    }
    .ticker-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
    }
    .ticker-symbol {
      font-weight: 700;
      color: #93c5fd;
    }
    .ticker-price {
      font-weight: 600;
      color: #f1f5f9;
    }
    .ticker-change {
      font-weight: 600;
      font-size: 0.75rem;
      display: inline-flex;
      align-items: center;
    }
    @keyframes tickerMarquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `]
})
export class TickerTapeComponent implements OnInit {
  items: TickerItem[] = [
    { symbol: 'NIFTY 50', name: 'NSE Nifty', price: 23346.40, change: 185.20, changePercent: 0.80 },
    { symbol: 'SENSEX', name: 'BSE Sensex', price: 74294.96, change: 540.35, changePercent: 0.73 },
    { symbol: 'BANK NIFTY', name: 'Bank Nifty', price: 56358.70, change: 412.10, changePercent: 0.74 },
    { symbol: 'NIFTY IT', name: 'Nifty IT', price: 28854.55, change: -120.40, changePercent: -0.42 },
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: 1226.40, change: -101.70, changePercent: -7.66 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: 2105.00, change: -98.30, changePercent: -4.46 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 731.00, change: -68.00, changePercent: -8.51 },
    { symbol: 'INFY', name: 'Infosys', price: 1051.40, change: -76.10, changePercent: -6.75 },
    { symbol: 'TATAMOTORS', name: 'Tata Motors PV', price: 303.80, change: -60.85, changePercent: -16.69 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1338.90, change: -3.40, changePercent: -0.25 },
    { symbol: 'SBIN', name: 'State Bank of India', price: 996.20, change: -46.50, changePercent: -4.46 },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1893.30, change: 12.50, changePercent: 0.66 }
  ];

  ngOnInit(): void {}
}
