import { useState, useRef } from 'react';
import { Target, Plus, Trash2, Calendar } from 'lucide-react';
import type { AppData, SavingsGoal } from '../types';
import { Modal } from './Modal';
import { formatMoney, formatDate, parseDate, todayStr } from '../utils';
import { useConfetti } from '../hooks';

export function Goals({ data, onAdd, onContribute, onDelete }: {
  data: AppData;
  onAdd: (g: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  onContribute: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
}) {
  const cur = data.profile!.currency;
  const [showAdd, setShowAdd] = useState(false);
  const [contributing, setContributing] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const { fire, ConfettiLayer } = useConfetti();
  const firedRef = useRef<Set<string>>(new Set());

  // Fire confetti for newly completed goals
  data.goals.forEach((g) => {
    if (g.currentAmount >= g.targetAmount && !firedRef.current.has(g.id)) {
      firedRef.current.add(g.id);
      fire();
    }
    if (g.currentAmount < g.targetAmount) firedRef.current.delete(g.id);
  });

  return (
    <div className="space-y-4">
      <ConfettiLayer />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Savings Goals</h1>
          <p className="text-sm text-slate-400">{data.goals.length} active goals</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {data.goals.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-1">No savings goals yet</p>
          <p className="text-slate-500 text-xs">Create a goal to start tracking your progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.goals.map((g) => {
            const progress = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            const remaining = Math.max(0, g.targetAmount - g.currentAmount);
            const deadline = parseDate(g.deadline);
            const now = new Date();
            const monthsLeft = Math.max(0, (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth()));
            const monthlyReq = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : remaining;
            const estCompletion = new Date(now);
            if (monthlyReq > 0) {
              const monthsNeeded = Math.ceil(remaining / monthlyReq);
              estCompletion.setMonth(estCompletion.getMonth() + monthsNeeded);
            }
            const completed = g.currentAmount >= g.targetAmount;

            return (
              <div key={g.id} className={`glass rounded-2xl p-5 ${completed ? 'ring-1 ring-success-500/40' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary-500/15 flex items-center justify-center">
                      <Target className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-white">{g.name}</h3>
                      <p className="text-xs text-slate-400">Deadline: {formatDate(g.deadline)}</p>
                    </div>
                  </div>
                  {completed && <span className="text-xs bg-success-500/20 text-success-400 px-2 py-1 rounded-full font-medium">Completed!</span>}
                </div>

                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-400">{formatMoney(g.currentAmount, cur)} of {formatMoney(g.targetAmount, cur)}</span>
                  <span className="text-white font-medium">{progress}%</span>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-success-500 to-primary-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-slate-400">Remaining</p>
                    <p className="text-white font-semibold">{formatMoney(remaining, cur)}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-slate-400">Monthly needed</p>
                    <p className="text-white font-semibold">{formatMoney(monthlyReq, cur)}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Est. completion: {formatDate(dateToStr(estCompletion))}
                </p>

                <div className="flex gap-2">
                  {!completed && (
                    <button onClick={() => { setContributing(g.id); setContribAmount(''); }}
                      className="flex-1 py-2 rounded-lg bg-primary-500/15 text-primary-400 text-sm font-medium hover:bg-primary-500/25 transition-colors">
                      Add Money
                    </button>
                  )}
                  <button onClick={() => onDelete(g.id)} className="px-3 py-2 rounded-lg bg-white/5 text-slate-400 hover:bg-error-500/20 hover:text-error-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      <AddGoalModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={onAdd} />

      {/* Contribute Modal */}
      <Modal open={!!contributing} onClose={() => setContributing(null)} title="Add to Goal" maxWidth="max-w-sm">
        <div className="space-y-4">
          <input type="number" min="0" autoFocus value={contribAmount}
            onChange={(e) => setContribAmount(e.target.value)}
            placeholder="Amount"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-2xl font-display font-bold text-white placeholder-slate-600 focus:outline-none focus:border-primary-500" />
          <button onClick={() => {
            const amt = Number(contribAmount);
            if (contributing && amt > 0) { onContribute(contributing, amt); setContributing(null); }
          }} className="w-full py-3 rounded-xl bg-gradient-to-r from-success-500 to-primary-500 text-white font-semibold hover:opacity-90">
            Add {contribAmount && Number(contribAmount) > 0 ? formatMoney(Number(contribAmount), cur) : ''}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function AddGoalModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (g: Omit<SavingsGoal, 'id' | 'createdAt'>) => void }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 3); return dateToStr(d);
  });
  const [error, setError] = useState('');

  const submit = () => {
    setError('');
    if (!name.trim()) return setError('Enter a goal name');
    if (!target || Number(target) <= 0) return setError('Enter a valid target amount');
    if (!deadline) return setError('Pick a deadline');
    onAdd({ name: name.trim(), targetAmount: Number(target), currentAmount: 0, deadline });
    setName(''); setTarget('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Savings Goal">
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Goal Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Laptop"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Amount</label>
            <input type="number" min="0" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="50000"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary-500 [color-scheme:dark]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['Laptop', 'Bike', 'Vacation', 'Emergency Fund', 'Course', 'Phone'].map((preset) => (
            <button key={preset} onClick={() => setName(preset)}
              className="py-2 rounded-lg bg-white/5 text-slate-300 text-xs hover:bg-white/10 transition-colors">
              {preset}
            </button>
          ))}
        </div>
        {error && <p className="text-error-400 text-sm">{error}</p>}
        <button onClick={submit} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:opacity-90">
          Create Goal
        </button>
      </div>
    </Modal>
  );
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
