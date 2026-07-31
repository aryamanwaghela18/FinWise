import { useState } from 'react';
import { Zap, Sparkles, AlertCircle } from 'lucide-react';
import type { Transaction } from '../types';
import { parseTransactionSMS, todayStr, formatMoney } from '../utils';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../icons';

export function QuickLog({
  currency,
  onLog,
}: {
  currency: string;
  onLog: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ category: Transaction['category']; amount: number; merchant: string; type: Transaction['type'] } | null>(null);

  const handleLog = () => {
    const parsed = parseTransactionSMS(text);
    if (!parsed) {
      setPreview(null);
      setError("Couldn't detect an amount. Paste a bank/UPI SMS like \"Debited Rs 250 to Swiggy\".");
      return;
    }

    const now = new Date();
    onLog({
      type: parsed.type,
      amount: parsed.amount,
      category: parsed.category,
      date: todayStr(),
      time: now.toTimeString().slice(0, 5),
      paymentMethod: parsed.paymentMethod,
      description: parsed.merchant,
      favourite: false,
    });

    setPreview({ category: parsed.category, amount: parsed.amount, merchant: parsed.merchant, type: parsed.type });
    setError(null);
    setText('');
  };

  const PreviewIcon = preview ? CATEGORY_ICONS[preview.category] : null;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-display text-sm font-bold text-white">Quick Log <span className="text-slate-400 font-medium">(Paste Bank/UPI SMS)</span></h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setError(null); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleLog();
            }
          }}
          rows={2}
          placeholder="e.g. Debited Rs 250 to Swiggy on 12-Aug via UPI"
          className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
        />
        <button
          onClick={handleLog}
          disabled={!text.trim()}
          className="flex items-center justify-center gap-1.5 shrink-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
          Auto-Fill &amp; Log
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 mt-2.5 text-xs text-error-400">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {preview && PreviewIcon && (
        <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-300">
          <span className="text-success-400 font-medium">Logged:</span>
          <span
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1"
            style={{ backgroundColor: `${CATEGORY_COLORS[preview.category]}20`, color: CATEGORY_COLORS[preview.category] }}
          >
            <PreviewIcon className="w-3.5 h-3.5" />
            {preview.category}
          </span>
          <span className="text-white font-medium truncate">{preview.merchant}</span>
          <span className={`ml-auto font-semibold tabular-nums ${preview.type === 'income' ? 'text-success-400' : 'text-white'}`}>
            {preview.type === 'income' ? '+' : '-'}{formatMoney(preview.amount, currency)}
          </span>
        </div>
      )}
    </div>
  );
}
