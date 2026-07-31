import { useMemo } from 'react';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler,
} from 'chart.js';
import {
  Wallet, TrendingDown, Calendar, CalendarDays, PiggyBank, Target, Flame,
  BellRing, Quote, Sparkles, AlertTriangle, TrendingUp, Zap, Coffee,
  Utensils, ShoppingBag, Clapperboard, CalendarDays as CalDays, PiggyBank as Piggy,
} from 'lucide-react';
import type { AppData } from '../types';
import {
  sumExpenses, sumIncome, txnsThisMonth, txnsThisWeek, txnsToday,
  formatMoney, formatDate, greeting, getStreak, daysLeftInMonth, pct,
  categoryTotals, topCategory, lastNMonthsKeys, monthKey, parseDate,
} from '../utils';
import {
  generateInsights, generateWarnings, calcHealthScore, calcPredictions,
  calcDailySafeSpend, calcLevel,
} from '../analysis';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../icons';
import { useCountUp } from '../hooks';
import { SplitBill } from './SplitBill';
import type { Transaction } from '../types';

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

const QUOTES = [
  'A rupee saved is a rupee earned.',
  'Wealth grows for those who track it.',
  'Small habits build big fortunes.',
  'Don\'t save what\'s left after spending; spend what\'s left after saving.',
  'The art is not in making money, but in keeping it.',
  'Beware of little expenses; a small leak will sink a great ship.',
  'Track your money, or it will track you down.',
  'Financial discipline today buys freedom tomorrow.',
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  PieChart: TrendingDown, TrendingUp, TrendingDown: TrendingDown, AlertTriangle,
  PiggyBank, Coffee, Utensils, ShoppingBag, Clapperboard, CalendarDays: CalDays,
  Flame, Zap, Sparkles,
};

export function Dashboard({ data, onQuickAdd, onQuickLog }: { data: AppData; onQuickAdd: () => void; onQuickLog: (t: Omit<Transaction, 'id' | 'createdAt'>) => void }) {
  const profile = data.profile!;
  const cur = profile.currency;
  const txns = data.transactions;

  const monthTxns = useMemo(() => txnsThisMonth(txns), [txns]);
  const weekTxns = useMemo(() => txnsThisWeek(txns), [txns]);
  const todayTxns = useMemo(() => txnsToday(txns), [txns]);

  const monthExpenses = sumExpenses(monthTxns);
  const weekExpenses = sumExpenses(weekTxns);
  const todayExpenses = sumExpenses(todayTxns);
  const totalBudget = profile.monthlyIncome + profile.monthlyPocketMoney;
  const budgetRemaining = totalBudget - monthExpenses;
  const currentSavings = sumIncome(txns) + totalBudget - sumExpenses(txns);
  const savingsGoalProgress = profile.monthlySavingsGoal > 0 ? pct(Math.min(currentSavings, profile.monthlySavingsGoal), profile.monthlySavingsGoal) : 0;

  const health = useMemo(() => calcHealthScore(data), [data]);
  const predictions = useMemo(() => calcPredictions(data), [data]);
  const dailySafe = useMemo(() => calcDailySafeSpend(data), [data]);
  const insights = useMemo(() => generateInsights(data), [data]);
  const warnings = useMemo(() => generateWarnings(data), [data]);
  const level = calcLevel(data.xp);
  const streak = getStreak(txns);

  const upcomingBills = data.subscriptions
    .filter((s) => {
      const d = parseDate(s.dueDate);
      const now = new Date();
      const diff = (d.getTime() - now.getTime()) / 86400000;
      return diff >= -1 && diff <= 7;
    })
    .sort((a, b) => parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime());

  const recentTxns = txns.slice(0, 5);
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const daysLeft = daysLeftInMonth(new Date());

  // Charts
  const catTotals = categoryTotals(monthTxns);
  const pieData = {
    labels: Object.keys(catTotals),
    datasets: [{
      data: Object.values(catTotals),
      backgroundColor: Object.keys(catTotals).map((c) => CATEGORY_COLORS[c as keyof typeof CATEGORY_COLORS]),
      borderWidth: 0,
    }],
  };
  const pieOptions = { plugins: { legend: { position: 'right' as const, labels: { color: '#94a3b8', font: { size: 11 }, padding: 8 } } }, responsive: true, maintainAspectRatio: false };

  // Weekly bar
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weeklyData = weekDays.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return txns.filter((t) => t.date === ds && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  });
  const barData = {
    labels: weekDays,
    datasets: [{ label: 'Spending', data: weeklyData, backgroundColor: '#3b82f6', borderRadius: 6, barThickness: 28 }],
  };
  const barOptions = { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#94a3b8' }, grid: { display: false } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } } } };

  // Monthly line
  const monthKeys = lastNMonthsKeys(6);
  const monthLabels = monthKeys.map((k) => {
    const [y, m] = k.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short' });
  });
  const monthlyData = monthKeys.map((k) => {
    return txns.filter((t) => monthKey(t.date) === k && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  });
  const lineData = {
    labels: monthLabels,
    datasets: [{ label: 'Expenses', data: monthlyData, borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.15)', fill: true, tension: 0.4, pointBackgroundColor: '#06b6d4', pointRadius: 4 }],
  };
  const lineOptions = { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#94a3b8' }, grid: { display: false } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } } } };

  // Doughnut — savings goal
  const totalGoalTarget = data.goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalGoalCurrent = data.goals.reduce((s, g) => s + g.currentAmount, 0);
  const doughnutData = {
    labels: ['Saved', 'Remaining'],
    datasets: [{
      data: [totalGoalCurrent, Math.max(0, totalGoalTarget - totalGoalCurrent)],
      backgroundColor: ['#22c55e', 'rgba(148,163,184,0.15)'],
      borderWidth: 0,
    }],
  };
  const doughnutOptions = { cutout: '72%', plugins: { legend: { position: 'bottom' as const, labels: { color: '#94a3b8', font: { size: 11 } } } }, responsive: true, maintainAspectRatio: false };

  const healthScore = useCountUp(health.score);

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {greeting()}, {profile.name}
          </h1>
          <p className="text-slate-400 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl">
          <Sparkles className="w-4 h-4 text-accent-400" />
          <span className="text-sm text-white font-medium">Level {level.level} · {level.title}</span>
          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500" style={{ width: `${level.progress * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={Wallet} label="Budget Remaining" value={formatMoney(budgetRemaining, cur)} sub={`${daysLeft} days left`} color="primary" />
        <StatTile icon={TrendingDown} label="Today's Spending" value={formatMoney(todayExpenses, cur)} sub={`${todayTxns.filter(t => t.type === 'expense').length} transactions`} color="error" />
        <StatTile icon={Calendar} label="This Week" value={formatMoney(weekExpenses, cur)} sub={`${weekTxns.filter(t => t.type === 'expense').length} transactions`} color="accent" />
        <StatTile icon={CalendarDays} label="This Month" value={formatMoney(monthExpenses, cur)} sub={`${pct(monthExpenses, totalBudget)}% of budget`} color="warning" />
      </div>

      {/* Split a Bill */}
      <SplitBill currency={cur} onLog={onQuickLog} />

      {/* Daily Safe Spending + Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2 bg-gradient-to-br from-primary-500/10 to-accent-500/10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-accent-400" />
            <h3 className="font-display font-semibold text-white">Daily Safe Spending</h3>
          </div>
          <p className="text-3xl font-display font-bold text-white tabular-nums">{formatMoney(dailySafe, cur)}</p>
          <p className="text-sm text-slate-400 mt-1">
            Based on your remaining budget and {daysLeft} days left this month, you can safely spend {formatMoney(dailySafe, cur)} today.
          </p>
          {dailySafe < 150 && dailySafe > 0 && (
            <div className="mt-3 flex items-start gap-2 bg-warning-500/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-warning-400 mt-0.5 shrink-0" />
              <p className="text-sm text-warning-300">Today's safe spending is only {formatMoney(dailySafe, cur)}. Avoid unnecessary purchases.</p>
            </div>
          )}
          {dailySafe === 0 && (
            <div className="mt-3 flex items-start gap-2 bg-error-500/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-error-400 mt-0.5 shrink-0" />
              <p className="text-sm text-error-300">You've used your full budget. Try to avoid spending today.</p>
            </div>
          )}
        </div>

        {/* Health Score */}
        <div className="glass rounded-2xl p-5 flex flex-col items-center">
          <h3 className="font-display font-semibold text-white mb-3">Financial Health</h3>
          <div className="relative w-28 h-28">
            <svg className="w-full h-full" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="8" />
              <circle className="progress-ring__circle" cx="60" cy="60" r="50" fill="none"
                stroke={health.score >= 80 ? '#22c55e' : health.score >= 60 ? '#3b82f6' : health.score >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - health.score / 100)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-display font-bold text-white tabular-nums">{healthScore}</span>
              <span className="text-xs text-slate-400">{health.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings + Streak + Quote */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-success-400" />
              <h3 className="font-display font-semibold text-white">Current Savings</h3>
            </div>
            <span className="text-xs text-slate-400">{formatMoney(profile.monthlySavingsGoal, cur)} goal</span>
          </div>
          <p className="text-2xl font-display font-bold text-white">{formatMoney(currentSavings, cur)}</p>
          <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-success-500 to-primary-500 rounded-full transition-all duration-500" style={{ width: `${savingsGoalProgress}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{savingsGoalProgress}% of monthly savings goal</p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-warning-400" />
            <h3 className="font-display font-semibold text-white">Current Streak</h3>
          </div>
          <p className="text-2xl font-display font-bold text-white">{streak} days</p>
          <p className="text-xs text-slate-400 mt-1">Keep logging daily to grow your streak!</p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Quote className="w-5 h-5 text-accent-400" />
            <h3 className="font-display font-semibold text-white">Daily Motivation</h3>
          </div>
          <p className="text-sm text-slate-300 italic leading-relaxed">"{quote}"</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">Expense Categories</h3>
          {Object.keys(catTotals).length > 0 ? (
            <div className="h-56"><Pie data={pieData} options={pieOptions} /></div>
          ) : (
            <EmptyChart />
          )}
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">Weekly Spending</h3>
          <div className="h-56"><Bar data={barData} options={barOptions} /></div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">Monthly Trend</h3>
          <div className="h-56"><Line data={lineData} options={lineOptions} /></div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">Savings Goal Progress</h3>
          {data.goals.length > 0 ? (
            <div className="h-56"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
          ) : (
            <EmptyChart text="No savings goals yet" />
          )}
        </div>
      </div>

      {/* Predictions */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          <h3 className="font-display font-semibold text-white">Predictions — Month End</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniStat label="Expected Balance" value={formatMoney(predictions.monthEndBalance, cur)} />
          <MiniStat label="Expected Savings" value={formatMoney(predictions.expectedSavings, cur)} />
          <MiniStat label="Expected Expenses" value={formatMoney(predictions.expectedExpenses, cur)} />
          <MiniStat label="Budget Remaining" value={formatMoney(predictions.budgetRemaining, cur)} />
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent-400" />
            <h3 className="font-display font-semibold text-white">Smart Analysis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins) => {
              const Icon = ICON_MAP[ins.icon] ?? Sparkles;
              return (
                <div key={ins.id} className={`rounded-xl p-4 border ${ins.tone === 'warning' ? 'bg-warning-500/10 border-warning-500/20' : ins.tone === 'positive' ? 'bg-success-500/10 border-success-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ins.tone === 'warning' ? 'bg-warning-500/20' : ins.tone === 'positive' ? 'bg-success-500/20' : 'bg-white/10'}`}>
                      <Icon className={`w-4 h-4 ${ins.tone === 'warning' ? 'text-warning-400' : ins.tone === 'positive' ? 'text-success-400' : 'text-slate-300'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm mb-1">{ins.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{ins.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning-400" />
            <h3 className="font-display font-semibold text-white">Smart Warnings</h3>
          </div>
          <div className="space-y-2">
            {warnings.map((w) => (
              <div key={w.id} className="flex items-start gap-3 bg-warning-500/10 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-warning-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-white">{w.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">→ {w.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Bills + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BellRing className="w-5 h-5 text-accent-400" />
            <h3 className="font-display font-semibold text-white">Upcoming Bills</h3>
          </div>
          {upcomingBills.length > 0 ? (
            <div className="space-y-2">
              {upcomingBills.map((b) => {
                const Icon = CATEGORY_ICONS[b.category];
                const days = Math.ceil((parseDate(b.dueDate).getTime() - Date.now()) / 86400000);
                return (
                  <div key={b.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${CATEGORY_COLORS[b.category]}20` }}>
                      <Icon className="w-4 h-4" style={{ color: CATEGORY_COLORS[b.category] }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{b.name}</p>
                      <p className="text-xs text-slate-400">{formatDate(b.dueDate)} · {days <= 0 ? 'Due today' : `${days} day${days > 1 ? 's' : ''} left`}</p>
                    </div>
                    <span className="text-sm font-semibold text-white">{formatMoney(b.amount, cur)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No upcoming bills this week.</p>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Recent Transactions</h3>
            <button onClick={onQuickAdd} className="text-xs text-primary-400 hover:text-primary-300 font-medium">+ Add</button>
          </div>
          {recentTxns.length > 0 ? (
            <div className="space-y-2">
              {recentTxns.map((t) => {
                const Icon = CATEGORY_ICONS[t.category];
                return (
                  <div key={t.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${CATEGORY_COLORS[t.category]}20` }}>
                      <Icon className="w-4 h-4" style={{ color: CATEGORY_COLORS[t.category] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{t.description}</p>
                      <p className="text-xs text-slate-400">{t.category} · {formatDate(t.date)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-success-400' : 'text-white'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount, cur)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No transactions yet. Tap + to add your first one!</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, sub, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    primary: 'text-primary-400 bg-primary-500/10',
    error: 'text-error-400 bg-error-500/10',
    accent: 'text-accent-400 bg-accent-500/10',
    warning: 'text-warning-400 bg-warning-500/10',
  };
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-display font-bold text-white tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-display font-bold text-white tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function EmptyChart({ text = 'No data yet' }: { text?: string }) {
  return (
    <div className="h-56 flex items-center justify-center">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
