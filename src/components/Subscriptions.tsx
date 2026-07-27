import { useState } from 'react';
import { RefreshCw, Plus, Trash2, BellRing } from 'lucide-react';
import type { AppData, Subscription } from '../types';
import { Modal } from './Modal';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../icons';
import { formatMoney, formatDate, parseDate, todayStr } from '../utils';

export function Subscriptions({ data, onAdd, onDelete }: {
  data: AppData;
  onAdd: (s: Omit<Subscription, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}) {
  const cur = data.profile!.currency;
  const [showAdd, setShowAdd] = useState(false);

  const sorted = [...data.subscriptions].sort((a, b) => parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime());
  const monthlyTotal = data.subscriptions.filter((s) => s.recurring === 'monthly').reduce((s, x) => s + x.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Subscriptions</h1>
          <p className="text-sm text-slate-400">{data.subscriptions.length} tracked · {formatMoney(monthlyTotal, cur)}/mo</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {data.subscriptions.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <RefreshCw className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-1">No subscriptions tracked yet</p>
          <p className="text-slate-500 text-xs">Track Netflix, Spotify, gym, and more to never miss a due date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sorted.map((s) => {
            const Icon = CATEGORY_ICONS[s.category];
            const due = parseDate(s.dueDate);
            const now = new Date();
            const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);
            const urgent = days <= 3 && days >= -1;
            return (
              <div key={s.id} className={`glass rounded-2xl p-4 ${urgent ? 'ring-1 ring-warning-500/40' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${CATEGORY_COLORS[s.category]}20` }}>
                    <Icon className="w-5 h-5" style={{ color: CATEGORY_COLORS[s.category] }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-white">{s.name}</h3>
                    <p className="text-xs text-slate-400">{s.recurring === 'monthly' ? 'Monthly' : 'Yearly'} · Due {formatDate(s.dueDate)}</p>
                  </div>
                  <span className="text-sm font-semibold text-white">{formatMoney(s.amount, cur)}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  {days <= 0 ? (
                    <span className="text-xs text-error-400 flex items-center gap-1"><BellRing className="w-3 h-3" /> Due today!</span>
                  ) : days <= 3 ? (
                    <span className="text-xs text-warning-400 flex items-center gap-1"><BellRing className="w-3 h-3" /> {days} day{days > 1 ? 's' : ''} left</span>
                  ) : (
                    <span className="text-xs text-slate-400">{days} days left</span>
                  )}
                  <button onClick={() => onDelete(s.id)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-error-500/20 flex items-center justify-center text-slate-400 hover:text-error-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddSubModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={onAdd} />
    </div>
  );
}

const PRESETS = [
  { name: 'Netflix', amount: 199, category: 'Subscriptions' as const },
  { name: 'Spotify', amount: 119, category: 'Subscriptions' as const },
  { name: 'Amazon Prime', amount: 1499, category: 'Subscriptions' as const },
  { name: 'YouTube Premium', amount: 129, category: 'Subscriptions' as const },
  { name: 'Gym', amount: 800, category: 'Healthcare' as const },
  { name: 'Hostel', amount: 5000, category: 'Rent' as const },
  { name: 'Internet', amount: 600, category: 'Recharge' as const },
  { name: 'Electricity', amount: 400, category: 'Other' as const },
];

function AddSubModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (s: Omit<Subscription, 'id' | 'createdAt'>) => void }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(todayStr());
  const [recurring, setRecurring] = useState<'monthly' | 'yearly'>('monthly');
  const [category, setCategory] = useState<Subscription['category']>('Subscriptions');
  const [error, setError] = useState('');

  const submit = () => {
    setError('');
    if (!name.trim()) return setError('Enter a name');
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount');
    if (!dueDate) return setError('Pick a due date');
    onAdd({ name: name.trim(), amount: Number(amount), dueDate, recurring, category });
    setName(''); setAmount('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Subscription">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button key={p.name} onClick={() => { setName(p.name); setAmount(String(p.amount)); setCategory(p.category); }}
              className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${name === p.name ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
              {p.name}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Subscription name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Amount</label>
            <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="199"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary-500 [color-scheme:dark]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(['monthly', 'yearly'] as const).map((r) => (
            <button key={r} onClick={() => setRecurring(r)}
              className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${recurring === r ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-300'}`}>
              {r}
            </button>
          ))}
        </div>
        {error && <p className="text-error-400 text-sm">{error}</p>}
        <button onClick={submit} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:opacity-90">
          Add Subscription
        </button>
      </div>
    </Modal>
  );
}
