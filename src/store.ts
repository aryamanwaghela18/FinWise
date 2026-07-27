import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppData, Transaction, SavingsGoal, Subscription, Profile, Settings } from './types';
import { loadData, saveData, resetData, exportJSON, importJSON } from './storage';
import { uid, todayStr } from './utils';
import { XP_REWARDS, checkAchievements } from './analysis';

export function useStore() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [undoBuffer, setUndoBuffer] = useState<{ txn: Transaction | null; timer: number | null }>({ txn: null, timer: null });
  const undoRef = useRef(undoBuffer);
  undoRef.current = undoBuffer;

  // Auto-save on every change
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Apply theme to document
  useEffect(() => {
    if (data.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings.theme]);

  const update = useCallback((updater: (d: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      const { data: withAch } = checkAchievements(next);
      return withAch;
    });
  }, []);

  const setProfile = useCallback((profile: Profile) => {
    update((d) => ({ ...d, profile }));
  }, [update]);

  const addTransaction = useCallback((txn: Omit<Transaction, 'id' | 'createdAt'>) => {
    update((d) => {
      const newTxn: Transaction = { ...txn, id: uid(), createdAt: Date.now() };
      const xp = d.xp + (txn.type === 'income' ? XP_REWARDS.addIncome : XP_REWARDS.addTransaction);
      return { ...d, transactions: [newTxn, ...d.transactions], xp };
    });
  }, [update]);

  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    update((d) => ({
      ...d,
      transactions: d.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, [update]);

  const deleteTransaction = useCallback((id: string) => {
    const txn = data.transactions.find((t) => t.id === id) || null;
    // set undo buffer
    update((d) => ({
      ...d,
      transactions: d.transactions.filter((t) => t.id !== id),
    }));
    if (txn) {
      const timer = window.setTimeout(() => {
        setUndoBuffer({ txn: null, timer: null });
      }, 5000);
      setUndoBuffer({ txn, timer });
    }
  }, [update, data.transactions]);

  const undoDelete = useCallback(() => {
    const buf = undoRef.current;
    if (buf.txn) {
      update((d) => ({ ...d, transactions: [buf.txn!, ...d.transactions] }));
      if (buf.timer) clearTimeout(buf.timer);
      setUndoBuffer({ txn: null, timer: null });
    }
  }, [update]);

  const addGoal = useCallback((goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    update((d) => ({
      ...d,
      goals: [...d.goals, { ...goal, id: uid(), createdAt: Date.now() }],
      xp: d.xp + 20,
    }));
  }, [update]);

  const updateGoal = useCallback((id: string, patch: Partial<SavingsGoal>) => {
    update((d) => ({
      ...d,
      goals: d.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  }, [update]);

  const contributeGoal = useCallback((id: string, amount: number) => {
    update((d) => {
      const goals = d.goals.map((g) => {
        if (g.id === id) {
          const newAmt = Math.min(g.targetAmount, g.currentAmount + amount);
          return { ...g, currentAmount: newAmt };
        }
        return g;
      });
      const goal = d.goals.find((g) => g.id === id);
      let xp = d.xp + 15;
      if (goal && goal.currentAmount + amount >= goal.targetAmount) xp += XP_REWARDS.completeGoal;
      return { ...d, goals, xp };
    });
  }, [update]);

  const deleteGoal = useCallback((id: string) => {
    update((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
  }, [update]);

  const addSubscription = useCallback((sub: Omit<Subscription, 'id' | 'createdAt'>) => {
    update((d) => ({
      ...d,
      subscriptions: [...d.subscriptions, { ...sub, id: uid(), createdAt: Date.now() }],
      xp: d.xp + 10,
    }));
  }, [update]);

  const deleteSubscription = useCallback((id: string) => {
    update((d) => ({ ...d, subscriptions: d.subscriptions.filter((s) => s.id !== id) }));
  }, [update]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, [update]);

  const markAdviceSeen = useCallback((ids: string[]) => {
    update((d) => ({ ...d, seenAdvice: [...new Set([...d.seenAdvice, ...ids])] }));
  }, [update]);

  const dismissReminder = useCallback(() => {
    update((d) => ({ ...d, lastReminderDate: todayStr() }));
  }, [update]);

  const doExport = useCallback(() => exportJSON(data), [data]);
  const doImport = useCallback(async (file: File) => {
    const imported = await importJSON(file);
    setData(imported);
  }, []);
  const doReset = useCallback(() => {
    resetData();
    window.location.reload();
  }, []);

  return {
    data,
    setProfile,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    undoDelete,
    undoBuffer,
    addGoal,
    updateGoal,
    contributeGoal,
    deleteGoal,
    addSubscription,
    deleteSubscription,
    updateSettings,
    markAdviceSeen,
    dismissReminder,
    doExport,
    doImport,
    doReset,
  };
}

export type Store = ReturnType<typeof useStore>;
