import { useState, useMemo } from 'react';
import { Search, Trash2, Star, Pencil, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import type { AppData, Transaction } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../icons';
import { formatMoney, formatDate, parseDate, dateToStr, startOfWeek } from '../utils';
import { QuickLog } from './QuickLog';
import { QuickCategoryLog } from './QuickCategoryLog';

type FilterKey = 'all' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'income_only' | 'expense_only' | 'custom';

export function Transactions({ data, onDelete, onEdit, onQuickLog }: { data: AppData; onDelete: (id: string) => void; onEdit: (t: Transaction) => void; onQuickLog: (t: Omit<Transaction, 'id' | 'createdAt'>) => void }) {
  const cur = data.profile!.currency;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...data.transactions];
    const now = new Date();

    switch (filter) {
      case 'today': list = list.filter((t) => t.date === dateToStr(now)); break;
      case 'yesterday': { const d = new Date(now); d.setDate(d.getDate() - 1); list = list.filter((t) => t.date === dateToStr(d)); break; }
      case 'this_week': { const s = startOfWeek(now); list = list.filter((t) => parseDate(t.date) >= s); break; }
      case 'last_week': { const s = startOfWeek(now); const from = new Date(s); from.setDate(from.getDate() - 7); const to = new Date(s); to.setMilliseconds(-1); list = list.filter((t) => { const d = parseDate(t.date); return d >= from && d <= to; }); break; }
      case 'this_month': list = list.filter((t) => t.date.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)); break;
      case 'last_month': { const d = new Date(now.getFullYear(), now.getMonth() - 1, 1); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; list = list.filter((t) => t.date.startsWith(key)); break; }
      case 'income_only': list = list.filter((t) => t.type === 'income'); break;
      case 'expense_only': list = list.filter((t) => t.type === 'expense'); break;
      case 'custom': {
        if (customFrom && customTo) {
          const from = parseDate(customFrom); const to = parseDate(customTo); to.setHours(23, 59, 59);
          list = list.filter((t) => { const d = parseDate(t.date); return d >= from && d <= to; });
        }
        break;
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.date.includes(q) ||
        t.paymentMethod.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      );
    }

    return list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [data.transactions, filter, search, customFrom, customTo]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'this_week', label: 'This Week' },
    { key: 'last_week', label: 'Last Week' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'income_only', label: 'Income' },
    { key: 'expense_only', label: 'Expense' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Transactions</h1>
        <p className="text-sm text-slate-400">{filtered.length} transactions found</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by category, description, date, amount..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filter === f.key ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary-500 [color-scheme:dark]" />
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary-500 [color-scheme:dark]" />
        </div>
      )}

      {/* Quick Category Log */}
      <QuickCategoryLog currency={cur} onLog={onQuickLog} />

      {/* Quick Log widget */}
      <QuickLog currency={cur} onLog={onQuickLog} />

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm">No transactions match your search.</p>
          </div>
        ) : (
          filtered.map((t) => {
            const Icon = CATEGORY_ICONS[t.category];
            return (
              <div key={t.id} className="glass rounded-xl p-3 flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${CATEGORY_COLORS[t.category]}20` }}>
                  <Icon className="w-5 h-5" style={{ color: CATEGORY_COLORS[t.category] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {t.type === 'income' ? <ArrowDownCircle className="w-3.5 h-3.5 text-success-400 shrink-0" /> : <ArrowUpCircle className="w-3.5 h-3.5 text-error-400 shrink-0" />}
                    <p className="text-sm text-white font-medium truncate">{t.description}</p>
                    {t.favourite && <Star className="w-3 h-3 text-warning-400 fill-warning-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{t.category} · {t.paymentMethod} · {formatDate(t.date)} {t.time}</p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${t.type === 'income' ? 'text-success-400' : 'text-white'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount, cur)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(t)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setConfirmId(t.id)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-error-500/20 flex items-center justify-center text-slate-400 hover:text-error-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirm delete */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmId(null)} />
          <div className="glass relative rounded-2xl p-6 max-w-sm w-full animate-scale-in">
            <h3 className="font-display font-bold text-white mb-2">Delete transaction?</h3>
            <p className="text-sm text-slate-400 mb-5">This action can be undone for 5 seconds.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10">Cancel</button>
              <button onClick={() => { onDelete(confirmId); setConfirmId(null); }} className="flex-1 py-2.5 rounded-xl bg-error-500 text-white font-medium hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
