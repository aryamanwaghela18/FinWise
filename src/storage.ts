import type { AppData, Achievement } from './types';

const STORAGE_KEY = 'finwise_ai_data_v1';

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_txn', name: 'First Step', description: 'Log your first transaction', unlocked: false },
  { id: 'saved_1000', name: 'Saver I', description: 'Save ₹1,000 total', unlocked: false },
  { id: 'saved_5000', name: 'Saver II', description: 'Save ₹5,000 total', unlocked: false },
  { id: 'streak_7', name: 'Consistent', description: '7-day tracking streak', unlocked: false },
  { id: 'streak_30', name: 'Dedicated', description: '30-day tracking streak', unlocked: false },
  { id: 'under_budget', name: 'Disciplined', description: 'Stay under budget for a month', unlocked: false },
  { id: 'goal_reached', name: 'Goal Getter', description: 'Complete a savings goal', unlocked: false },
  { id: 'txn_100', name: 'Centurion', description: 'Log 100 transactions', unlocked: false },
  { id: 'budget_master', name: 'Budget Master', description: 'Reach a Financial Health Score of 80+', unlocked: false },
];

export const DEFAULT_DATA: AppData = {
  profile: null,
  transactions: [],
  goals: [],
  subscriptions: [],
  settings: { theme: 'dark', notifications: true },
  achievements: DEFAULT_ACHIEVEMENTS,
  xp: 0,
  seenAdvice: [],
  lastReminderDate: null,
  lastRolloverMonth: null,
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      ...structuredClone(DEFAULT_DATA),
      ...parsed,
      achievements: mergeAchievements(parsed.achievements),
      settings: { ...DEFAULT_DATA.settings, ...parsed.settings },
    };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function mergeAchievements(saved?: Achievement[]): Achievement[] {
  if (!saved) return DEFAULT_ACHIEVEMENTS;
  return DEFAULT_ACHIEVEMENTS.map((def) => {
    const found = saved.find((s) => s.id === def.id);
    return found ? { ...def, ...found } : def;
  });
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data', e);
  }
}

export function resetData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportJSON(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finwise-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppData;
        resolve({ ...DEFAULT_DATA, ...parsed });
      } catch {
        reject(new Error('Invalid file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
