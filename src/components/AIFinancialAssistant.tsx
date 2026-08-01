import { useState, useMemo } from 'react';
import {
  Bot, Send, ShieldCheck, AlertTriangle, ShieldAlert, Activity,
  Wallet, PiggyBank, Gauge, Lightbulb,
} from 'lucide-react';
import type { AppData } from '../types';
import {
  sumExpenses, sumIncome, txnsThisMonth, formatMoney, daysLeftInMonth,
  daysInMonth, pct,
} from '../utils';
import { calcDailySafeSpend } from '../analysis';

type Status = 'safe' | 'caution' | 'risk';

interface PurchaseResult {
  kind: 'purchase';
  amount: number;
  status: Status;
  statusLabel: string;
  budgetImpact: string[];
  guidance: string;
}

interface StatusResult {
  kind: 'status';
  score: number;
  budgetAllocation: string;
  savingsRate: string;
  velocity: string;
  velocityTone: 'positive' | 'warning' | 'neutral';
  recommendations: string[];
}

type AIResult = PurchaseResult | StatusResult | { kind: 'empty'; message: string };

// Pull the first monetary value out of a free-text query.
function extractAmount(q: string): number | null {
  // Matches ₹1,250 / rs 300 / $50 / 1200
  const m = q.match(/(?:₹|rs\.?|inr|\$|€|£)?\s*([0-9][\d,]*(?:\.\d{1,2})?)/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const STATUS_KEYWORDS = [
  'checkup', 'check up', 'check-up', 'status', 'health', 'analysis', 'analyse',
  'analyze', 'how am i doing', 'overview', 'summary', 'report', 'evaluate my',
  'financial', 'where do i stand', 'am i on track',
];

function isStatusQuery(q: string): boolean {
  const s = q.toLowerCase();
  return STATUS_KEYWORDS.some((k) => s.includes(k));
}

export function AIFinancialAssistant({ data }: { data: AppData }) {
  const profile = data.profile!;
  const cur = profile.currency;
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AIResult | null>(null);

  const metrics = useMemo(() => {
    const txns = data.transactions;
    const monthTxns = txnsThisMonth(txns);
    const monthExpenses = sumExpenses(monthTxns);
    const totalBudget = profile.monthlyIncome + profile.monthlyPocketMoney;
    const budgetRemaining = totalBudget - monthExpenses;
    const currentSavings = sumIncome(txns) + totalBudget - sumExpenses(txns);
    const dailySafe = calcDailySafeSpend(data);
    const daysLeft = daysLeftInMonth(new Date());
    const dayOfMonth = new Date().getDate();
    const dim = daysInMonth(new Date());
    const avgDailySpend = dayOfMonth > 0 ? monthExpenses / dayOfMonth : 0;
    const recommendedDaily = dim > 0 ? totalBudget / dim : 0;
    return {
      monthExpenses, totalBudget, budgetRemaining, currentSavings,
      dailySafe, daysLeft, avgDailySpend, recommendedDaily, dayOfMonth,
    };
  }, [data, profile]);

  const analyzePurchase = (amount: number): PurchaseResult => {
    const { budgetRemaining, dailySafe, daysLeft, currentSavings } = metrics;
    const impactPct = budgetRemaining > 0 ? Math.round((amount / budgetRemaining) * 100) : 100;
    const remainingAfter = budgetRemaining - amount;
    const dailyAfter = daysLeft > 0 ? Math.max(0, Math.round(remainingAfter / daysLeft)) : Math.max(0, remainingAfter);
    const dailyDrop = dailySafe - dailyAfter;

    let status: Status;
    let statusLabel: string;
    if (amount > budgetRemaining || remainingAfter < 0 || dailyAfter <= 0) {
      status = 'risk';
      statusLabel = 'High Risk';
    } else if (impactPct >= 30 || dailyAfter < dailySafe * 0.5) {
      status = 'caution';
      statusLabel = 'Proceed with Caution';
    } else {
      status = 'safe';
      statusLabel = 'Safe Purchase';
    }

    const budgetImpact = [
      `This purchase uses ${impactPct}% of your ${formatMoney(budgetRemaining, cur)} remaining budget.`,
      `Your daily safe spend drops from ${formatMoney(dailySafe, cur)} to ${formatMoney(dailyAfter, cur)} (${dailyDrop > 0 ? '-' : '+'}${formatMoney(Math.abs(dailyDrop), cur)}/day) across the ${daysLeft} days left.`,
    ];

    let guidance: string;
    if (status === 'risk') {
      guidance = `This exceeds what's safely left this month. If it isn't essential, delay it until next month. If you must buy it, pull ${formatMoney(Math.min(amount, Math.max(0, currentSavings)), cur)} from savings and pause all non-essential spending until your budget resets.`;
    } else if (status === 'caution') {
      guidance = `You can afford it, but it's a meaningful hit. Spread the impact by capping the next few days at ${formatMoney(dailyAfter, cur)}/day, and skip one comparable discretionary expense (dining out, subscriptions) this week to protect your ${formatMoney(profile.monthlySavingsGoal, cur)} savings goal.`;
    } else {
      guidance = `This fits comfortably within your budget. You'll still have ${formatMoney(dailyAfter, cur)}/day of safe spending for the remaining ${daysLeft} days, keeping your savings goal on track.`;
    }

    return { kind: 'purchase', amount, status, statusLabel, budgetImpact, guidance };
  };

  const analyzeStatus = (): StatusResult => {
    const {
      monthExpenses, totalBudget, budgetRemaining, currentSavings,
      dailySafe, daysLeft, avgDailySpend, recommendedDaily, dayOfMonth,
    } = metrics;

    const usedPct = pct(monthExpenses, totalBudget);
    const idealUsedPct = pct(dayOfMonth, dayOfMonth + daysLeft);
    const budgetAllocation =
      `You've spent ${formatMoney(monthExpenses, cur)} (${usedPct}% of your ${formatMoney(totalBudget, cur)} budget) with ${formatMoney(Math.max(0, budgetRemaining), cur)} left for ${daysLeft} days. ` +
      (usedPct > idealUsedPct + 5
        ? `That's ahead of the ~${idealUsedPct}% pace expected by now — you're front-loading spending.`
        : usedPct < idealUsedPct - 5
          ? `That's below the ~${idealUsedPct}% pace expected by now — you have healthy headroom.`
          : `That's right on the ~${idealUsedPct}% pace expected for this point in the month.`);

    const goal = profile.monthlySavingsGoal;
    const goalProgress = goal > 0 ? pct(Math.min(currentSavings, goal), goal) : 0;
    const savingsRate =
      goal > 0
        ? `You're at ${formatMoney(Math.max(0, currentSavings), cur)} of your ${formatMoney(goal, cur)} monthly savings goal (${goalProgress}%). ` +
          (goalProgress >= 100
            ? `Goal already met — consider raising the target or routing the surplus to a savings goal.`
            : budgetRemaining >= goal - currentSavings
              ? `Staying on budget keeps this goal within reach before month end.`
              : `At the current pace you'll fall short by ${formatMoney(Math.max(0, goal - currentSavings - Math.max(0, budgetRemaining)), cur)}; trim discretionary spending to close the gap.`)
        : `No monthly savings goal is set yet. Setting one gives every rupee a target and improves your health score.`;

    let velocityTone: StatusResult['velocityTone'] = 'neutral';
    let velocity: string;
    if (avgDailySpend > recommendedDaily * 1.1) {
      velocityTone = 'warning';
      velocity = `You're spending ~${formatMoney(Math.round(avgDailySpend), cur)}/day vs a recommended ${formatMoney(Math.round(recommendedDaily), cur)}/day — about ${pct(avgDailySpend - recommendedDaily, recommendedDaily)}% faster than sustainable. Ease off to avoid running dry before month end.`;
    } else if (avgDailySpend < recommendedDaily * 0.9) {
      velocityTone = 'positive';
      velocity = `You're spending ~${formatMoney(Math.round(avgDailySpend), cur)}/day vs a recommended ${formatMoney(Math.round(recommendedDaily), cur)}/day — comfortably under pace. Keep it up and the surplus flows straight into savings.`;
    } else {
      velocity = `You're spending ~${formatMoney(Math.round(avgDailySpend), cur)}/day, right around the recommended ${formatMoney(Math.round(recommendedDaily), cur)}/day. Steady and sustainable.`;
    }

    const recommendations: string[] = [];
    if (dailySafe < 150) {
      recommendations.push(`Daily safe spend is only ${formatMoney(dailySafe, cur)} — switch to cash-only and cook at home for the next few days to recover.`);
    }
    if (avgDailySpend > recommendedDaily * 1.1) {
      recommendations.push(`Cap daily spending at ${formatMoney(Math.round(recommendedDaily), cur)} to bring your velocity back in line.`);
    }
    if (goal > 0 && goalProgress < 100 && budgetRemaining > 0) {
      const setAside = Math.round(Math.min(budgetRemaining, Math.max(0, goal - currentSavings)) / Math.max(1, daysLeft));
      if (setAside > 0) recommendations.push(`Set aside ~${formatMoney(setAside, cur)}/day from your spendable pool to hit your savings goal on time.`);
    }
    if (budgetRemaining > 0 && daysLeft > 0) {
      recommendations.push(`You have ${formatMoney(dailySafe, cur)}/day of safe spending — plan larger purchases early so you keep a buffer for the last week.`);
    }
    if (recommendations.length === 0) {
      recommendations.push(`You're in good shape. Maintain your logging streak and keep discretionary spending steady to protect your savings goal.`);
    }

    return {
      kind: 'status',
      score: goalProgress,
      budgetAllocation,
      savingsRate,
      velocity,
      velocityTone,
      recommendations: recommendations.slice(0, 4),
    };
  };

  const handleAsk = () => {
    const q = query.trim();
    if (!q) return;
    const amount = extractAmount(q);
    // A concrete amount that isn't an explicit status request → Purchase Advisor.
    if (amount !== null && !isStatusQuery(q)) {
      setResult(analyzePurchase(amount));
    } else if (isStatusQuery(q) || amount === null) {
      setResult(analyzeStatus());
    } else {
      setResult(analyzePurchase(amount));
    }
  };

  return (
    <div className="glass rounded-2xl p-5 border border-accent-500/20 bg-gradient-to-br from-accent-500/10 to-primary-500/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-white">Talk to AI Financial Assistant</h3>
          <p className="text-xs text-slate-400">Get a financial checkup or evaluate a purchase using your live data</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault();
              handleAsk();
            }
          }}
          placeholder="Ask for a financial checkup or evaluate a purchase..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
        />
        <button
          onClick={handleAsk}
          disabled={!query.trim()}
          className="flex items-center justify-center gap-1.5 shrink-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-semibold rounded-xl px-5 py-2.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <Send className="w-4 h-4" />
          Ask AI
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {['Should I buy new headphones for ₹2,000?', 'Give me a financial checkup', 'Can I afford a ₹800 dinner?'].map((s) => (
          <button
            key={s}
            onClick={() => setQuery(s)}
            className="text-xs text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {result && result.kind !== 'empty' && (
        <div className="mt-4">
          {result.kind === 'purchase' ? (
            <PurchaseResponse result={result} />
          ) : (
            <StatusResponse result={result} />
          )}
        </div>
      )}
    </div>
  );
}

function PurchaseResponse({ result }: { result: PurchaseResult }) {
  const styles: Record<Status, { icon: React.ComponentType<{ className?: string }>; text: string; chip: string; ring: string }> = {
    safe: { icon: ShieldCheck, text: 'text-success-300', chip: 'bg-success-500/15 text-success-300 border-success-500/30', ring: 'border-success-500/20' },
    caution: { icon: AlertTriangle, text: 'text-warning-300', chip: 'bg-warning-500/15 text-warning-300 border-warning-500/30', ring: 'border-warning-500/20' },
    risk: { icon: ShieldAlert, text: 'text-error-300', chip: 'bg-error-500/15 text-error-300 border-error-500/30', ring: 'border-error-500/20' },
  };
  const s = styles[result.status];
  const Icon = s.icon;

  return (
    <div className={`rounded-xl border ${s.ring} bg-white/5 p-4 space-y-4`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${s.text}`} />
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.chip}`}>{result.statusLabel}</span>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Wallet className="w-4 h-4 text-primary-400" />
          <h4 className="text-sm font-medium text-white">Budget Impact</h4>
        </div>
        <ul className="space-y-1">
          {result.budgetImpact.map((line, i) => (
            <li key={i} className="text-xs text-slate-300 leading-relaxed">• {line}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Lightbulb className="w-4 h-4 text-accent-400" />
          <h4 className="text-sm font-medium text-white">Smart Guidance</h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{result.guidance}</p>
      </div>
    </div>
  );
}

function StatusResponse({ result }: { result: StatusResult }) {
  const veloTone =
    result.velocityTone === 'warning' ? 'text-warning-300'
      : result.velocityTone === 'positive' ? 'text-success-300'
        : 'text-slate-300';

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-accent-400" />
        <h4 className="text-sm font-semibold text-white">Detailed Financial Status</h4>
      </div>

      <Section icon={Wallet} iconColor="text-primary-400" title="Budget Allocation" body={result.budgetAllocation} />
      <Section icon={PiggyBank} iconColor="text-success-400" title="Savings Goal Rate" body={result.savingsRate} />
      <Section icon={Gauge} iconColor="text-warning-400" title="Daily Spending Velocity" body={result.velocity} bodyClass={veloTone} />

      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Lightbulb className="w-4 h-4 text-accent-400" />
          <h4 className="text-sm font-medium text-white">Actionable Recommendations</h4>
        </div>
        <ul className="space-y-1">
          {result.recommendations.map((r, i) => (
            <li key={i} className="text-xs text-slate-300 leading-relaxed">• {r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Section({
  icon: Icon, iconColor, title, body, bodyClass = 'text-slate-300',
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  body: string;
  bodyClass?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h4 className="text-sm font-medium text-white">{title}</h4>
      </div>
      <p className={`text-xs leading-relaxed ${bodyClass}`}>{body}</p>
    </div>
  );
}
