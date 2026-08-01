import type { AppData, Transaction, Category } from './types';
import {
  sumExpenses, sumIncome, txnsThisMonth, txnsThisWeek, txnsLastWeek, txnsToday,
  categoryTotals, categoryShare, countByCategory, weekendVsWeekday, averageDailySpend,
  highestSpendingDay, topCategory, daysLeftInMonth, pct, getStreak, parseDate,
} from './utils';

export interface Insight {
  id: string;
  icon: string;
  title: string;
  body: string;
  tone: 'positive' | 'warning' | 'neutral';
}

export function generateInsights(data: AppData): Insight[] {
  const out: Insight[] = [];
  const txns = data.transactions;
  if (!data.profile || txns.length === 0) return out;

  const monthTxns = txnsThisMonth(txns);
  const weekTxns = txnsThisWeek(txns);
  const lastWeekTxns = txnsLastWeek(txns);
  const monthExpenses = sumExpenses(monthTxns);
  const monthIncome = sumIncome(monthTxns) + data.profile.monthlyIncome + data.profile.monthlyPocketMoney;
  const totalCat = categoryTotals(monthTxns);
  const top = topCategory(monthTxns);

  // 1. Top category share
  if (top && monthExpenses > 0) {
    const share = categoryShare(monthTxns, top);
    if (share >= 35) {
      const catTotal = totalCat[top] || 0;
      const reduceAmt = Math.round(catTotal * 0.2);
      out.push({
        id: 'top_cat_share',
        icon: 'PieChart',
        title: `${top} dominates your spending`,
        body: `You spent ${share}% of your money on ${top}. That's higher than students with similar budgets. Reducing ${top} expenses by ${data.profile.currency}${reduceAmt} could help you reach your savings goal.`,
        tone: 'warning',
      });
    }
  }

  // 2. Week-over-week comparison
  const weekExp = sumExpenses(weekTxns);
  const lastWeekExp = sumExpenses(lastWeekTxns);
  if (lastWeekExp > 0 && weekExp > 0) {
    const change = Math.round(((weekExp - lastWeekExp) / lastWeekExp) * 100);
    if (change > 20) {
      out.push({
        id: 'week_over_week',
        icon: 'TrendingUp',
        title: `Spending up ${change}% this week`,
        body: `You spent ${data.profile.currency}${weekExp} this week vs ${data.profile.currency}${lastWeekExp} last week. Consider reviewing where the extra spending went.`,
        tone: 'warning',
      });
    } else if (change < -15) {
      out.push({
        id: 'week_over_week_down',
        icon: 'TrendingDown',
        title: `Great — spending down ${Math.abs(change)}%`,
        body: `You spent ${data.profile.currency}${weekExp} this week vs ${data.profile.currency}${lastWeekTxns.length} last week. Keep this up and you'll exceed your savings goal.`,
        tone: 'positive',
      });
    }
  }

  // 3. Savings rate
  const savings = monthIncome - monthExpenses;
  const savingsRate = monthIncome > 0 ? Math.round((savings / monthIncome) * 100) : 0;
  if (savingsRate < 0) {
    out.push({
      id: 'neg_savings',
      icon: 'AlertTriangle',
      title: 'You are spending more than you earn',
      body: `This month your expenses exceed your income by ${data.profile.currency}${Math.abs(savings)}. Cutting back is essential to avoid debt.`,
      tone: 'warning',
    });
  } else if (savingsRate >= 20) {
    out.push({
      id: 'good_savings',
      icon: 'PiggyBank',
      title: `You're saving ${savingsRate}% of income`,
      body: `That's a healthy savings rate. At this pace you'll save ${data.profile.currency}${savings * (daysLeftInMonth(new Date()) / 30 || 1)} more by month end.`,
      tone: 'positive',
    });
  }

  // 4. Coffee frequency
  const coffeeCount = countByCategory(monthTxns, 'Coffee');
  if (coffeeCount >= 10) {
    const coffeeTotal = (totalCat['Coffee'] || 0);
    out.push({
      id: 'coffee_freq',
      icon: 'Coffee',
      title: `${coffeeCount} coffee purchases this month`,
      body: `You've bought coffee ${coffeeCount} times this month, totalling ${data.profile.currency}${coffeeTotal}. Brewing at home could save you ${data.profile.currency}${Math.round(coffeeTotal * 0.6)} monthly.`,
      tone: 'warning',
    });
  }

  // 5. Weekend vs weekday
  const wv = weekendVsWeekday(monthTxns);
  if (wv.weekendAvg > wv.weekdayAvg * 1.8 && wv.weekendAvg > 0) {
    out.push({
      id: 'weekend_overspend',
      icon: 'CalendarDays',
      title: 'Weekend spending is high',
      body: `Your average weekend day spend (${data.profile.currency}${Math.round(wv.weekendAvg)}) is ${Math.round((wv.weekendAvg / Math.max(1, wv.weekdayAvg)) * 100 - 100)}% higher than weekdays. Plan weekend budgets in advance.`,
      tone: 'warning',
    });
  }

  // 6. Entertainment share
  const entShare = categoryShare(monthTxns, 'Entertainment');
  if (entShare >= 15) {
    out.push({
      id: 'ent_share',
      icon: 'Clapperboard',
      title: `Entertainment is ${entShare}% of spending`,
      body: `That's a significant chunk. Consider free campus events or shared subscriptions to reduce it.`,
      tone: 'warning',
    });
  }

  // 7. Shopping trend
  const shopThisWeek = weekTxns.filter((t) => t.category === 'Shopping' && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const shopLastWeek = lastWeekTxns.filter((t) => t.category === 'Shopping' && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  if (shopLastWeek > 0 && shopThisWeek > shopLastWeek * 1.5) {
    out.push({
      id: 'shopping_rise',
      icon: 'ShoppingBag',
      title: 'Shopping expenses are rising',
      body: `Your shopping spend went from ${data.profile.currency}${shopLastWeek} last week to ${data.profile.currency}${shopThisWeek} this week. Pause non-essential purchases for a few days.`,
      tone: 'warning',
    });
  }

  // 8. Streak praise
  const streak = getStreak(txns);
  if (streak >= 7) {
    out.push({
      id: 'streak_praise',
      icon: 'Flame',
      title: `${streak}-day tracking streak`,
      body: `You've logged expenses for ${streak} days straight. Consistency is the #1 predictor of financial success.`,
      tone: 'positive',
    });
  }

  // 9. Impulse buying — many small transactions in a day
  const todayTxns = txnsToday(txns).filter((t) => t.type === 'expense');
  if (todayTxns.length >= 4) {
    out.push({
      id: 'impulse_today',
      icon: 'Zap',
      title: `${todayTxns.length} expenses today`,
      body: `Multiple transactions in a single day often signal impulse buying. Take a moment before your next purchase.`,
      tone: 'neutral',
    });
  }

  // 10. Food increase week-over-week
  const foodThisWeek = weekTxns.filter((t) => t.category === 'Food' && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const foodLastWeek = lastWeekTxns.filter((t) => t.category === 'Food' && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  if (foodLastWeek > 0 && foodThisWeek > foodLastWeek * 1.3) {
    const inc = Math.round(((foodThisWeek - foodLastWeek) / foodLastWeek) * 100);
    out.push({
      id: 'food_increase',
      icon: 'Utensils',
      title: `Food spending increased ${inc}%`,
      body: `You spent ${data.profile.currency}${foodThisWeek} on food this week vs ${data.profile.currency}${foodLastWeek} last week. Meal planning can bring this down.`,
      tone: 'warning',
    });
  }

  // Dedupe against seenAdvice — rotate insights
  const seen = new Set(data.seenAdvice);
  const fresh = out.filter((i) => !seen.has(i.id));
  if (fresh.length >= 3) return fresh.slice(0, 4);
  return out.slice(0, 4);
}

export interface Warning {
  id: string;
  text: string;
  suggestion: string;
}

export function generateWarnings(data: AppData): Warning[] {
  const out: Warning[] = [];
  const txns = data.transactions;
  if (!data.profile || txns.length === 0) return out;

  const monthTxns = txnsThisMonth(txns);
  const monthExpenses = sumExpenses(monthTxns);
  const totalBudget = data.profile.monthlyIncome + data.profile.monthlyPocketMoney;

  // Budget warnings per category
  const catTotals = categoryTotals(monthTxns);
  const entertainmentBudget = totalBudget * 0.1;
  if ((catTotals['Entertainment'] || 0) >= entertainmentBudget * 0.92 && entertainmentBudget > 0) {
    const usedPct = pct(catTotals['Entertainment'] || 0, entertainmentBudget);
    out.push({
      id: 'ent_budget',
      text: `You already spent ${usedPct}% of your entertainment budget.`,
      suggestion: 'Skip paid outings for the rest of the month.',
    });
  }

  // Food increase
  const foodThisWeek = txnsThisWeek(txns).filter((t) => t.category === 'Food' && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const foodLastWeek = txnsLastWeek(txns).filter((t) => t.category === 'Food' && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  if (foodLastWeek > 0 && foodThisWeek > foodLastWeek * 1.3) {
    out.push({
      id: 'food_up',
      text: `Food spending increased by ${Math.round(((foodThisWeek - foodLastWeek) / foodLastWeek) * 100)}% this week.`,
      suggestion: 'Try meal-prepping to cut food costs.',
    });
  }

  // Coffee count
  const coffeeCount = countByCategory(monthTxns, 'Coffee');
  if (coffeeCount >= 15) {
    out.push({
      id: 'coffee_lot',
      text: `You purchased coffee ${coffeeCount} times this month.`,
      suggestion: 'Switch to home-brewed coffee on weekdays.',
    });
  }

  // Shopping rising
  const shopThisWeek = txnsThisWeek(txns).filter((t) => t.category === 'Shopping' && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const shopLastWeek = txnsLastWeek(txns).filter((t) => t.category === 'Shopping' && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  if (shopLastWeek > 0 && shopThisWeek > shopLastWeek * 1.5) {
    out.push({
      id: 'shop_rise',
      text: 'Shopping expenses are rising quickly.',
      suggestion: 'Add a 48-hour rule before any non-essential purchase.',
    });
  }

  // Weekend overspend
  const wv = weekendVsWeekday(monthTxns);
  if (wv.weekendAvg > wv.weekdayAvg * 1.8 && wv.weekendAvg > 0) {
    out.push({
      id: 'weekend_high',
      text: 'Weekend spending is much higher than weekdays.',
      suggestion: 'Set a fixed weekend allowance in cash.',
    });
  }

  return out.slice(0, 5);
}

export interface HealthScore {
  score: number;
  label: 'Excellent' | 'Good' | 'Average' | 'Poor';
  breakdown: { factor: string; score: number; max: number; detail: string }[];
}

export function calcHealthScore(data: AppData): HealthScore {
  if (!data.profile || data.transactions.length === 0) {
    return {
      score: 0,
      label: 'Poor',
      breakdown: [
        { factor: 'Savings Rate', score: 0, max: 25, detail: 'No data yet' },
        { factor: 'Budget Control', score: 0, max: 25, detail: 'No data yet' },
        { factor: 'Expense Diversity', score: 0, max: 15, detail: 'No data yet' },
        { factor: 'Goal Progress', score: 0, max: 15, detail: 'No data yet' },
        { factor: 'Overspending Frequency', score: 0, max: 10, detail: 'No data yet' },
        { factor: 'Consistency', score: 0, max: 10, detail: 'No data yet' },
      ],
    };
  }

  const txns = data.transactions;
  const monthTxns = txnsThisMonth(txns);
  const monthExpenses = sumExpenses(monthTxns);
  const totalBudget = data.profile.monthlyIncome + data.profile.monthlyPocketMoney;
  const monthIncome = sumIncome(monthTxns) + totalBudget;
  const savings = monthIncome - monthExpenses;
  const savingsRate = monthIncome > 0 ? savings / monthIncome : 0;

  // 1. Savings Rate (25)
  let s1 = 0;
  if (savingsRate >= 0.3) s1 = 25;
  else if (savingsRate >= 0.2) s1 = 20;
  else if (savingsRate >= 0.1) s1 = 15;
  else if (savingsRate >= 0.05) s1 = 10;
  else if (savingsRate >= 0) s1 = 5;
  else s1 = 0;

  // 2. Budget Control (25) — how close expenses are to budget
  let s2 = 0;
  if (totalBudget > 0) {
    const ratio = monthExpenses / totalBudget;
    if (ratio <= 0.7) s2 = 25;
    else if (ratio <= 0.9) s2 = 20;
    else if (ratio <= 1) s2 = 15;
    else if (ratio <= 1.2) s2 = 8;
    else s2 = 3;
  }

  // 3. Expense Diversity (15) — number of categories used
  const cats = new Set(monthTxns.filter((t) => t.type === 'expense').map((t) => t.category));
  let s3 = 0;
  if (cats.size >= 8) s3 = 15;
  else if (cats.size >= 6) s3 = 12;
  else if (cats.size >= 4) s3 = 9;
  else if (cats.size >= 2) s3 = 6;
  else s3 = 3;

  // 4. Goal Progress (15)
  let s4 = 0;
  if (data.goals.length > 0) {
    const avgProgress = data.goals.reduce((s, g) => s + Math.min(1, g.currentAmount / g.targetAmount), 0) / data.goals.length;
    s4 = Math.round(avgProgress * 15);
  }

  // 5. Overspending Frequency (10) — days this month where spend > daily limit
  const dailyLimit = totalBudget / 30;
  const byDay: Record<string, number> = {};
  for (const t of monthTxns) {
    if (t.type === 'expense') byDay[t.date] = (byDay[t.date] || 0) + t.amount;
  }
  const overDays = Object.values(byDay).filter((v) => v > dailyLimit * 1.5).length;
  let s5 = 10;
  if (overDays >= 10) s5 = 0;
  else if (overDays >= 7) s5 = 3;
  else if (overDays >= 4) s5 = 5;
  else if (overDays >= 1) s5 = 7;

  // 6. Consistency (10) — streak
  const streak = getStreak(txns);
  let s6 = 0;
  if (streak >= 30) s6 = 10;
  else if (streak >= 14) s6 = 8;
  else if (streak >= 7) s6 = 6;
  else if (streak >= 3) s6 = 4;
  else if (streak >= 1) s6 = 2;

  const score = s1 + s2 + s3 + s4 + s5 + s6;
  let label: HealthScore['label'] = 'Poor';
  if (score >= 80) label = 'Excellent';
  else if (score >= 60) label = 'Good';
  else if (score >= 40) label = 'Average';

  return {
    score,
    label,
    breakdown: [
      { factor: 'Savings Rate', score: s1, max: 25, detail: `${Math.round(savingsRate * 100)}% saved` },
      { factor: 'Budget Control', score: s2, max: 25, detail: `${Math.round((monthExpenses / Math.max(1, totalBudget)) * 100)}% of budget used` },
      { factor: 'Expense Diversity', score: s3, max: 15, detail: `${cats.size} categories` },
      { factor: 'Goal Progress', score: s4, max: 15, detail: data.goals.length ? `${data.goals.length} goals tracked` : 'No goals' },
      { factor: 'Overspending', score: s5, max: 10, detail: `${overDays} high-spend days` },
      { factor: 'Consistency', score: s6, max: 10, detail: `${streak}-day streak` },
    ],
  };
}

export interface Predictions {
  monthEndBalance: number;
  expectedSavings: number;
  expectedExpenses: number;
  budgetRemaining: number;
}

export function calcPredictions(data: AppData): Predictions {
  if (!data.profile) return { monthEndBalance: 0, expectedSavings: 0, expectedExpenses: 0, budgetRemaining: 0 };
  const txns = data.transactions;
  const monthTxns = txnsThisMonth(txns);
  const monthExpenses = sumExpenses(monthTxns);
  const totalBudget = data.profile.monthlyIncome + data.profile.monthlyPocketMoney;
  const now = new Date();
  const elapsed = now.getDate();
  const dim = 30; // normalize
  const dailyAvg = elapsed > 0 ? monthExpenses / elapsed : 0;
  const expectedExpenses = Math.round(dailyAvg * dim);
  const expectedSavings = totalBudget - expectedExpenses;
  const budgetRemaining = totalBudget - monthExpenses;
  const monthEndBalance = budgetRemaining;
  return { monthEndBalance, expectedSavings, expectedExpenses, budgetRemaining };
}

export function calcDailySafeSpend(data: AppData): number {
  if (!data.profile) return 0;
  const monthTxns = txnsThisMonth(data.transactions);
  const monthExpenses = sumExpenses(monthTxns);
  const totalBudget = data.profile.monthlyIncome + data.profile.monthlyPocketMoney;
  const remaining = totalBudget - monthExpenses;
  // Reserve the monthly savings goal before dividing what is safe to spend.
  const savingsGoal = data.profile.monthlySavingsGoal || 0;
  const netSpendable = remaining - savingsGoal;
  const daysLeft = daysLeftInMonth(new Date());
  if (daysLeft <= 0) return Math.max(0, Math.round(netSpendable));
  return Math.max(0, Math.round(netSpendable / daysLeft));
}

export function calcLevel(xp: number): { level: number; title: string; progress: number; nextLevelXp: number; currentLevelXp: number } {
  const levels = [
    { level: 1, title: 'Beginner', min: 0 },
    { level: 2, title: 'Planner', min: 100 },
    { level: 3, title: 'Saver', min: 300 },
    { level: 4, title: 'Investor', min: 700 },
    { level: 5, title: 'Finance Master', min: 1500 },
  ];
  let current = levels[0];
  for (const l of levels) {
    if (xp >= l.min) current = l;
  }
  const next = levels.find((l) => l.min > xp);
  const currentLevelXp = current.min;
  const nextLevelXp = next ? next.min : current.min;
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1;
  return { level: current.level, title: current.title, progress, nextLevelXp, currentLevelXp };
}

export const XP_REWARDS = {
  addTransaction: 10,
  addIncome: 15,
  reachGoal: 200,
  streakDay: 5,
  underBudgetMonth: 100,
  completeGoal: 150,
};

export function checkAchievements(data: AppData): { data: AppData; newlyUnlocked: string[] } {
  const newlyUnlocked: string[] = [];
  const achievements = [...data.achievements];
  const txns = data.transactions;
  const totalSaved = data.goals.reduce((s, g) => s + g.currentAmount, 0);

  const unlock = (id: string, cond: boolean) => {
    const a = achievements.find((x) => x.id === id);
    if (a && !a.unlocked && cond) {
      a.unlocked = true;
      a.unlockedAt = Date.now();
      newlyUnlocked.push(a.name);
    }
  };

  unlock('first_txn', txns.length >= 1);
  unlock('saved_1000', totalSaved >= 1000);
  unlock('saved_5000', totalSaved >= 5000);
  unlock('streak_7', getStreak(txns) >= 7);
  unlock('streak_30', getStreak(txns) >= 30);
  unlock('txn_100', txns.length >= 100);
  unlock('goal_reached', data.goals.some((g) => g.currentAmount >= g.targetAmount));
  const health = calcHealthScore(data);
  unlock('budget_master', health.score >= 80);
  // under_budget: expenses this month <= budget
  if (data.profile) {
    const monthExp = sumExpenses(txnsThisMonth(txns));
    const budget = data.profile.monthlyIncome + data.profile.monthlyPocketMoney;
    unlock('under_budget', monthExp <= budget && txns.length >= 10);
  }

  return { data: { ...data, achievements }, newlyUnlocked };
}
