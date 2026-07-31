import { useState } from 'react';
import { Users, Check } from 'lucide-react';
import type { Transaction } from '../types';
import { todayStr, formatMoney } from '../utils';

export function SplitBill({
  currency,
  onLog,
}: {
  currency: string;
  onLog: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
}) {
  const [total, setTotal] = useState('');
  const [friends, setFriends] = useState('');
  const [description, setDescription] = useState('');

  const totalNum = parseFloat(total);
  const friendsNum = parseInt(friends, 10);
  // People sharing = friends + you
  const people = Number.isFinite(friendsNum) && friendsNum > 0 ? friendsNum + 1 : 0;
  const validTotal = Number.isFinite(totalNum) && totalNum > 0;
  const share = validTotal && people > 0 ? totalNum / people : 0;
  const canLog = validTotal && people > 0 && share > 0;

  const handleLog = () => {
    if (!canLog) return;
    const now = new Date();
    const rounded = Math.round(share * 100) / 100;
    const label = description.trim() || 'Split bill';
    onLog({
      type: 'expense',
      amount: rounded,
      category: 'Friends',
      date: todayStr(),
      time: now.toTimeString().slice(0, 5),
      paymentMethod: 'UPI',
      description: `${label} (my share of ${people})`,
      favourite: false,
    });
    setTotal('');
    setFriends('');
    setDescription('');
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-white">Split a Bill</h3>
          <p className="text-xs text-slate-400">Divide a shared expense and log your part</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Total Bill Amount ({currency})</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="0"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Number of Friends</label>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={friends}
            onChange={(e) => setFriends(e.target.value)}
            placeholder="e.g. 3"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleLog();
              }
            }}
            placeholder="Dinner, Rent, Uber…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
        <div className="bg-white/5 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-400">Each person's share</p>
          <p className="text-2xl font-display font-bold text-white tabular-nums">
            {formatMoney(share, currency)}
          </p>
          {canLog && (
            <p className="text-xs text-slate-500 mt-0.5">
              {formatMoney(totalNum, currency)} split between {people} people (you + {friendsNum})
            </p>
          )}
        </div>
        <button
          onClick={handleLog}
          disabled={!canLog}
          className="flex items-center justify-center gap-1.5 shrink-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-semibold rounded-xl px-5 py-3 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <Check className="w-4 h-4" />
          Log My Share
        </button>
      </div>
    </div>
  );
}
