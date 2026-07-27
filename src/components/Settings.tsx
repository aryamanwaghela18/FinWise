import { useRef, useState } from 'react';
import { Moon, Sun, Download, Upload, Trash2, Bell, Coins, User, AlertTriangle } from 'lucide-react';
import type { AppData, Settings as SettingsType } from '../types';
import { CURRENCIES } from '../types';
import { Modal } from './Modal';

export function Settings({ data, onUpdate, onExport, onImport, onReset, onCurrencyChange }: {
  data: AppData;
  onUpdate: (patch: Partial<SettingsType>) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onCurrencyChange: (c: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showReset, setShowReset] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      setImportMsg('Data imported successfully!');
      setTimeout(() => setImportMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-sm text-slate-400">Customize your FinWise experience</p>
      </div>

      {/* Profile card */}
      {data.profile && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">{data.profile.name}</h3>
              <p className="text-xs text-slate-400">{data.profile.college} · {data.profile.financialGoal}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white/5 rounded-lg p-2.5">
              <p className="text-xs text-slate-400">Pocket Money</p>
              <p className="text-white font-medium">{data.profile.currency}{data.profile.monthlyPocketMoney}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5">
              <p className="text-xs text-slate-400">Income</p>
              <p className="text-white font-medium">{data.profile.currency}{data.profile.monthlyIncome}</p>
            </div>
          </div>
        </div>
      )}

      {/* Appearance */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-display font-semibold text-white mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.settings.theme === 'dark' ? <Moon className="w-5 h-5 text-accent-400" /> : <Sun className="w-5 h-5 text-warning-400" />}
            <div>
              <p className="text-sm text-white">Theme</p>
              <p className="text-xs text-slate-400">{data.settings.theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
            </div>
          </div>
          <button onClick={() => onUpdate({ theme: data.settings.theme === 'dark' ? 'light' : 'dark' })}
            className="relative w-12 h-6 rounded-full bg-white/10 transition-colors">
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${data.settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h3 className="font-display font-semibold text-white">Preferences</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-accent-400" />
            <div>
              <p className="text-sm text-white">Notifications</p>
              <p className="text-xs text-slate-400">Reminders & alerts</p>
            </div>
          </div>
          <button onClick={() => onUpdate({ notifications: !data.settings.notifications })}
            className="relative w-12 h-6 rounded-full bg-white/10 transition-colors">
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${data.settings.notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins className="w-5 h-5 text-warning-400" />
            <div>
              <p className="text-sm text-white">Currency</p>
              <p className="text-xs text-slate-400">{data.profile?.currency}</p>
            </div>
          </div>
          <button onClick={() => setShowCurrency(true)} className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-colors">
            Change
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <h3 className="font-display font-semibold text-white">Data Management</h3>
        <button onClick={onExport} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left">
          <Download className="w-5 h-5 text-success-400" />
          <div>
            <p className="text-sm text-white">Export Data</p>
            <p className="text-xs text-slate-400">Download a JSON backup</p>
          </div>
        </button>
        <button onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left">
          <Upload className="w-5 h-5 text-primary-400" />
          <div>
            <p className="text-sm text-white">Import Data</p>
            <p className="text-xs text-slate-400">Restore from a JSON backup</p>
          </div>
        </button>
        <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
        {importMsg && <p className="text-success-400 text-sm px-3">{importMsg}</p>}
        <button onClick={() => setShowReset(true)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-error-500/10 hover:bg-error-500/20 transition-colors text-left">
          <Trash2 className="w-5 h-5 text-error-400" />
          <div>
            <p className="text-sm text-error-400">Reset All Data</p>
            <p className="text-xs text-slate-400">Delete everything and start fresh</p>
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-slate-500 py-2">FinWise AI · All data stored locally on your device</p>

      {/* Currency modal */}
      <Modal open={showCurrency} onClose={() => setShowCurrency(false)} title="Select Currency" maxWidth="max-w-sm">
        <div className="grid grid-cols-3 gap-2">
          {CURRENCIES.map((c) => (
            <button key={c} onClick={() => { onCurrencyChange(c); setShowCurrency(false); }}
              className={`py-4 rounded-xl text-xl font-bold transition-all ${data.profile?.currency === c ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
              {c}
            </button>
          ))}
        </div>
      </Modal>

      {/* Reset confirm */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReset(false)} />
          <div className="glass relative rounded-2xl p-6 max-w-sm w-full animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-error-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error-400" />
              </div>
              <h3 className="font-display font-bold text-white">Reset all data?</h3>
            </div>
            <p className="text-sm text-slate-400 mb-5">This will permanently delete your profile, transactions, goals, and settings. This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowReset(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10">Cancel</button>
              <button onClick={() => { onReset(); setShowReset(false); }} className="flex-1 py-2.5 rounded-xl bg-error-500 text-white font-medium hover:opacity-90">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
