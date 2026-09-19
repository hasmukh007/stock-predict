// frontend/src/app/pipes/inr.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

export function formatIndianCurrency(val: number | string | null | undefined, showSymbol: boolean = true): string {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  const num = Number(val);
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return showSymbol ? `₹${formatted}` : formatted;
}

@Pipe({
  name: 'inr',
  standalone: true
})
export class InrPipe implements PipeTransform {
  transform(value: number | string | null | undefined, showSymbol: boolean = true): string {
    return formatIndianCurrency(value, showSymbol);
  }
}
