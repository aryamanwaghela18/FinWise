import { useState } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, PiggyBank, StickyNote, X } from 'lucide-react';
import type { TransactionType, Category, PaymentMethod, Transaction } from '../types';
import { CATEGORY_ICONS } from '../icons';
import { todayStr } from '../utils';
import { Modal } from './Modal';

export function QuickActions({ onAddTransaction, onTransferToSavings, onNote }: {
  onAddTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onTransferToSavings: (amount: number) => void;
  onNote: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<'expense' | 'income' | 'transfer' | 'note' | null>(null);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [error, setError] = useState('');

  const actions = [
    { key: 'expense' as const, label: 'Quick Expense', icon: ArrowUpRight, color: 'text-error-400 bg-error-500/15' },
    { key: 'income' as const, label: 'Quick Income', icon: ArrowDownLeft, color: 'text-success-400 bg-success-500/15' },
    { key: 'transfer' as const, label: 'To Savings', icon: PiggyBank, color: 'text-primary-400 bg-primary-500/15' },
    { key: 'note' as const, label: 'Quick Note', icon: StickyNote, color: 'text-warning-400 bg-warning-500/15' },
  ];

  const submit = () => {
    setError('');
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount');
    if ((active === 'expense' || active === 'income') && !desc.trim()) return setError('Enter a description');

    if (active === 'expense' || active === 'income') {
      onAddTransaction({
        type: active as TransactionType,
        amount: amt,
        category,
        date: todayStr(),
        time: new Date().toTimeString().slice(0, 5),
        paymentMethod: 'UPI' as PaymentMethod,
        description: desc.trim(),
        favourite: false,
      });
    } else if (active === 'transfer') {
      onTransferToSavings(amt);
    } else if (active === 'note') {
      onNote(desc.trim() || `Note: ${amount}`);
    }
    setAmount(''); setDesc(''); setActive(null); setOpen(false);
  };

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2">
        {open && (
          <div className="flex flex-col gap-1.5 animate-slide-up mb-2">
            {actions.map((a, i) => (
              <button key={a.key} onClick={() => { setActive(a.key); setAmount(''); setDesc(''); }}
                className="flex items-center gap-2 pl-2 pr-4 py-2 glass rounded-full text-sm text-white hover:scale-105 transition-transform"
                style={{ animationDelay: `${i * 50}ms` }}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center ${a.color}`}>
                  <a.icon className="w-3.5 h-3.5" />
                </span>
                {a.label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-2xl shadow-primary-500/30 hover:scale-110 transition-transform">
          {open ? <X className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
        </button>
      </div>

      {/* Quick modal */}
      <Modal open={!!active} onClose={() => setActive(null)} title={actions.find((a) => a.key === active)?.label ?? 'Quick Action'} maxWidth="max-w-sm">
        <div className="space-y-4">
          {active === 'note' ? (
            <input autoFocus value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Type a quick note..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" />
          ) : (
            <>
              <input type="number" min="0" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-2xl font-display font-bold text-white placeholder-slate-600 focus:outline-none focus:border-primary-500" />
              {active === 'expense' && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(['Food', 'Travel', 'Coffee', 'Shopping', 'Recharge', 'Other'] as Category[]).map((c) => {
                    const Icon = CATEGORY_ICONS[c];
                    return (
                      <button key={c} onClick={() => setCategory(c)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${category === c ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-300'}`}>
                        <Icon className="w-3.5 h-3.5" /> {c}
                      </button>
                    );
                  })}
                </div>
              )}
              <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" />
            </>
          )}
          {error && <p className="text-error-400 text-sm">{error}</p>}
          <button onClick={submit} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:opacity-90">
            Confirm
          </button>
        </div>
      </Modal>
    </>
  );
}
