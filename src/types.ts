export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'Cash' | 'UPI' | 'Debit Card' | 'Credit Card';

export type Category =
  | 'Food'
  | 'Travel'
  | 'Rent'
  | 'College Fees'
  | 'Books'
  | 'Shopping'
  | 'Entertainment'
  | 'Healthcare'
  | 'Subscriptions'
  | 'Recharge'
  | 'Fuel'
  | 'Coffee'
  | 'Grocery'
  | 'Friends'
  | 'Other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  paymentMethod: PaymentMethod;
  description: string;
  favourite: boolean;
  receiptNumber?: string;
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  createdAt: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  recurring: 'monthly' | 'yearly';
  category: Category;
  createdAt: number;
}

export interface Profile {
  name: string;
  college: string;
  monthlyPocketMoney: number;
  monthlyIncome: number;
  monthlySavingsGoal: number;
  currency: string;
  financialGoal: string;
  createdAt: number;
}

export interface Settings {
  theme: 'dark' | 'light';
  notifications: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface AppData {
  profile: Profile | null;
  transactions: Transaction[];
  goals: SavingsGoal[];
  subscriptions: Subscription[];
  settings: Settings;
  achievements: Achievement[];
  xp: number;
  seenAdvice: string[];
  lastReminderDate: string | null;
}

export const CATEGORIES: Category[] = [
  'Food', 'Travel', 'Rent', 'College Fees', 'Books', 'Shopping',
  'Entertainment', 'Healthcare', 'Subscriptions', 'Recharge',
  'Fuel', 'Coffee', 'Grocery', 'Friends', 'Other',
];

export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Debit Card', 'Credit Card'];

export const CURRENCIES = ['₹', '$', '€', '£', '¥', '₩', '₽', 'R$', 'A$'];

export const FINANCIAL_GOALS = [
  'Save for Laptop', 'Trip', 'Emergency Fund', 'Course', 'Phone', 'Bike', 'Other',
];
