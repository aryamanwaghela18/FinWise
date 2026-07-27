import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Modal } from './Modal';
import type { TransactionType, PaymentMethod, Category, Transaction } from '../types';
import { CATEGORIES, PAYMENT_METHODS } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../icons';
import { todayStr } from '../utils';

export function AddTransactionModal({
  open, onClose, onAdd, editing,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  editing?: Transaction | null;
}) {
  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [category, setCategory] = useState<Category>(editing?.category ?? 'Food');
  const [date, setDate] = useState(editing?.date ?? todayStr());
  const [time, setTime] = useState(editing?.time ?? new Date().toTimeString().slice(0, 5));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(editing?.paymentMethod ?? 'UPI');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [favourite, setFavourite] = useState(editing?.favourite ?? false);
  const [receiptNumber, setReceiptNumber] = useState(editing?.receiptNumber ?? '');
  const [error, setError] = useState('');

  const submit = () => {
    setError('');
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) return setError('Enter a valid positive amount');
    if (!description.trim()) return setError('Please add a description');
    if (!date) return setError('Pick a date');
    if (!time) return setError('Pick a time');
    onAdd({ type, amount: amt, category, date, time, paymentMethod, description: description.trim(), favourite, receiptNumber: receiptNumber.trim() || undefined });
    // reset
    setAmount(''); setDescription(''); setReceiptNumber(''); setFavourite(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Transaction' : 'Add Transaction'}>
      <div className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl">
          <button onClick={() => setType('expense')}
            className={`py-2.5 rounded-lg font-medium text-sm transition-all ${type === 'expense' ? 'bg-error-500 text-white' : 'text-slate-400'}`}>
            Expense
          </button>
          <button onClick={() => setType('income')}
            className={`py-2.5 rounded-lg font-medium text-sm transition-all ${type === 'income' ? 'bg-success-500 text-white' : 'text-slate-400'}`}>
            Income
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Amount</label>
          <input type="number" min="0" step="1" inputMode="decimal" autoFocus value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-2xl font-display font-bold text-white placeholder-slate-600 focus:outline-none focus:border-primary-500" />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c];
              const active = category === c;
              return (
                <button key={c} onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all ${active ? 'bg-white/10 ring-1 ring-primary-500' : 'bg-white/5 hover:bg-white/10'}`}
                  style={active ? { boxShadow: `inset 0 0 0 1px ${CATEGORY_COLORS[c]}` } : {}}>
                  <Icon className="w-5 h-5" style={{ color: CATEGORY_COLORS[c] }} />
                  <span className="text-[10px] text-slate-300 leading-tight text-center">{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary-500 [color-scheme:dark]" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary-500 [color-scheme:dark]" />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Payment Method</label>
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((p) => (
              <button key={p} onClick={() => setPaymentMethod(p)}
                className={`py-2 rounded-lg text-xs font-medium transition-all ${paymentMethod === p ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Lunch at canteen"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" />
        </div>

        {/* Receipt + Favourite */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Receipt No. (optional)</label>
            <input value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="RC-001"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Favourite</label>
            <button onClick={() => setFavourite(!favourite)}
              className={`w-full py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${favourite ? 'bg-warning-500/20 border-warning-500 text-warning-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
              {favourite ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span className="text-sm">{favourite ? 'Marked' : 'Mark'}</span>
            </button>
          </div>
        </div>

        {error && <p className="text-error-400 text-sm">{error}</p>}

        <button onClick={submit}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {editing ? 'Update' : 'Add Transaction'}
        </button>
      </div>
    </Modal>
  );
}
