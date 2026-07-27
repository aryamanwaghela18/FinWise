import { useMemo } from 'react';
import { BellRing, AlertCircle } from 'lucide-react';
import type { AppData } from '../types';
import { txnsToday, todayStr } from '../utils';
import { calcDailySafeSpend } from '../analysis';

export function Reminders({ data, onDismiss }: { data: AppData; onDismiss: () => void }) {
  const reminders = useMemo(() => {
    const out: { id: string; text: string; icon: 'bell' | 'alert' }[] = [];
    if (!data.profile || !data.settings.notifications) return out;
    if (data.lastReminderDate === todayStr()) return out;

    const todayTxns = txnsToday(data.transactions);
    if (todayTxns.length === 0 && data.transactions.length > 0) {
      out.push({ id: 'no_txn', text: "Don't forget to track today's expenses.", icon: 'bell' });
    }

    const safe = calcDailySafeSpend(data);
    const monthlyGoal = data.profile.monthlySavingsGoal;
    if (monthlyGoal > 0 && safe > 0 && safe < monthlyGoal / 30) {
      const needed = Math.ceil(monthlyGoal / 30 - safe);
      out.push({ id: 'savings_behind', text: `Saving ${data.profile.currency}${needed} today will help you stay on track.`, icon: 'alert' });
    }

    return out;
  }, [data]);

  if (reminders.length === 0) return null;

  return (
    <div className="space-y-2">
      {reminders.map((r) => (
        <div key={r.id} className="glass rounded-xl p-3 flex items-start gap-3 bg-accent-500/5">
          {r.icon === 'bell' ? <BellRing className="w-4 h-4 text-accent-400 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 text-warning-400 mt-0.5 shrink-0" />}
          <p className="text-sm text-slate-200 flex-1">{r.text}</p>
          <button onClick={onDismiss} className="text-xs text-slate-500 hover:text-slate-300 shrink-0">Dismiss</button>
        </div>
      ))}
    </div>
  );
}
