import { useState } from 'react';
import { Wallet, LayoutDashboard, Receipt, Target, RefreshCw, Trophy, FileText, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { useStore } from './store';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Goals } from './components/Goals';
import { Subscriptions } from './components/Subscriptions';
import { Achievements } from './components/Achievements';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { QuickActions } from './components/QuickActions';
import { Reminders } from './components/Reminders';
import { AddTransactionModal } from './components/AddTransactionModal';
import { Toast } from './components/Modal';
import type { Transaction } from './types';

type Tab = 'dashboard' | 'transactions' | 'goals' | 'subscriptions' | 'achievements' | 'reports' | 'settings';

const NAV: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { key: 'transactions', label: 'Transactions', icon: Receipt },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { key: 'achievements', label: 'Achievements', icon: Trophy },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

function App() {
  const store = useStore();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  if (!store.data.profile) {
    return <Onboarding onComplete={store.setProfile} />;
  }

  const handleAddTransaction = (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editing) {
      store.updateTransaction(editing.id, t);
      setEditing(null);
      setToast({ msg: 'Transaction updated' });
    } else {
      store.addTransaction(t);
      setToast({ msg: 'Transaction added' });
    }
  };

  const handleDelete = (id: string) => {
    store.deleteTransaction(id);
    setToast({ msg: 'Transaction deleted', undo: store.undoDelete });
  };

  const handleEdit = (t: Transaction) => {
    setEditing(t);
    setShowAdd(true);
  };

  const handleTransferToSavings = (amount: number) => {
    // Add as income transaction tagged to savings, and contribute to first goal if exists
    store.addTransaction({
      type: 'income',
      amount,
      category: 'Other',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      paymentMethod: 'UPI',
      description: 'Transfer to Savings',
      favourite: false,
    });
    if (store.data.goals.length > 0) {
      store.contributeGoal(store.data.goals[0].id, amount);
    }
    setToast({ msg: `Transferred ${store.data.profile!.currency}${amount} to savings` });
  };

  const handleNote = (text: string) => {
    store.addTransaction({
      type: 'expense',
      amount: 0,
      category: 'Other',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      paymentMethod: 'Cash',
      description: text,
      favourite: false,
    });
    setToast({ msg: 'Note saved' });
  };

  const isLight = store.data.settings.theme === 'light';

  return (
    <div className={`min-h-screen ${isLight ? 'app-bg-light' : 'app-bg'} transition-colors`}>
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col p-4 border-r border-white/5 z-30">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white">FinWise AI</h1>
            <p className="text-[10px] text-slate-400">Finance Coach</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <button key={n.key} onClick={() => setTab(n.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === n.key ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-white ring-1 ring-primary-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <n.icon className="w-4 h-4" />
              {n.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white">FinWise AI</span>
        </div>
        <button onClick={() => setNavOpen(true)} className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-300">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile nav drawer */}
      {navOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 p-5 glass animate-slide-up overflow-y-auto" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold text-white">Menu</span>
              <button onClick={() => setNavOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <button key={n.key} onClick={() => { setTab(n.key); setNavOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${tab === n.key ? 'bg-primary-500/20 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                  <n.icon className="w-4 h-4" />
                  {n.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ml-64 p-4 sm:p-6 max-w-6xl mx-auto pb-24 lg:pb-6">
        {tab === 'dashboard' && (
          <>
            <Reminders data={store.data} onDismiss={store.dismissReminder} />
            <div className="mt-3">
              <Dashboard data={store.data} onQuickAdd={() => { setEditing(null); setShowAdd(true); }} />
            </div>
          </>
        )}
        {tab === 'transactions' && <Transactions data={store.data} onDelete={handleDelete} onEdit={handleEdit} />}
        {tab === 'goals' && <Goals data={store.data} onAdd={store.addGoal} onContribute={store.contributeGoal} onDelete={store.deleteGoal} />}
        {tab === 'subscriptions' && <Subscriptions data={store.data} onAdd={store.addSubscription} onDelete={store.deleteSubscription} />}
        {tab === 'achievements' && <Achievements data={store.data} />}
        {tab === 'reports' && <Reports data={store.data} />}
        {tab === 'settings' && <Settings data={store.data} onUpdate={store.updateSettings} onExport={store.doExport} onImport={store.doImport} onReset={store.doReset} onCurrencyChange={(c) => store.setProfile({ ...store.data.profile!, currency: c })} />}
      </main>

      {/* Quick actions FAB */}
      <QuickActions onAddTransaction={handleAddTransaction} onTransferToSavings={handleTransferToSavings} onNote={handleNote} />

      {/* Add transaction modal */}
      <AddTransactionModal open={showAdd} onClose={() => { setShowAdd(false); setEditing(null); }} onAdd={handleAddTransaction} editing={editing} />

      {/* Toast */}
      {toast && <Toast message={toast.msg} onUndo={toast.undo} onClose={() => setToast(null)} />}
    </div>
  );
}

export default App;
