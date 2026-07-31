import { useState } from 'react';
import { Tags, Check, X } from 'lucide-react';
import type { Transaction, Category } from '../types';
import { todayStr } from '../utils';
import { CATEGORY_COLORS } from '../icons';

type Pill = { label: string; emoji: string; category: Category };

const PILLS: Pill[] = [
  { label: 'Chai & Snacks', emoji: '☕', category: 'Coffee' },
  { label: 'Mess & Food', emoji: '🍱', category: 'Food' },
  { label: 'Travel', emoji: '🚆', category: 'Travel' },
  { label: 'Groceries', emoji: '🛒', category: 'Grocery' },
  { label: 'Subscriptions', emoji: '⚡', category: 'Subscriptions' },
];

export function QuickCategoryLog({
  currency,
  onLog,
}: {
  currency: string;
  onLog: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
}) {
  const [active, setActive] = useState<Pill | null>(null);
  const [amount, setAmount] = useState('');

  const reset = () => {
    setActive(null);
    setAmount('');
  };

  const handleLog = () => {
    if (!active) return;
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) return;

    const now = new Date();
    onLog({
      type: 'expense',
      amount: value,
      category: active.category,
      date: todayStr(),
      time: now.toTimeString().slice(0, 5),
      paymentMethod: 'UPI',
      description: `${active.emoji} ${active.label}`,
      favourite: false,
    });
    reset();
  };

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center shrink-0">
          <Tags className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-display text-sm font-bold text-white">
          Quick Category Log <span className="text-slate-400 font-medium">(one-tap expenses)</span>
        </h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {PILLS.map((p) => {
          const selected = active?.label === p.label;
          const color = CATEGORY_COLORS[p.category];
          return (
            <button
              key={p.label}
              onClick={() => {
                setActive(selected ? null : p);
                setAmount('');
              }}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all border"
              style={
                selected
                  ? { backgroundColor: `${color}26`, borderColor: color, color }
                  : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }
              }
            >
              <span aria-hidden="true">{p.emoji}</span>
              {p.label}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="flex flex-col sm:flex-row gap-2 mt-3 animate-scale-in">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{currency}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleLog();
                } else if (e.key === 'Escape') {
                  reset();
                }
              }}
              placeholder={`Amount for ${active.label}`}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleLog}
              disabled={!amount.trim() || !(parseFloat(amount) > 0)}
              className="flex items-center justify-center gap-1.5 shrink-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              <Check className="w-4 h-4" />
              Log Expense
            </button>
            <button
              onClick={reset}
              aria-label="Cancel"
              className="flex items-center justify-center shrink-0 w-10 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
