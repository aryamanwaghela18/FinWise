import type { Transaction, Category } from './types';

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function todayStr(): string {
  return dateToStr(new Date());
}

export function dateToStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function daysLeftInMonth(d: Date): number {
  const end = endOfMonth(d);
  const diff = Math.ceil((end.getTime() - d.getTime()) / 86400000);
  return Math.max(0, diff);
}

export function formatDate(s: string): string {
  const d = parseDate(s);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(t: string): string {
  return t;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

export function formatMoney(n: number, currency: string): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}${currency}${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function pct(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
}

export function sumExpenses(txns: Transaction[]): number {
  return txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
}

export function sumIncome(txns: Transaction[]): number {
  return txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
}

export function txnsInRange(txns: Transaction[], from: Date, to: Date): Transaction[] {
  return txns.filter((t) => {
    const d = parseDate(t.date);
    return d >= from && d <= to;
  });
}

export function txnsForDay(txns: Transaction[], date: string): Transaction[] {
  return txns.filter((t) => t.date === date);
}

export function txnsThisMonth(txns: Transaction[]): Transaction[] {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = endOfMonth(now);
  return txnsInRange(txns, from, to);
}

export function txnsThisWeek(txns: Transaction[]): Transaction[] {
  const now = new Date();
  const from = startOfWeek(now);
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  return txnsInRange(txns, from, to);
}

export function txnsToday(txns: Transaction[]): Transaction[] {
  return txnsForDay(txns, todayStr());
}

export function txnsYesterday(txns: Transaction[]): Transaction[] {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return txnsForDay(txns, dateToStr(d));
}

export function txnsLastWeek(txns: Transaction[]): Transaction[] {
  const now = new Date();
  const thisStart = startOfWeek(now);
  const from = new Date(thisStart);
  from.setDate(from.getDate() - 7);
  const to = new Date(thisStart);
  to.setMilliseconds(-1);
  return txnsInRange(txns, from, to);
}

export function txnsLastMonth(txns: Transaction[]): Transaction[] {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  return txnsInRange(txns, from, to);
}

export function categoryTotals(txns: Transaction[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const t of txns) {
    if (t.type === 'expense') {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    }
  }
  return totals;
}

export function topCategory(txns: Transaction[]): Category | null {
  const totals = categoryTotals(txns);
  const entries = Object.entries(totals);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0] as Category;
}

export function averageDailySpend(txns: Transaction[]): number {
  if (txns.length === 0) return 0;
  const dates = new Set(txns.map((t) => t.date));
  const total = sumExpenses(txns);
  return total / Math.max(1, dates.size);
}

export function highestSpendingDay(txns: Transaction[]): { date: string; amount: number } | null {
  const byDay: Record<string, number> = {};
  for (const t of txns) {
    if (t.type === 'expense') byDay[t.date] = (byDay[t.date] || 0) + t.amount;
  }
  const entries = Object.entries(byDay);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return { date: entries[0][0], amount: entries[0][1] };
}

export function isWeekend(dateStr: string): boolean {
  const d = parseDate(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function weekendVsWeekday(txns: Transaction[]): { weekend: number; weekday: number; weekendAvg: number; weekdayAvg: number } {
  let weekend = 0, weekday = 0, weekendDays = 0, weekdayDays = 0;
  const byDay: Record<string, number> = {};
  for (const t of txns) {
    if (t.type === 'expense') byDay[t.date] = (byDay[t.date] || 0) + t.amount;
  }
  for (const [date, amt] of Object.entries(byDay)) {
    if (isWeekend(date)) { weekend += amt; weekendDays++; }
    else { weekday += amt; weekdayDays++; }
  }
  return {
    weekend,
    weekday,
    weekendAvg: weekendDays ? weekend / weekendDays : 0,
    weekdayAvg: weekdayDays ? weekday / weekdayDays : 0,
  };
}

export function countByCategory(txns: Transaction[], cat: Category): number {
  return txns.filter((t) => t.type === 'expense' && t.category === cat).length;
}

export function categoryShare(txns: Transaction[], cat: Category): number {
  const total = sumExpenses(txns);
  if (total === 0) return 0;
  const catTotal = txns.filter((t) => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0);
  return Math.round((catTotal / total) * 100);
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function lastNMonthsKeys(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function getStreak(txns: Transaction[]): number {
  if (txns.length === 0) return 0;
  const dates = new Set(txns.map((t) => t.date));
  let streak = 0;
  const d = new Date();
  // Allow today to not have a txn yet without breaking streak
  if (!dates.has(dateToStr(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (dates.has(dateToStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
