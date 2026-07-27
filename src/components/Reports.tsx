import { useMemo, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { FileText, Printer, Download, TrendingDown, TrendingUp, Award, Calendar } from 'lucide-react';
import type { AppData } from '../types';
import {
  sumExpenses, sumIncome, txnsThisMonth, txnsThisWeek, txnsLastWeek, txnsLastMonth,
  categoryTotals, topCategory, averageDailySpend, highestSpendingDay, formatMoney,
  parseDate, lastNMonthsKeys, monthKey, dateToStr,
} from '../utils';
import { CATEGORY_COLORS } from '../icons';

type ReportPeriod = 'weekly' | 'monthly' | 'yearly';

export function Reports({ data }: { data: AppData }) {
  const cur = data.profile!.currency;
  const [period, setPeriod] = useState<ReportPeriod>('monthly');

  const report = useMemo(() => {
    const txns = data.transactions;
    let scoped = txns;
    let label = '';

    if (period === 'weekly') {
      scoped = txnsThisWeek(txns);
      label = 'This Week';
    } else if (period === 'monthly') {
      scoped = txnsThisMonth(txns);
      label = 'This Month';
    } else {
      const now = new Date();
      scoped = txns.filter((t) => t.date.startsWith(String(now.getFullYear())));
      label = String(now.getFullYear());
    }

    const expenses = sumExpenses(scoped);
    const income = sumIncome(scoped);
    const net = income - expenses;
    const catTotals = categoryTotals(scoped);
    const entries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const top = entries[0];
    const least = entries[entries.length - 1];
    const avgDaily = averageDailySpend(scoped);
    const highestDay = highestSpendingDay(scoped);

    // Savings trend (last 6 months)
    const monthKeys = lastNMonthsKeys(6);
    const savingsTrend = monthKeys.map((k) => {
      const mTxns = txns.filter((t) => monthKey(t.date) === k);
      return sumIncome(mTxns) - sumExpenses(mTxns);
    });

    return { expenses, income, net, top, least, avgDaily, highestDay, catTotals, savingsTrend, label, count: scoped.length };
  }, [data, period]);

  // Category bar chart
  const catLabels = Object.keys(report.catTotals);
  const catData = {
    labels: catLabels,
    datasets: [{ label: 'Spending', data: Object.values(report.catTotals), backgroundColor: catLabels.map((c) => CATEGORY_COLORS[c as keyof typeof CATEGORY_COLORS] || '#94a3b8'), borderRadius: 6 }],
  };
  const catOptions = { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#94a3b8', font: { size: 9 } }, grid: { display: false } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } } } };

  // Savings trend line
  const monthLabels = lastNMonthsKeys(6).map((k) => {
    const [y, m] = k.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short' });
  });
  const trendData = {
    labels: monthLabels,
    datasets: [{ label: 'Savings', data: report.savingsTrend, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.15)', fill: true, tension: 0.4, pointBackgroundColor: '#22c55e' }],
  };
  const trendOptions = { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#94a3b8' }, grid: { display: false } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } } } };

  const handlePrint = () => window.print();
  const handleExportPDF = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Reports</h1>
          <p className="text-sm text-slate-400">{report.label} · {report.count} transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Period toggle */}
      <div className="flex gap-2">
        {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${period === p ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ReportCard icon={TrendingDown} label="Total Expenses" value={formatMoney(report.expenses, cur)} color="error" />
        <ReportCard icon={TrendingUp} label="Total Income" value={formatMoney(report.income, cur)} color="success" />
        <ReportCard icon={Award} label="Net Savings" value={formatMoney(report.net, cur)} color={report.net >= 0 ? 'success' : 'error'} />
        <ReportCard icon={Calendar} label="Avg Daily Spend" value={formatMoney(report.avgDaily, cur)} color="primary" />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">Category Breakdown</h3>
          {catLabels.length > 0 ? (
            <div className="h-56"><Doughnut data={catData} options={{ cutout: '60%', plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } } }, responsive: true, maintainAspectRatio: false }} /></div>
          ) : <p className="text-sm text-slate-400 h-56 flex items-center justify-center">No data for this period.</p>}
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">Savings Trend</h3>
          <div className="h-56"><Line data={trendData} options={trendOptions} /></div>
        </div>
      </div>

      {/* Detailed stats */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-display font-semibold text-white mb-4">Detailed Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <StatRow label="Top Expense Category" value={report.top ? `${report.top[0]} (${formatMoney(report.top[1], cur)})` : '—'} />
          <StatRow label="Least Expense Category" value={report.least ? `${report.least[0]} (${formatMoney(report.least[1], cur)})` : '—'} />
          <StatRow label="Highest Spending Day" value={report.highestDay ? `${dateToStr(parseDate(report.highestDay.date))} (${formatMoney(report.highestDay.amount, cur)})` : '—'} />
          <StatRow label="Average Daily Spend" value={formatMoney(report.avgDaily, cur)} />
          <StatRow label="Total Transactions" value={String(report.count)} />
          <StatRow label="Net Savings" value={formatMoney(report.net, cur)} />
        </div>
      </div>

      {/* Category bar */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-display font-semibold text-white mb-4">Spending by Category</h3>
        {catLabels.length > 0 ? (
          <div className="h-64"><Bar data={catData} options={catOptions} /></div>
        ) : <p className="text-sm text-slate-400">No data for this period.</p>}
      </div>
    </div>
  );
}

function ReportCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    error: 'text-error-400 bg-error-500/10',
    success: 'text-success-400 bg-success-500/10',
    primary: 'text-primary-400 bg-primary-500/10',
  };
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-display font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2.5">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}
