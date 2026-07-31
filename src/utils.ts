import type { Transaction, Category, TransactionType, PaymentMethod } from './types';

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

// ---------------------------------------------------------------------------
// Bank / UPI SMS parsing
// ---------------------------------------------------------------------------

export interface ParsedSMS {
  amount: number;
  merchant: string;
  category: Category;
  type: TransactionType;
  paymentMethod: PaymentMethod;
}

// Keyword -> category map. Order matters: earlier, more specific matches win.
const MERCHANT_CATEGORY: { keywords: string[]; category: Category }[] = [
  { category: 'Coffee', keywords: ['starbucks', 'cafe coffee day', 'ccd', 'chai point', 'barista', 'blue tokai', 'third wave', 'chaayos', 'coffee'] },
  { category: 'Food', keywords: ['swiggy', 'zomato', 'dominos', "domino's", 'pizza hut', 'pizza', 'mcdonald', 'kfc', 'burger king', 'burger', 'faasos', 'box8', 'eatsure', 'behrouz', 'ovenstory', 'wow momo', 'haldiram', 'dhaba', 'biryani', 'restaurant', 'eatery', 'tea stall', 'canteen', 'food'] },
  { category: 'Grocery', keywords: ['bigbasket', 'big basket', 'blinkit', 'zepto', 'grofers', 'instamart', 'jiomart', 'jio mart', 'dmart', 'd-mart', 'reliance fresh', 'more supermarket', 'spencer', 'grocery', 'kirana', 'supermarket'] },
  { category: 'Travel', keywords: ['uber', 'ola', 'rapido', 'irctc', 'redbus', 'red bus', 'ixigo', 'makemytrip', 'make my trip', 'goibibo', 'yatra', 'indigo', 'vistara', 'air india', 'spicejet', 'metro', 'namma metro', 'cab', 'auto', 'rickshaw', 'taxi', 'railway', 'flight', 'bus', 'train'] },
  { category: 'Fuel', keywords: ['petrol', 'diesel', 'fuel', 'hp petrol', 'hpcl', 'iocl', 'indian oil', 'bharat petroleum', 'bpcl', 'shell', 'nayara', 'essar', 'filling station'] },
  { category: 'Subscriptions', keywords: ['netflix', 'spotify', 'prime video', 'amazon prime', 'hotstar', 'disney', 'sonyliv', 'sony liv', 'zee5', 'youtube premium', 'jiosaavn', 'gaana', 'apple music', 'audible', 'subscription'] },
  { category: 'Entertainment', keywords: ['bookmyshow', 'book my show', 'pvr', 'inox', 'cinepolis', 'cinema', 'movie', 'multiplex', 'gaming', 'steam', 'playstation', 'xbox'] },
  { category: 'Recharge', keywords: ['recharge', 'jio', 'airtel', 'vodafone', 'vi ', 'idea', 'bsnl', 'dth', 'tatasky', 'tata sky', 'dish tv', 'prepaid', 'postpaid'] },
  { category: 'Shopping', keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'snapdeal', 'nykaa', 'tatacliq', 'tata cliq', 'reliance trends', 'lifestyle', 'shoppers stop', 'decathlon', 'ikea', 'croma', 'shopping'] },
  { category: 'Healthcare', keywords: ['apollo', 'medplus', 'med plus', '1mg', 'tata 1mg', 'pharmeasy', 'netmeds', 'pharmacy', 'hospital', 'clinic', 'diagnostic', 'medical', 'chemist', 'doctor', 'lab'] },
  { category: 'Books', keywords: ['bookstore', 'crossword', 'oswaal', 'chegg', 'coursera', 'udemy', 'kindle', 'books'] },
  { category: 'College Fees', keywords: ['college', 'university', 'tuition', 'semester', 'exam fee', 'admission', 'institute', 'academy'] },
  { category: 'Rent', keywords: ['rent', 'landlord', 'nobroker', 'no broker', 'pg ', 'hostel', 'maintenance'] },
];

function categorize(merchant: string, raw: string): Category {
  const hay = `${merchant} ${raw}`.toLowerCase();
  for (const { keywords, category } of MERCHANT_CATEGORY) {
    if (keywords.some((k) => hay.includes(k))) return category;
  }
  return 'Other';
}

function detectPaymentMethod(raw: string): PaymentMethod {
  const s = raw.toLowerCase();
  if (/credit\s*card|cc\b/.test(s)) return 'Credit Card';
  if (/debit\s*card/.test(s)) return 'Debit Card';
  if (/\bcash\b/.test(s)) return 'Cash';
  // UPI apps / general UPI SMS default to UPI
  if (/upi|phonepe|phone pe|gpay|g pay|google pay|paytm|bhim|amazon pay|@\w+/.test(s)) return 'UPI';
  return 'UPI';
}

function titleCase(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => (w.length > 3 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Parses a standard Indian bank / UPI transaction SMS and extracts the
 * amount, merchant/payee, an auto-assigned category, direction and method.
 * Returns null when no amount could be confidently detected.
 */
export function parseTransactionSMS(input: string): ParsedSMS | null {
  const raw = input.trim();
  if (!raw) return null;

  // --- Amount --------------------------------------------------------------
  // Matches: Rs 250, Rs.250, INR 250, ₹250, Rs 1,250.50
  let amount = NaN;
  const amtWithCurrency = raw.match(/(?:rs\.?|inr|₹)\s*([0-9][\d,]*(?:\.\d{1,2})?)/i);
  if (amtWithCurrency) {
    amount = parseFloat(amtWithCurrency[1].replace(/,/g, ''));
  } else {
    // Fallback: "250 Rs" / "250 INR"
    const amtTrailing = raw.match(/([0-9][\d,]*(?:\.\d{1,2})?)\s*(?:rs\.?|inr|rupees)/i);
    if (amtTrailing) amount = parseFloat(amtTrailing[1].replace(/,/g, ''));
  }
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // --- Direction (income vs expense) ---------------------------------------
  const type: TransactionType = /\b(credited|received|deposit(?:ed)?|refund(?:ed)?|added|cashback)\b/i.test(raw)
    ? 'income'
    : 'expense';

  // --- Merchant / payee -----------------------------------------------------
  const trailingStop = '(?:\\s+(?:on|via|using|ref(?:erence)?|txn|dated|from|to|a\\/c|acct|account|upi|bank|thru|through|no\\.?|id|dt|bal|avl)\\b|[.,;:!]|$)';
  // Generic, non-merchant captures we should ignore ("your account", "a/c", ...)
  const isGeneric = (m: string) => /^(your|a|an|the|account|a\/c|acct|self|wallet)$/i.test(m.trim());

  const grab = (re: RegExp): string => {
    const mm = raw.match(re);
    if (!mm) return '';
    let m = mm[1].replace(/\s+/g, ' ').trim();
    m = m.replace(/@\S+/g, '').replace(/^(your|the)\s+/i, '').replace(/[.\-]+$/, '').trim();
    return isGeneric(m) ? '' : m;
  };

  let merchant = '';
  if (type === 'income') {
    // Credits: prefer the payer following "from" / "by".
    merchant = grab(new RegExp(`(?:from|by)\\s+([A-Za-z0-9&'.\\-@ ]+?)${trailingStop}`, 'i'));
  }
  if (!merchant) {
    // Debits (and income fallback): text after "to"/"at"/"towards"/"for".
    merchant = grab(new RegExp(`(?:in favour of|towards|paid to|sent to|to|at|for)\\s+([A-Za-z0-9&'.\\-@ ]+?)${trailingStop}`, 'i'));
  }
  if (!merchant) merchant = type === 'income' ? 'Received' : 'Merchant';

  return {
    amount,
    merchant: titleCase(merchant),
    category: categorize(merchant, raw),
    type,
    paymentMethod: detectPaymentMethod(raw),
  };
}
