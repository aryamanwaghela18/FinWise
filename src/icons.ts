import {
  Utensils, Car, Home, GraduationCap, BookOpen, ShoppingBag, Clapperboard,
  Heart, RefreshCw, Smartphone, Fuel, Coffee, ShoppingCart, Users, Package,
  type LucideIcon,
} from 'lucide-react';
import type { Category } from './types';

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Food: Utensils,
  Travel: Car,
  Rent: Home,
  'College Fees': GraduationCap,
  Books: BookOpen,
  Shopping: ShoppingBag,
  Entertainment: Clapperboard,
  Healthcare: Heart,
  Subscriptions: RefreshCw,
  Recharge: Smartphone,
  Fuel: Fuel,
  Coffee: Coffee,
  Grocery: ShoppingCart,
  Friends: Users,
  Other: Package,
};

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#f59e0b',
  Travel: '#3b82f6',
  Rent: '#8b5cf6',
  'College Fees': '#06b6d4',
  Books: '#10b981',
  Shopping: '#ec4899',
  Entertainment: '#f43f5e',
  Healthcare: '#ef4444',
  Subscriptions: '#6366f1',
  Recharge: '#14b8a6',
  Fuel: '#84cc16',
  Coffee: '#a16207',
  Grocery: '#22c55e',
  Friends: '#eab308',
  Other: '#94a3b8',
};
